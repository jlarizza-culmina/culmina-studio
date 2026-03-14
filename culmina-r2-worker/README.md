# Culmina R2 Worker API

Cloudflare Workers API for Culmina's document repository and content distribution, backed by R2 object storage.

## Architecture

```
Culmina Studio (React)
    │
    ├── Document Repository ──→ Workers API ──→ R2: culmina-docs
    │   (manuscripts, extracts,                  /{user_id}/{title_slug}/{folder}/{file}
    │    legal, exports, imports)
    │
    └── Distribution ─────────→ Workers API ──→ R2: culmina-dist
        (episodes, scripts,                      /{title_slug}/{episode_slug}/{file}
         audio, signed URLs)

Supabase ── Auth (JWT verification)
         ── Metadata (titles, users, production state)
```

## R2 Bucket Structure

### Document Repository (`culmina-docs`)
```
{user_id}/
  {title_slug}/
    manuscripts/            ← Original manuscript files
    manuscript-extracts/    ← Extracted scenes, chapters
    legal-documents/        ← Contracts, licenses
    exported-documents/     ← Episodes, scripts, bibles
    imported-documents/     ← Source material, references
    other/                  ← Miscellaneous
```

### Distribution (`culmina-dist`)
```
{title_slug}/
  {episode_slug}/
    episode.mp4             ← Video content
    script.pdf              ← Episode script
    soundtrack.mp3          ← Audio
    thumbnail.jpg           ← Artwork
```

## Setup

### 1. Cloudflare Account & R2
1. Sign up at https://dash.cloudflare.com/sign-up/r2
2. Create two buckets:
   - `culmina-docs` (document repository)
   - `culmina-dist` (distribution content)

### 2. Install Dependencies
```bash
cd culmina-r2-worker
npm install
```

### 3. Configure Secrets
```bash
# Your Supabase JWT secret (Settings → API → JWT Secret)
npx wrangler secret put SUPABASE_JWT_SECRET

# Your Supabase URL
npx wrangler secret put SUPABASE_URL
```

### 4. Local Development
```bash
npm run dev
# Worker runs at http://localhost:8787
```

### 5. Deploy
```bash
npm run deploy
# Deploys to https://culmina-r2-api.{your-subdomain}.workers.dev
```

## API Routes

### Document Repository (all routes require Supabase JWT)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/docs/users/{uid}/titles` | List title directories |
| `GET` | `/api/docs/users/{uid}/titles/{slug}/folders` | List folders with file counts |
| `GET` | `/api/docs/users/{uid}/titles/{slug}/{folder}` | List files in folder |
| `PUT` | `/api/docs/users/{uid}/titles/{slug}/{folder}/{file}` | Upload file |
| `GET` | `/api/docs/users/{uid}/titles/{slug}/{folder}/{file}` | Download file |
| `DELETE` | `/api/docs/users/{uid}/titles/{slug}/{folder}/{file}` | Delete file |

### Distribution

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/dist/{slug}/{ep}/{file}` | Serve content (auth or signed URL) |
| `PUT` | `/api/dist/{slug}/{ep}/{file}` | Upload dist asset (auth required) |
| `POST` | `/api/dist/signed-url` | Generate time-limited access URL |

### Utility

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | Health check |

## Client SDK

Copy `client/r2-client.ts` into your Culmina Studio project:

```typescript
import { r2Client } from './lib/r2-client';
import { supabase } from './lib/supabase';

const r2 = r2Client({
  workerUrl: 'https://culmina-r2-api.your-subdomain.workers.dev',
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
});

// List titles
const { titles } = await r2.listTitles(userId);

// Upload a manuscript
await r2.uploadFile(userId, 'the-scarlet-pimpernel', 'manuscripts', file, {}, (progress) => {
  console.log(`Upload: ${Math.round(progress * 100)}%`);
});

// Generate signed URL for episode distribution
const { url } = await r2.getSignedUrl(
  'the-scarlet-pimpernel/ep01/episode.mp4',
  3600 // 1 hour expiry
);
```

## Key Design Decisions

- **Two buckets**: Docs are private/internal, dist content has different caching/access patterns
- **Fixed folder structure**: Enforced at the API level — the Worker validates folder names
- **Supabase JWT auth**: Reuses your existing auth system, no separate auth layer
- **Signed URLs for distribution**: Time-limited access without exposing auth tokens
- **Range request support**: Video/audio streaming with seek support
- **CDN caching**: Distribution content cached aggressively (7 days at edge)
- **Custom metadata**: Attach key-value metadata to any upload via `X-Culmina-Meta-*` headers
