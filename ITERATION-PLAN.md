# MDFriday Share — 迭代计划清单

> 仓路径：`/Users/sunwei/github/sunwei/workspace/obsidian-share`  
> 原则：从 `obsidian-publish` **copy → 裁剪 → 轻改**；**不动**旧仓为唯一真相。  
> 发布主流程不变：Guest 静默 mint → bind note/`hostingMode:share` → upload → `/s/{id}/`。  
> Share = 免费获客面；UI 比 Publish 更薄。  
> 更新日期：2026-11-06（Asia/Shanghai）

---

## 仍欠（手工 / 部署 / E2E）

> Phase 0–5 代码与 Phase 6 **文档**已完成。Staging 已部署（2026-11-06 Asia/Shanghai）。下面未勾项需 Wayde 本地 Vault smoke → 再 E2E。

- [ ] **Vault smoke**（专用真实 vault，**不要**再混用主 `obsidian/` 库做 Share 验收）:
  - **Vault 路径**：`tests/smoke-vault/`（本仓内）
  - **打开**：Obsidian → Open folder as vault → 选该目录；或 `npm run open:smoke-vault`
  - **构建同步**：`npm run build:smoke`（=`MDF_CF_ENV=staging` build + symlink/copy 进 `.obsidian/plugins/mdfriday-share/`）
  - **仅启用** `mdfriday-share`（无 Publish）；侧栏 `dice-1` / view `MDFriday_Share`；hover **Share service**；顶栏 **MDFriday Share**；双 TAB **发布 + 历史**
  - **步骤**：打开 `Notes/sample-share-note.md` → 右键/Share → 期望 `https://share.fsky.top/s/…` + ~7 天过期
  - **说明**：见 `tests/smoke-vault/README.md`；`data.json` 已 gitignore
  - **2026-11-06 ~10:20 CST (Asia/Shanghai)**：smoke-vault 已创建；`build:smoke` 已把 staging 产物同步进 vault。**待 Wayde** 在 Obsidian 打开该 vault 做 UI 右键分享。Share 仓内 `test:e2e:staging` 已落地；cloudflare **默认** `e2e:staging` 已改为平台-only（插件套件可选）。
- [x] **Deploy staging**：① Cloudflare API `deploy:api:staging`（Guest **7 天滚动**，version `b76537d5-7b51-4088-aa16-dbd0729524fe` → `https://api.fsky.top` / `mdfriday-api-staging.wsun191.workers.dev`）② website `build:staging` + `deploy:staging` → `mdfriday-www-staging` / `https://fsky.top/`（Account **双 protocol**）。**未改** `obsidian-publish`
- [x] **Share-owned E2E**（`tests/e2e/`）：`npm run test:e2e:staging` — guest note → share.fsky.top + 7d expiry + `obsidian-share/` client（headless core；非 UI）
- [x] **Cloudflare 默认 e2e:staging**：已改为**仅平台**（00/01/02/08）；03/05/09/10 为可选（`e2e:staging:plugin` / `e2e:obsidian`），仍可指向 Publish，**不**阻塞 CF 默认门禁；Share 旅程以本仓 `test:e2e:staging` 为准（见 `../PLUGIN-MIGRATION-DEBT.md`）
- [ ] Share 与 Publish **data.json 不自动共用** Key（文档已记；用户可手动粘贴同一 Credential）

---

## Smoke vault（真实 Obsidian）

| 项 | 值 |
|----|----|
| 路径 | `tests/smoke-vault/` |
| 插件目录 | `tests/smoke-vault/.obsidian/plugins/mdfriday-share/` |
| 刷新 | `npm run build:smoke` → Obsidian Reload |
| 打开 | Open folder as vault，或 `npm run open:smoke-vault` |
| 环境 | staging（`api.fsky.top` / `share.fsky.top`） |
| 文档 | `tests/smoke-vault/README.md` |

---


### UX fix (2026-11-06 Asia/Shanghai)

- Leaf hover: **Share service** (`server.ts`; sentence case for `obsidianmd/ui/sentence-case`)
- Panel logo title: `MDFriday Publish` → **MDFriday Share** (`PublishPanel.svelte`)
- Restored second tab **History** from Publish (`HistorySection.svelte` + tab chrome); Guest/Free see locked upgrade CTA; Personal gets rollback list
- `npm run build:smoke` synced; unit + e2e to be re-run


### Lint (2026-11-06 Asia/Shanghai)

