# Smoke vault — MDFriday Share

Real Obsidian vault for authentic Share plugin testing (staging).

**Path:** `obsidian-share/tests/smoke-vault/`

## Prerequisites

- Obsidian desktop installed (`/Applications/Obsidian.app`)
- Node deps in repo root: `npm install`
- Staging API already deployed (`api.fsky.top` / `share.fsky.top`)

## Build & sync plugin into this vault

From `obsidian-share/` repo root:

```bash
npm run build:smoke
```

This runs a **staging** production bundle (`MDF_CF_ENV=staging`) then symlinks
`main.js` / `styles.css` / `manifest.json` into:

`.obsidian/plugins/mdfriday-share/`

After every code change: re-run `build:smoke`, then in Obsidian **Reload app**
(or disable/enable MDFriday Share).

## Open in Obsidian

**Recommended (manual):**

1. Obsidian → **Open folder as vault**
2. Choose this folder:
   `/Users/sunwei/github/sunwei/workspace/obsidian-share/tests/smoke-vault`
3. Trust / enable community plugins if prompted
4. Confirm **MDFriday Share** is enabled (Settings → Community plugins)

**Optional helper** (registers/opens via URI; may prompt if vault is new):

```bash
npm run open:smoke-vault
```

## Smoke steps

1. Open `Notes/sample-share-note.md` (or `Welcome.md`).
2. Click the ribbon **single-pip die** (`dice-1`) or right-click the note → Share.
3. First run may silently mint a Guest key (no Turnstile).
4. Expect:
   - Public URL host: **`share.fsky.top`**
   - Path like `/s/{id}/`
   - Expiry shown ≈ **7 days** (Guest); server cleanup is source of truth
5. Plugin settings: Credential + Workspace ID only (no Domain / Subscribe / site advanced).

## Notes

- Only `mdfriday-share` is enabled here (no Publish) so ids / sidebar / protocol stay clean.
- `data.json` (API key) is **gitignored** — never commit credentials.
- Rebuild refreshes symlinks’ targets at repo root; Obsidian must reload to pick up `main.js`.
## Automated E2E (headless, no Obsidian UI)

From repo root:

```bash
npm run test:e2e:staging
```

Lives in `tests/e2e/` (see `tests/e2e/README.md`). Covers guest→publish→public URL→7d expiry
via `@mdfriday/core` (same order as the plugin). UI right-click remains manual in this vault.
