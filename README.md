# MDFriday Share

Right-click a single note. Get a public link. No account, no Git.

1. Install **MDFriday Share** (desktop).
2. Right-click a note → Share.
3. Copy the public URL.

- Website: https://mdfriday.com
- Help: https://help.mdfriday.com
- Discord: https://discord.gg/t7FHJ6qNzT

## Plans (product)

| Stage | Who | Storage | Content TTL |
|-------|-----|---------|-------------|
| Guest | Not signed in | 100 MB | **7 days** rolling (product target; API may still use next UTC midnight until Phase 4) |
| Free | Signed in / claimed | 200 MB | Site permanent; account idle archive ~180 days |

Share is the free acquisition surface. Digital Garden / site features live in a separate plugin.

## Identity

| Item | Value |
|------|-------|
| Plugin id | `mdfriday-share` |
| Sidebar view | `MDFriday_Share` |
| Icon | `dice-1` |
| Protocol | `obsidian://mdfriday?plugin=share&event=…` |
| Client header | `obsidian-share/<version>` |
| Engine | `@mdfriday/core` (`file:../core`) |

## Dev

```bash
npm install
npm run dev      # watch → sunwei/workspace/obsidian/.obsidian/plugins/mdfriday-share
npm run build    # production main.js + styles.css
```

See `ITERATION-PLAN.md` for the cut-from-publish roadmap.


## Scripts

| Command | Purpose |
|---------|---------|
| `npm run lint` / `lint:ci` | Official Obsidian ESLint (`eslint-plugin-obsidianmd`), same as Publish |
| `npm test` | Unit tests |
| `npm run build:smoke` | Staging build → `tests/smoke-vault` |
| `npm run test:e2e:staging` | Headless guest→share E2E against staging |

