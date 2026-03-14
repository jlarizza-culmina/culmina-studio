// ──────────────────────────────────────────────────
// Culmina R2 Client SDK
// ──────────────────────────────────────────────────
// Drop this into your Culmina Studio React app.
// Handles all communication with the R2 Worker API.
//
// Usage:
//   import { r2Client } from './lib/r2-client';
//
//   // Initialize with the worker URL and Supabase session
//   const r2 = r2Client({
//     workerUrl: 'https://culmina-r2-api.your-subdomain.workers.dev',
//     getAccessToken: () => supabase.auth.getSession().then(s => s.data.session?.access_token),
//   });
//
//   // List titles for a user
//   const titles = await r2.listTitles(userId);
//
//   // Upload a manuscript
//   await r2.uploadFile(userId, 'the-scarlet-pimpernel', 'manuscripts', file);
// ──────────────────────────────────────────────────

export interface R2ClientConfig {
  workerUrl: string;
  getAccessToken: () => Promise<string | undefined>;
}

export interface R2FileObject {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  etag: string;
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2FolderInfo {
  key: string;
  fileCount: number;
  prefix: string;
}

export function r2Client(config: R2ClientConfig) {
  const { workerUrl, getAccessToken } = config;

  async function headers(): Promise<HeadersInit> {
    const token = await getAccessToken();
    if (!token) throw new Error("Not authenticated");
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    const authHeaders = await headers();
    const res = await fetch(`${workerUrl}${path}`, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error || `R2 API error: ${res.status}`);
    }
    return res.json();
  }

  return {
    // ── Document Repository ──

    /** List all title directories for a user */
    async listTitles(userId: string) {
      return fetchJson<{
        userId: string;
        titles: { slug: string; path: string }[];
      }>(`/api/docs/users/${userId}/titles`);
    },

    /** List fixed folders with file counts for a title */
    async listFolders(userId: string, titleSlug: string) {
      return fetchJson<{
        userId: string;
        titleSlug: string;
        folders: R2FolderInfo[];
        r2Path: string;
      }>(`/api/docs/users/${userId}/titles/${titleSlug}/folders`);
    },

    /** List all files in a specific folder */
    async listFiles(userId: string, titleSlug: string, folder: string) {
      return fetchJson<{
        prefix: string;
        objects: R2FileObject[];
        truncated: boolean;
      }>(`/api/docs/users/${userId}/titles/${titleSlug}/${folder}`);
    },

    /** Upload a file to a folder */
    async uploadFile(
      userId: string,
      titleSlug: string,
      folder: string,
      file: File,
      metadata?: Record<string, string>,
      onProgress?: (progress: number) => void
    ) {
      const authHeaders = await headers();
      const path = `/api/docs/users/${userId}/titles/${titleSlug}/${folder}/${file.name}`;

      const metaHeaders: Record<string, string> = {};
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          metaHeaders[`X-Culmina-Meta-${key}`] = value;
        }
      }

      // Use XMLHttpRequest for progress tracking if callback provided
      if (onProgress) {
        return new Promise<{ key: string; size: number; etag: string; version: string }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", `${workerUrl}${path}`);

            // Set headers
            for (const [key, value] of Object.entries(authHeaders)) {
              xhr.setRequestHeader(key, value as string);
            }
            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
            for (const [key, value] of Object.entries(metaHeaders)) {
              xhr.setRequestHeader(key, value);
            }

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) onProgress(e.loaded / e.total);
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error("Upload failed"));
            xhr.send(file);
          }
        );
      }

      // Simple fetch for no-progress uploads
      const res = await fetch(`${workerUrl}${path}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": file.type || "application/octet-stream",
          ...metaHeaders,
        },
        body: file,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json();
    },

    /** Download a file (returns blob) */
    async downloadFile(userId: string, titleSlug: string, folder: string, filename: string) {
      const authHeaders = await headers();
      const path = `/api/docs/users/${userId}/titles/${titleSlug}/${folder}/${filename}`;
      const res = await fetch(`${workerUrl}${path}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return {
        blob: await res.blob(),
        contentType: res.headers.get("Content-Type") || "application/octet-stream",
        filename,
      };
    },

    /** Delete a file */
    async deleteFile(userId: string, titleSlug: string, folder: string, filename: string) {
      return fetchJson<{ deleted: boolean; key: string }>(
        `/api/docs/users/${userId}/titles/${titleSlug}/${folder}/${filename}`,
        { method: "DELETE" }
      );
    },

    // ── Distribution ──

    /** Upload distribution content (episodes, scripts, etc.) */
    async uploadDistContent(titleSlug: string, episodeSlug: string, file: File) {
      const authHeaders = await headers();
      const path = `/api/dist/${titleSlug}/${episodeSlug}/${file.name}`;
      const res = await fetch(`${workerUrl}${path}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!res.ok) throw new Error(`Dist upload failed: ${res.status}`);
      return res.json();
    },

    /** Generate a signed URL for time-limited access to distribution content */
    async getSignedUrl(key: string, expiresIn = 3600) {
      return fetchJson<{
        url: string;
        expiresAt: string;
        key: string;
        size: number;
        contentType: string;
      }>("/api/dist/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, expiresIn }),
      });
    },
  };
}
