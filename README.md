# MDFriday Share

Right-click a single note. Get a public link. No account, no Git.

**[Watch the usage guide on YouTube](https://www.youtube.com/watch?v=07IlBQnyoDM)**

[![MDFriday Share — usage guide](https://img.youtube.com/vi/07IlBQnyoDM/maxresdefault.jpg)](https://www.youtube.com/watch?v=07IlBQnyoDM)

1. Install **MDFriday Share** (desktop).
2. Right-click a note → Share.
3. Copy the public URL.

- Website: https://mdfriday.com
- Help: https://help.mdfriday.com
- X / Twitter: https://x.com/szm_tech — DM for questions, or follow for updates

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
| Protocol | `obsidian://mdfriday-share?event=…` |
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

