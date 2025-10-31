// Cloudflare Pages Functions middleware
// This enables Next.js SSR on Cloudflare Pages

export async function onRequest(context) {
  // Let Next.js handle all requests
  return await context.next();
}