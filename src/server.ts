import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { runWithCfEnv, type CfEnv } from "./lib/cf-context";
import { getDB, newId } from "./db/index";
import { verifyIntaSendWebhook, parseApiRef } from "./lib/intasend";

// TanStack Start's file-based router only recognizes routes that export `Route` —
// `createAPIFileRoute`/`APIRoute` isn't wired up in this version, so API-only
// endpoints are handled here instead, directly in the real Worker entry point,
// before anything is handed to the TanStack handler.

// IntaSend's Cloudflare zone rejects outbound requests from our Worker (Cloudflare
// error 1106 — see lib/intasend.ts), so payments are confirmed via this inbound
// webhook instead of the Worker polling IntaSend's status API.
async function handleIntaSendWebhook(request: Request): Promise<Response> {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.challenge !== undefined && !verifyIntaSendWebhook(payload)) {
    return new Response("Invalid challenge", { status: 401 });
  }

  const state = payload.state as string | undefined;
  const invoiceId = payload.invoice_id as string | undefined;
  const apiRef = payload.api_ref as string | undefined;
  if (!invoiceId || !apiRef || (state !== "COMPLETE" && state !== "FAILED")) {
    return new Response("OK", { status: 200 });
  }

  const parsed = parseApiRef(apiRef);
  if (!parsed) return new Response("OK", { status: 200 });

  const amount = Number(payload.value ?? payload.net_amount ?? 0);
  const phoneNumber = (payload.account as string | undefined) ?? "";
  const status = state === "COMPLETE" ? "complete" : "failed";

  const db = getDB();
  // INSERT OR IGNORE keyed on invoice_id's UNIQUE constraint makes this idempotent —
  // IntaSend retries undelivered webhooks up to 20 times.
  const inserted = await db
    .prepare(
      "INSERT OR IGNORE INTO mpesa_payments (id, user_id, invoice_id, api_ref, phone_number, tokens, amount_kes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(newId(), parsed.userId, invoiceId, apiRef, phoneNumber, parsed.tokens, amount, status)
    .run();

  if (inserted.meta.changes > 0 && status === "complete") {
    await db
      .prepare("INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .bind(newId(), parsed.userId, parsed.tokens, "purchase", `IntaSend M-Pesa · ${invoiceId}`)
      .run();
  }

  return new Response("OK", { status: 200 });
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return runWithCfEnv(env as CfEnv, async () => {
      const url = new URL(request.url);
      if (url.pathname === "/api/intasend-webhook" && request.method === "POST") {
        try {
          return await handleIntaSendWebhook(request);
        } catch (error) {
          console.error(error);
          return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
        }
      }

      try {
        const handler = await getServerEntry();
        const response = await handler.fetch(request, env, ctx);
        return await normalizeCatastrophicSsrResponse(response);
      } catch (error) {
        console.error(error);
        return brandedErrorResponse();
      }
    });
  },
};
