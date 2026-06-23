import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { runWithCfEnv, type CfEnv } from "./lib/cf-context";
import { getSession } from "./lib/auth";
import { getIntaSendConfig } from "./lib/intasend";

// TanStack Start's file-based router only recognizes routes that export `Route` —
// `createAPIFileRoute`/`APIRoute` isn't wired up in this version, so API-only
// endpoints are handled here instead, directly in the real Worker entry point,
// before anything is handed to the TanStack handler.
function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

// TEMPORARY diagnostic (admin-only) — sends a deliberately invalid (amount=0) request
// so IntaSend rejects it with a validation error before any charge/SMS could trigger.
// Lets us see exactly what IntaSend's edge returns to this Worker's outbound IP.
// Remove once the 403/"error code: 1106" issue is resolved.
async function handleDiagnoseIntasend(request: Request): Promise<Response> {
  const user = await getSession(readCookie(request, "vl_session"));
  if (!user?.isAdmin) return new Response("Not found", { status: 404 });

  const { secretKey, baseUrl } = getIntaSendConfig();
  const res = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "VibeLearn/1.0 (+https://vlapp.glotech.workers.dev)",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({ amount: 0, phone_number: "invalid", currency: "KES", api_ref: "diagnostic-test" }),
  });
  const text = await res.text();
  return new Response(
    JSON.stringify({ status: res.status, headers: Object.fromEntries(res.headers.entries()), body: text }),
    { headers: { "Content-Type": "application/json" } },
  );
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
      if (url.pathname === "/api/diagnose-intasend") {
        try {
          return await handleDiagnoseIntasend(request);
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
