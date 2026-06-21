import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import appCss from "../styles.css?url";

const SITE_URL = "https://vibelearn.app";
const DEFAULT_TITLE = "VIBELEARN — Learn Coding with AI | React, TypeScript & Web Dev Courses";
const DEFAULT_DESC = "VIBELEARN is the modern tech learning platform where you build real apps with AI. Master React, TypeScript, full-stack development, AI coding, DevOps and UI design — with hands-on lessons, quizzes, and certificates.";
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

const schemaOrg = [
  {
    "@context": "https://schema.org", "@type": "Organization",
    name: "VIBELEARN", url: SITE_URL, logo: `${SITE_URL}/logo.jpeg`,
    description: DEFAULT_DESC,
    contactPoint: { "@type": "ContactPoint", email: "hamisi.911.ltd@gmail.com", contactType: "customer support" },
  },
  {
    "@context": "https://schema.org", "@type": "WebSite",
    name: "VIBELEARN", url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/courses?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org", "@type": "EducationalOrganization",
    name: "VIBELEARN", url: SITE_URL,
    description: "Online tech education platform with courses in React, TypeScript, AI coding, full-stack development, and more.",
    hasOfferCatalog: {
      "@type": "OfferCatalog", name: "Tech Coding Courses",
      itemListElement: [
        { "@type": "Course", name: "Vibecoding — Build Apps with AI" },
        { "@type": "Course", name: "React & TypeScript Mastery" },
        { "@type": "Course", name: "AI & Machine Learning" },
        { "@type": "Course", name: "DevOps & Cloud Engineering" },
        { "@type": "Course", name: "UI Design Systems" },
      ],
    },
  },
];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Try again
          </button>
          <a href="/" className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: DEFAULT_TITLE },
      { name: "description", content: DEFAULT_DESC },
      { name: "keywords", content: "learn to code, coding courses online, AI coding, vibecoding, React tutorial, TypeScript course, full stack web development, JavaScript course, online coding bootcamp, learn frontend development, backend API development, AI machine learning course, DevOps cloud tutorial, earn coding certificate, Tailwind CSS, Cloudflare Workers, coding for beginners" },
      { name: "author", content: "VIBELEARN" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large" },
      { name: "theme-color", content: "#2dd4a8" },
      { name: "color-scheme", content: "dark" },
      // Open Graph
      { property: "og:site_name", content: "VIBELEARN" },
      { property: "og:title", content: DEFAULT_TITLE },
      { property: "og:description", content: DEFAULT_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "VIBELEARN — Learn Coding with AI" },
      { property: "og:locale", content: "en_US" },
      // Twitter / X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: DEFAULT_TITLE },
      { name: "twitter:description", content: DEFAULT_DESC },
      { name: "twitter:image", content: OG_IMAGE },
      // Apple PWA
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "VIBELEARN" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Favicon SVG (modern) + fallbacks
      { rel: "icon", type: "image/jpeg", href: "/logo.jpeg" },
      { rel: "apple-touch-icon", href: "/logo.jpeg" },
      { rel: "shortcut icon", href: "/logo.jpeg" },
      // Web app manifest
      { rel: "manifest", href: "/site.webmanifest" },
      // Canonical
      { rel: "canonical", href: SITE_URL },
      // Sitemap discovery
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      // Fonts
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
