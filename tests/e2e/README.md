# MDFriday Share — E2E (`tests/e2e`)

Owned by **obsidian-share**. Does **not** modify `obsidian-publish`. Cloudflare’s
`e2e:staging` / PluginDriver still target Publish (see `../PLUGIN-MIGRATION-DEBT.md`).

## What this suite covers

| Test | Type | Asserts |
|------|------|---------|
| `00-packaging` | Local | `mdfriday-share` manifest, smoke-vault plugin install |
| `01-guest-share-note` | Staging network | Guest mint → note bind/build/publish → `share.fsky.top` 200 → `expiresAt` ≈ **7d** → client `obsidian-share/<ver>` |

Uses the same **headless** path as the plugin (`@mdfriday/core` + Share `theme-config`), not Obsidian UI.

## Not covered (yet)

- Ribbon / right-click UI (use `tests/smoke-vault` + Obsidian desktop)
- Claim / Free upgrade OAuth
- Cloudflare D1 analytics assertions
- Full cloudflare E2E-03/05/09/10 rewrite

## Run against staging

```bash
cd /Users/sunwei/github/sunwei/workspace/obsidian-share
npm run test:e2e:staging
```

Equivalent steps:

```bash
npm run build:smoke          # staging bundle + sync smoke-vault
npm run test:e2e             # node --test tests/e2e/*.test.ts
```

Env:

| Var | Default | Meaning |
|-----|---------|---------|
| `MDF_E2E_ENV` | `staging` | Only staging supported today |
| `E2E_SKIP=1` | — | Skip network suite (`01-…`) |
| `E2E_KEEP_DATA=1` | — | Do not DELETE the staging project after run |
| `MDFRIDAY_CORE_DIR` | sibling `../core` | Override core package |

Requires: network to `api.fsky.top` / `share.fsky.top`, built `@mdfriday/core` (`../core/dist`).
