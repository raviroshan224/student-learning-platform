import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://scholargyan.onecloudlab.com/api/v1";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetPath = path.join("/");

  // Build target URL, preserving query params
  const targetUrl = new URL(`${BACKEND_BASE}/${targetPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Forward relevant headers only
  const forwardHeaders: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) forwardHeaders["authorization"] = auth;

  const contentType = request.headers.get("content-type");
  if (contentType) forwardHeaders["content-type"] = contentType;

  // Read body for non-GET/HEAD methods
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    body = await request.text();
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body,
      // Don't follow redirects — pass them through
      redirect: "manual",
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 502 }
    );
  }

  // Build response headers to forward back to the client
  const responseHeaders = new Headers();
  const resContentType = backendRes.headers.get("content-type");
  if (resContentType) responseHeaders.set("content-type", resContentType);

  // Allow the browser to read the response (no CORS restriction since
  // this is same-origin from the client's perspective)
  responseHeaders.set("access-control-allow-origin", "*");

  // 204 No Content and 304 Not Modified must not carry a body
  if (backendRes.status === 204 || backendRes.status === 304) {
    return new NextResponse(null, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  }

  const responseBody = await backendRes.arrayBuffer();

  return new NextResponse(responseBody, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

// OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PUT,
  proxyRequest as PATCH,
  proxyRequest as DELETE,
};
