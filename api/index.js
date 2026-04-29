// runthis lol mark
export const config = { runtime: "edge" };

const TARGET = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

if (!TARGET) {
  throw new Error("Missing TARGET_DOMAIN environment variable");
}

const EXCLUDED_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
]);

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const destination = TARGET + url.pathname + url.search;

    const headers = new Headers();
    let clientIp = null;

    for (const [key, value] of request.headers) {
      if (EXCLUDED_HEADERS.has(key)) continue;
      if (key.startsWith("x-vercel-")) continue;
      if (key === "x-real-ip" || key === "x-forwarded-for") {
        clientIp = value;
        continue;
      }
      headers.set(key, value);
    }

    if (clientIp) {
      headers.set("x-forwarded-for", clientIp);
    }

    const isBodyAllowed = request.method !== "GET" && request.method !== "HEAD";

    return await fetch(destination, {
      method: request.method,
      headers: headers,
      body: isBodyAllowed ? request.body : undefined,
      duplex: "half",
      redirect: "manual",
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
