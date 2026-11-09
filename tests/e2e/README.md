# MDFriday Share — E2E (`tests/e2e`)

Owned by **obsidian-share**. Does **not** modify `obsidian-publish`. Cloudflare’s
`e2e:staging` / PluginDriver still target Publish (see `../PLUGIN-MIGRATION-DEBT.md`).

## What this suite covers

| Test | Type | Asserts |
|------|------|---------|
| `00-packaging` | Local | `mdfriday-share` manifest, smoke-vault plugin install |
| `01-guest-share-note` | Staging network | Guest mint → note bind/build/publish → `share.fsky.top` 200 → `expiresAt` ≈ **7d** → client `obsidian-share/<ver>` |
| `02-password-headless` | Staging network | Password encrypt → locked HTML → wrong `#password=` stays locked → correct unlocks + fragment strip |
| `ui/01-ui-password-journey` | Headed Obsidian (CDP) | Password switch → publish → visitor `#password=` unlock |

Headless tests use `@mdfriday/core` + Share `theme-config` (same path as the plugin). UI tests drive Obsidian.app over CDP.

## Run against staging

```bash
cd /Users/sunwei/github/sunwei/workspace/obsidian-share
npm run test:e2e:staging          # headless only (00/01/02)
npm run test:e2e:password         # headless + UI password journey (completion gate)
```

Or separately:

```bash
npm run build:smoke
MDF_E2E_ENV=staging npm run test:e2e
MDF_E2E_ENV=staging npm run test:e2e:ui:password
```

Env:

| Var | Default | Meaning |
|-----|---------|---------|
| `MDF_E2E_ENV` | `staging` | Only staging supported today |
| `E2E_SKIP=1` | — | Skip network suite |
| `E2E_SKIP_UI=1` | — | Skip headed Obsidian UI tests |
| `E2E_SKIP_PASSWORD=1` | — | Skip password headless + UI |
| `E2E_KEEP_DATA=1` | — | Do not DELETE the staging project after run |
| `MDFRIDAY_CORE_DIR` | sibling `../core` | Override core package |

Requires: network to `api.fsky.top` / `share.fsky.top`, built `@mdfriday/core` (`../core/dist`). UI password journey also needs Obsidian.app on macOS.
