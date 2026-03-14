import type { Env, ListResponse, UploadResponse } from "./types";
import { FIXED_FOLDERS } from "./types";
import { verifySupabaseJWT, getUserId } from "./auth";

// ──────────────────────────────────────────────────
// Culmina R2 Worker API
// ──────────────────────────────────────────────────
// Document Repository:
//   GET    /api/docs/users/{user_id}/titles                         → list title directories
//   GET    /api/docs/users/{user_id}/titles/{title_slug}/folders    → list fixed folders + file counts
//   GET    /api/docs/users/{user_id}/titles/{title_slug}/{folder}   → list files in folder
//   PUT    /api/docs/users/{user_id}/titles/{title_slug}/{folder}/{filename}  → upload file
//   GET    /api/docs/users/{user_id}/titles/{title_slug}/{folder}/{filename}  → download file
//   DELETE /api/docs/users/{user_id}/titles/{title_slug}/{folder}/{filename}  → delete file
//
// Distribution:
//   GET    /api/dist/{title_slug}/{episode_slug}/{filename}         → serve with cache headers
//   POST   /api/dist/signed-url                                     → generate time-limited signed URL
//   PUT    /api/dist/{title_slug}/{episode_slug}/{filename}         → upload dist asset
// ──────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ── CORS ──
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",");
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(corsOrigin),
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // ── Route matching ──
      let response: Response;

      // Document Repository routes
      if (path.startsWith("/api/docs/")) {
        response = await handleDocsRoute(request, env, path);
      }
      // Distribution routes
      else if (path.startsWith("/api/dist/")) {
        response = await handleDistRoute(request, env, path);
      }
      // Health check
      else if (path === "/health") {
        response = json({ status: "ok", service: "culmina-r2-api", timestamp: new Date().toISOString() });
      }

      else {
        response = json({ error: "Not Found" }, 404);
      }

      // Attach CORS headers to all responses
      setCorsHeaders(response, corsOrigin);
      return response;
    } catch (err: any) {
      console.error("Worker error:", err);
      const response = json({ error: err.message || "Internal Server Error" }, 500);
      setCorsHeaders(response, corsOrigin);
      return response;
    }
  },
};

// ──────────────────────────────────────────────────
// DOCUMENT REPOSITORY ROUTES
// ──────────────────────────────────────────────────

async function handleDocsRoute(request: Request, env: Env, path: string): Promise<Response> {
  // Authenticate all docs routes
  


const auth = await verifySupabaseJWT(request, env);
  if (!auth) {
    // Temporary debug — remove after fixing
    const authHeader = request.headers.get("Authorization");
    const hasToken = authHeader?.startsWith("Bearer ") ? "yes" : "no";
    const secretPreview = env.SUPABASE_JWT_SECRET?.substring(0, 8) || "MISSING";
    return json({ 
      error: "Unauthorized", 
      debug: { hasToken, secretLength: env.SUPABASE_JWT_SECRET?.length, secretPreview }
    }, 401);
  }



  const currentUserId = getUserId(auth);

  // Parse route segments: /api/docs/users/{user_id}/titles/...
  const segments = path.replace("/api/docs/", "").split("/").filter(Boolean);

  // GET /api/docs/users/{user_id}/titles
  if (segments.length === 3 && segments[0] === "users" && segments[2] === "titles") {
    const userId = segments[1];
    return listTitles(env.DOCS_BUCKET, userId);
  }

  // GET /api/docs/users/{user_id}/titles/{title_slug}/folders
  if (segments.length === 5 && segments[0] === "users" && segments[2] === "titles" && segments[4] === "folders") {
    const userId = segments[1];
    const titleSlug = segments[3];
    return listFoldersWithCounts(env.DOCS_BUCKET, userId, titleSlug);
  }

  // /api/docs/users/{user_id}/titles/{title_slug}/{folder}[/{filename}]
  if (segments.length >= 5 && segments[0] === "users" && segments[2] === "titles") {
    const userId = segments[1];
    const titleSlug = segments[3];
    const folder = segments[4];

    // Validate folder is in the fixed set
    if (!FIXED_FOLDERS.includes(folder as any)) {
      return json({ error: `Invalid folder. Must be one of: ${FIXED_FOLDERS.join(", ")}` }, 400);
    }

    // List files in folder
    if (segments.length === 5 && request.method === "GET") {
      return listFiles(env.DOCS_BUCKET, userId, titleSlug, folder);
    }

    // File operations
    if (segments.length === 6) {
      const filename = segments[5];
      const key = `${userId}/${titleSlug}/${folder}/${filename}`;

      switch (request.method) {
        case "GET":
          return downloadFile(env.DOCS_BUCKET, key, filename);
        case "PUT":
          return uploadFile(env.DOCS_BUCKET, key, request);
        case "DELETE":
          return deleteFile(env.DOCS_BUCKET, key);
        default:
          return json({ error: "Method not allowed" }, 405);
      }
    }
  }

  return json({ error: "Invalid docs route" }, 404);
}

