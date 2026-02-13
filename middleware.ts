/**
 * Vercel Edge Middleware: Redirect mobile users from propertpro.com to m.propertpro.com
 *
 * Runs before the request is processed. Detects mobile User-Agents and redirects
 * to the mobile-optimized site while preserving the requested path.
 */

import { next } from "@vercel/functions";

const MOBILE_SITE = "https://m.propertpro.com";

/** Regex to detect mobile devices (phones and tablets) */
const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;

/** Crawlers/bots - do NOT redirect (preserve SEO indexing of desktop site) */
const BOT_UA =
  /Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|W3C_Validator|whatsapp|applebot|semrushbot|ahrefsbot|petalbot/i;

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const userAgent = request.headers.get("user-agent") ?? "";

  // Only redirect on main site domains (propertpro.com, www.propertpro.com)
  if (!host.endsWith("propertpro.com") || host === "m.propertpro.com" || host === "api.propertpro.com") {
    return next();
  }

  // Skip redirect for bots/crawlers (SEO)
  if (BOT_UA.test(userAgent)) {
    return next();
  }

  // Allow ?desktop=1 to force desktop view (sets cookie for future requests)
  const forceDesktop = url.searchParams.get("desktop") === "1" || url.searchParams.get("desktop") === "true";
  if (forceDesktop) {
    const cleanSearch = url.search.replace(/[?&]desktop=(1|true)/gi, "").replace(/^&/, "?") || "";
    const redirectTo = url.pathname + cleanSearch || "/";
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        "Set-Cookie": "propertpro_desktop=1; path=/; max-age=2592000; SameSite=Lax",
      },
    });
  }

  // Check for desktop preference cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (cookieHeader.includes("propertpro_desktop=1")) {
    return next();
  }

  // Skip redirect for API, auth, sitemaps, and static assets
  const path = url.pathname;
  if (
    path.startsWith("/api/") ||
    path.startsWith("/accounts/") ||
    path.startsWith("/oauth/") ||
    path.startsWith("/sitemap") ||
    path === "/robots.txt" ||
    path === "/favicon.ico" ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|webmanifest|xml)$/i.test(path)
  ) {
    return next();
  }

  // Redirect mobile users to m.propertpro.com
  if (MOBILE_UA.test(userAgent)) {
    const redirectUrl = `${MOBILE_SITE}${path}${url.search}`;
    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  }

  return next();
}