- Same stack as `obsidian-publish`: `eslint` + **`eslint-plugin-obsidianmd`** (official) via `eslint.config.js` (`obsidianmd.configs.recommended` + gradual overrides).
- Scripts (unchanged, already copied): `npm run lint` → `eslint src/`; also `lint:fix`, `lint:ci` (`--max-warnings=0`).
- Verified clean: `lint` exit 0, `lint:ci` exit 0. Fixes: `console.info`→`console.debug` (`main.ts`); `getDisplayText` → `"Share service"`; `window.setTimeout` in `build-analytics.ts`.

## 身份表（钉死）

| 项 | 值 |
|----|----|
| Plugin id / 安装目录 | `mdfriday-share` → `.obsidian/plugins/mdfriday-share` |
| manifest.name | `MDFriday Share` |
| description | 禁止出现 “Obsidian” |
| isDesktopOnly | `true` |
| Sidebar view type | `MDFriday_Share`（取代 `Friday_Service`） |
| Sidebar hover (`getDisplayText`) | `Share service` (sentence case; official eslint-plugin-obsidianmd) |
| Panel brand title | `MDFriday Share` |
| Sidebar tabs | `发布/Publish` + `历史/History`（同 Publish） |
| Ribbon / 命令图标 | `dice-1`（一点骰子） |
| Protocol | **分插件 action** `obsidian://mdfriday-share?event=…`（另有 garden / publish） |
| Protocol 常量 | `OBSIDIAN_PROTOCOL_ACTION = 'mdfriday-share'`，`OBSIDIAN_PROTOCOL_PLUGIN = 'share'` |
| Client 头 | `X-MDFriday-Client: obsidian-share/<version>` |
| 引擎依赖 | `@mdfriday/core` → `file:../core`（**不用** foundry tgz） |
| 版本起点 | `26.11.0` |

Handler：注册 `mdfriday-share`；若带 `plugin=` 且不是 `share` 则忽略。

---

## 产品 / 套餐（本仓不改 Cloudflare API shape）

| 阶段 | 谁 | 配额 | 有效期 |
|------|-----|------|--------|
| Guest | 未登录 | 100 MB | **7 天滚动**（staging 已部署；create `expiresAt ≈ now+7d` 已冒烟） |
| Free | 登录 / Claim 同一 Key | 现 Free（200 MB 等） | 站永久；账号闲置 ~180 天归档 |

插件：有 `expiresAt` / `contentExpiresAt` 就本地存并展示；**以后台 cleanup 为准**。

---

## NON-goals（本迭代轨不做）

- **不动** `obsidian-publish`（无双注册）；website Account 临时兼容两套 protocol
- 不在本轨改 Cloudflare 套餐模型 / 新 API shape（Guest 7d 代码在 Phase 4；**staging 已部署**）
- 不做 folder / wiki / Digital Garden
- 不做 Domain / Subscribe / site 高级（title/logo/nav）
- 不做 Turnstile 校验 UI
- 不强制本仓 git commit / force-push
- 不切换 E2E / PluginDriver（debt 已文档化，代码改动另开）

---

## Phase 0 — Repo scaffold

- [x] 创建 `sunwei/workspace/obsidian-share/`
- [x] 写入本文件 `ITERATION-PLAN.md`
- [x] 从 `obsidian-publish` 选择性拷贝（`src/`、esbuild、tsconfig、eslint、version-bump、scripts、manifest、package、tests、LICENSE…）
- [x] 排除 `node_modules`、`main.js`、`.git`、`ux/`、大 GIF/MP4、`package-lock.json`
- [x] manifest → `mdfriday-share` / `MDFriday Share` / 无 “Obsidian” / `isDesktopOnly`
- [x] package.json → `obsidian-share`，依赖 `@mdfriday/core: file:../core`，去掉 foundry tgz
- [x] View type → `MDFriday_Share`（`main.ts` + CSS `data-type`）
- [x] Icon → `dice-1`
- [x] Protocol → `mdfriday` + `plugin=share` 过滤
- [x] Client header → `obsidian-share/<version>`
- [x] esbuild outdir → `…/obsidian/.obsidian/plugins/mdfriday-share`
- [x] `@mdfriday/foundry` import 字符串替换为 `@mdfriday/core`
- [x] `npm install` + `npm run build` 冒烟 — build OK 2026-11-06
- [x] Domain/Subscribe 等文件删除留给 Phase 1 — done in Phase 1

---

## Phase 1 — Strip non-Share UI