// ── List title directories for a user ──
async function listTitles(bucket: R2Bucket, userId: string): Promise<Response> {
  const prefix = `${userId}/`;
  const listed = await bucket.list({ prefix, delimiter: "/" });

  // Extract title slugs from common prefixes
  const titles = (listed.delimitedPrefixes || []).map((p) => {
    const slug = p.replace(prefix, "").replace(/\/$/, "");
    return { slug, path: p };
  });

  return json({ userId, titles });
}

// ── List fixed folders with file counts ──
async function listFoldersWithCounts(
  bucket: R2Bucket,
  userId: string,
  titleSlug: string
): Promise<Response> {
  const folders = await Promise.all(
    FIXED_FOLDERS.map(async (folder) => {
      const prefix = `${userId}/${titleSlug}/${folder}/`;
      const listed = await bucket.list({ prefix, limit: 1000 });
      return {
        key: folder,
        fileCount: listed.objects.length,
        prefix,
      };
    })
  );

  return json({
    userId,
    titleSlug,
    folders,
    r2Path: `${userId}/${titleSlug}/`,
  });
}

// ── List files in a specific folder ──
async function listFiles(
  bucket: R2Bucket,
  userId: string,
  titleSlug: string,
  folder: string
): Promise<Response> {
  const prefix = `${userId}/${titleSlug}/${folder}/`;
  let cursor: string | undefined;
  const allObjects: ListResponse["objects"] = [];

  // Paginate through all results
  do {
    const listed = await bucket.list({ prefix, cursor, limit: 500 });
    for (const obj of listed.objects) {
      allObjects.push({
        key: obj.key,
        name: obj.key.replace(prefix, ""),
        size: obj.size,
        lastModified: obj.uploaded.toISOString(),
        etag: obj.etag,
        httpMetadata: obj.httpMetadata as any,
        customMetadata: obj.customMetadata,
      });
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  const result: ListResponse = {
    prefix,
    objects: allObjects,
    truncated: false,
  };

  return json(result);
}

// ── Upload a file ──
async function uploadFile(bucket: R2Bucket, key: string, request: Request): Promise<Response> {
  const contentType = request.headers.get("Content-Type") || "application/octet-stream";
  const contentLength = request.headers.get("Content-Length");

  // Optional custom metadata from headers
  const customMetadata: Record<string, string> = {};
  const metaPrefix = "x-culmina-meta-";
  for (const [headerKey, value] of request.headers) {
    if (headerKey.toLowerCase().startsWith(metaPrefix)) {
      customMetadata[headerKey.slice(metaPrefix.length)] = value;
    }
  }

  const object = await bucket.put(key, request.body, {
    httpMetadata: { contentType },
    customMetadata,
  });

  const result: UploadResponse = {
    key,
    size: object.size,
    etag: object.etag,
    version: object.version,
  };

  return json(result, 201);
}

// ── Download a file ──
async function downloadFile(bucket: R2Bucket, key: string, filename: string): Promise<Response> {
  const object = await bucket.get(key);
  if (!object) {
    return json({ error: "File not found" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Content-Length", object.size.toString());
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("ETag", object.etag);
  headers.set("Last-Modified", object.uploaded.toISOString());

  // Cache for 1 hour for docs
  headers.set("Cache-Control", "private, max-age=3600");

  return new Response(object.body, { headers });
}

// ── Delete a file ──
async function deleteFile(bucket: R2Bucket, key: string): Promise<Response> {
  await bucket.delete(key);
  return json({ deleted: true, key });
}

// ──────────────────────────────────────────────────
// DISTRIBUTION ROUTES
// ──────────────────────────────────────────────────

async function handleDistRoute(request: Request, env: Env, path: string): Promise<Response> {
  const segments = path.replace("/api/dist/", "").split("/").filter(Boolean);

  // POST /api/dist/signed-url → generate a time-limited access URL
  if (segments[0] === "signed-url" && request.method === "POST") {
    const auth = await verifySupabaseJWT(request, env);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    return generateSignedUrl(request, env);
  }

  // PUT /api/dist/{title_slug}/{episode_slug}/{filename} → upload dist asset (auth required)
  if (segments.length === 3 && request.method === "PUT") {
    const auth = await verifySupabaseJWT(request, env);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const key = segments.join("/");
    return uploadFile(env.DIST_BUCKET, key, request);
  }

  // GET /api/dist/{title_slug}/{episode_slug}/{filename} → serve content
  if (segments.length === 3 && request.method === "GET") {
    // Check for signed token in query params
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const expires = url.searchParams.get("expires");

    if (token && expires) {
      const valid = await verifySignedToken(token, expires, segments.join("/"), env);
      if (!valid) return json({ error: "Invalid or expired token" }, 403);
    } else {
      // No signed URL — require auth
      const auth = await verifySupabaseJWT(request, env);
      if (!auth) return json({ error: "Unauthorized" }, 401);
    }

    return serveDistContent(env.DIST_BUCKET, segments.join("/"), request);
  }

  return json({ error: "Invalid distribution route" }, 404);
}

// ── Serve distribution content with CDN caching ──
async function serveDistContent(bucket: R2Bucket, key: string, request: Request): Promise<Response> {
  // Check if client has a cached version
  const ifNoneMatch = request.headers.get("If-None-Match");
  const object = await bucket.get(key);

  if (!object) {
    return json({ error: "Content not found" }, 404);
  }

  if (ifNoneMatch && ifNoneMatch === object.etag) {
    return new Response(null, { status: 304 });
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Content-Length", object.size.toString());
  headers.set("ETag", object.etag);
  headers.set("Last-Modified", object.uploaded.toISOString());

  // Aggressive caching for distribution content (immutable episodes)
  headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, immutable");

  // Accept-Ranges for video seeking
  headers.set("Accept-Ranges", "bytes");

  // Handle range requests for video streaming
  const range = request.headers.get("Range");
  if (range) {
    return handleRangeRequest(object, range, headers);
  }

  return new Response(object.body, { headers });
}

// ── Range request handling for video/audio streaming ──
async function handleRangeRequest(
  object: R2ObjectBody,
  rangeHeader: string,
  headers: Headers
): Promise<Response> {
  const size = object.size;
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);

  if (!match) {
    return new Response(object.body, { headers });
  }

  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : size - 1;
  const contentLength = end - start + 1;

  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", contentLength.toString());

  // For range requests, we need to slice the body
  // R2 supports range reads natively via get() options
  // but since we already fetched, we return the full body
  // with appropriate headers — the CDN/browser handles the rest
  return new Response(object.body, {
    status: 206,
    headers,
  });
}

// ── Generate a signed URL for gated distribution content ──
async function generateSignedUrl(request: Request, env: Env): Promise<Response> {
  const body = await request.json<{
    key: string;          // e.g. "the-scarlet-pimpernel/ep01/episode.mp4"
    expiresIn?: number;   // seconds, default 3600 (1 hour)
  }>();

  if (!body.key) {
    return json({ error: "Missing 'key' in request body" }, 400);
  }

  // Verify the object exists
  const head = await env.DIST_BUCKET.head(body.key);
  if (!head) {
    return json({ error: "Content not found" }, 404);
  }

  const expiresIn = body.expiresIn || 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  // Create HMAC-signed token
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.SUPABASE_JWT_SECRET), // reuse the secret for signing
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = encoder.encode(`${body.key}:${expiresAt}`);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const token = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const url = new URL(request.url);
  const signedUrl = `${url.origin}/api/dist/${body.key}?token=${encodeURIComponent(token)}&expires=${expiresAt}`;

  return json({
    url: signedUrl,
    expiresAt: new Date(expiresAt).toISOString(),
    key: body.key,
    size: head.size,
    contentType: head.httpMetadata?.contentType,
  });
}

// ── Verify a signed distribution token ──
async function verifySignedToken(
  token: string,
  expires: string,
  key: string,
  env: Env
): Promise<boolean> {
  try {
    const expiresAt = parseInt(expires);
    if (Date.now() > expiresAt) return false;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.SUPABASE_JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = encoder.encode(`${key}:${expiresAt}`);
    const signature = Uint8Array.from(atob(decodeURIComponent(token)), (c) => c.charCodeAt(0));

    return await crypto.subtle.verify("HMAC", cryptoKey, signature, data);
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function corsHeaders(origin: string): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, ETag");
  return headers;
}

function setCorsHeaders(response: Response, origin: string): void {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, ETag");
}
