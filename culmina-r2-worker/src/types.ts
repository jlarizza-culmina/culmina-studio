// ── Cloudflare Worker Environment Bindings ──

export interface Env {
  // R2 bucket bindings (direct access, no API keys)
  DOCS_BUCKET: R2Bucket;
  DIST_BUCKET: R2Bucket;

  // Environment variables
  ALLOWED_ORIGINS: string;

  // Secrets (set via `wrangler secret put`)
  SUPABASE_JWT_SECRET: string;
  SUPABASE_URL: string;
}

// ── R2 Key Structure ──
// Documents:  {user_id}/{title_slug}/{folder_key}/{filename}
// Distribution: {title_slug}/{episode_slug}/{filename}

export const FIXED_FOLDERS = [
  "manuscripts",
  "manuscript-extracts",
  "legal-documents",
  "exported-documents",
  "imported-documents",
  "other",
] as const;

export type FolderKey = (typeof FIXED_FOLDERS)[number];

export interface AuthPayload {
  sub: string;        // Supabase user ID
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

export interface ListResponse {
  prefix: string;
  objects: {
    key: string;
    name: string;
    size: number;
    lastModified: string;
    etag: string;
    httpMetadata?: Record<string, string>;
    customMetadata?: Record<string, string>;
  }[];
  truncated: boolean;
  cursor?: string;
  folders?: string[];
}

export interface UploadResponse {
  key: string;
  size: number;
  etag: string;
  version: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
  key: string;
}