- [x] 去掉 folder/wiki：菜单拒 folder；`selectionKindFromContents` 恒 note；主题过滤 note-only；folder 模式 UI 已删
- [x] 删除 `DomainSection` / `SubscribeSection` / `AccessSection` / `HistorySection` / `subscribe/*` / `dns-host`
- [x] 去掉 site 高级：PublishPanel Advanced 整块移除（title/logo/favicon/nav/domain）
- [x] 去掉 Turnstile verify UI；协议 `event=turnstile` 直接忽略；guest 静默 mint
- [x] Settings = Credential + Workspace ID 仅此
- [x] 命令 / 右键菜单仅 note；移除 `export-subscribers`
- [x] Access 面板已删；**History TAB 已迁回**（与 Publish 双 TAB 一致：发布 / 历史；Guest/Free 锁定升级）— 2026-11-06 UX fix
- [x] 清理 mobile / license 噪音：mobile init 改为 no-op；跳过 LicenseStateManager 初始化
- [x] 修掉删除文件后的 import；`npm run build` 通过

---

## Phase 2 — Wire core + smoke

- [x] 确认 `@mdfriday/core` 桌面 API 与旧 foundry 对齐处可编译（无 `@mdfriday/foundry` 残留；`npm run build` OK）
- [x] `npm run build` 成功；产物可装到 `.obsidian/plugins/mdfriday-share`
- [ ] 与 Publish **同 vault 并存**（id / view / protocol / 目录均不冲突）— **需 Wayde 在 Obsidian 里启用插件验证**
- [ ] 手动：打开侧栏 → Guest mint → 分享一篇笔记（staging）— **需 Wayde 手工 smoke**

---

## Phase 3 — Expiry UX（插件）

- [x] 持久化并展示 `contentExpiresAt` / `expiresAt`（pathConfigs + 面板「Expires in N days」；无 API 值则不显示、不客户端伪造 7 天）
- [x] 前端只预警；**服务端 cleanup 为真相**
- [x] Claim CTA：`openAccountInBrowser` 带 `plugin=share` + `return_protocol=obsidian://mdfriday-share?…`

---

## Phase 4 — Cloudflare Guest 7d（**独立**，不阻塞 Share scaffold）

> 改 `cloudflare` 仓。Deploy staging/prod 需 Wayde 确认后再做。

- [x] `GUEST` `retentionDays = 7`（真源）
- [x] create / guest mint hint / account fallback 使用 `t + retentionDays`
- [x] 测试 + website 产品/定价文案源（对用户说「7 天后失效」）
- [x] **不**新开 API shape；仍用现有 `expires_at`
- [ ] **Deploy** cloudflare API（staging → prod）— **未做**

---

## Phase 5 — Website deep links（双 protocol；Publish 不动）

- [x] **Publish 双注册 — 已撤回 / 不做**：`obsidian-publish` 保持仅 `mdfriday-publish`
- [x] Website Account **分插件 action**（Obsidian 每 action 只能注册一次）：
  - Share → **`obsidian://mdfriday-share?event=…`**
  - Garden → **`obsidian://mdfriday-garden?event=…`**
  - Publish / 缺省 → **`obsidian://mdfriday-publish?event=…`**
  - 优先显式 `return_protocol`；bare `obsidian://mdfriday?…` 仅作旧 Share 过渡 allowlist
- [x] `account-flow.js` / `guest-challenge.njk`（en+zh）已按上表改；部署前需重建 / 同步 public
- [ ] **Website deploy** — **未做**（不依赖 Publish 改动）

---

## Phase 6 — Debt / docs（本 Phase：仅文档）

- [x] 更新 `sunwei/workspace/PLUGIN-MIGRATION-DEBT.md`（Share 仓现状、统一 protocol、Guest 7d 未部署、E2E 仍指旧仓、vault smoke / deploy 仍欠）
- [x] 文档记明：Share 与 Publish **data.json 不自动共用** Key（可手动粘贴）
- [x] 本文件顶部列出仍欠手工 smoke / deploy / E2E
- [x] CF 默认套件**不再要求** 03/05/09/10（可选 `E2E_PLUGIN` / `e2e:obsidian`）— 2026-11-06
- [ ] PluginDriver / 可选 E2E-03·05·09·10 **迁到插件仓或改指向** — **不做本轮**（另开；见 debt §1–§3）

---

## 建议落地顺序（回顾）

1. Phase 0–1 scaffold + 裁剪 — **done**
2. Phase 2 真机 smoke — **待 Wayde**
3. Phase 3 过期展示 — **done**
4. Phase 4 Guest 7d 代码 — **done**；deploy **待**
5. Phase 5 website 双 protocol — **代码 + staging build done**；Publish **未改**；website deploy **待**
6. Phase 6 文档 — **done**；CF 默认 E2E 归属已调；插件 E2E 迁移 **另开**
