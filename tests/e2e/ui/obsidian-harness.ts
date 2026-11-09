/**
 * Headed Obsidian launcher for Share UI E2E (password journey).
 * Mirrors Garden harness patterns; local mdfriday-share only (no community store).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	rmSync,
	writeFileSync,
	readFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const SMOKE_VAULT = path.join(REPO_ROOT, 'tests/smoke-vault');
export const OBSIDIAN_APP = '/Applications/Obsidian.app';
export const OBSIDIAN_BIN = path.join(OBSIDIAN_APP, 'Contents/MacOS/Obsidian');
export const PLUGIN_ID = 'mdfriday-share';
export const OPEN_IN_MENU = 'Open in Share';
export const SHARE_MENU = 'Share with MDFriday';
export const E2E_VAULT_ID = 'e2eshare00000001';
const DEFAULT_USER_DATA = '/tmp/mdf-share-ui-e2e-obsidian';

export type ObsidianSession = {
	browser: Browser;
	page: Page;
	port: number;
	userDataDir: string;
	vaultId: string;
	child: ChildProcess;
	cdpUrl: string;
};

export function obsidianAppPresent(): boolean {
	return existsSync(OBSIDIAN_BIN) || existsSync(OBSIDIAN_APP);
}

function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const s = createServer();
		s.listen(0, '127.0.0.1', () => {
			const addr = s.address();
			if (!addr || typeof addr === 'string') {
				s.close();
				reject(new Error('no port'));
				return;
			}
			const { port } = addr;
			s.close((err) => (err ? reject(err) : resolve(port)));
		});
		s.on('error', reject);
	});
}

export function ensureVaultPluginPreseed(vaultPath: string): void {
	const obsidianDir = path.join(vaultPath, '.obsidian');
	mkdirSync(path.join(obsidianDir, 'plugins', PLUGIN_ID), { recursive: true });
	writeFileSync(path.join(obsidianDir, 'community-plugins.json'), JSON.stringify([PLUGIN_ID], null, 0));
	const pluginDir = path.join(obsidianDir, 'plugins', PLUGIN_ID);
	for (const name of ['main.js', 'styles.css', 'manifest.json']) {
		const p = path.join(pluginDir, name);
		if (!existsSync(p)) {
			throw new Error(`Local plugin artifact missing: ${p}\nRun: npm run build:smoke`);
		}
	}
}

export function writeE2eObsidianJson(userDataDir: string, vaultPath: string, vaultId = E2E_VAULT_ID): void {
	mkdirSync(userDataDir, { recursive: true });
	writeFileSync(
		path.join(userDataDir, 'obsidian.json'),
		JSON.stringify({
			vaults: {
				[vaultId]: { path: vaultPath, ts: Date.now(), open: true },
			},
		}),
	);
}

async function waitForCdp(port: number, timeoutMs: number): Promise<void> {
	const t0 = Date.now();
	while (Date.now() - t0 < timeoutMs) {
		try {
			const res = await fetch(`http://127.0.0.1:${port}/json/version`);
			if (res.ok) return;
		} catch {
			/* retry */
		}
		await sleep(400);
	}
	throw new Error(`CDP not ready on :${port}`);
}

async function waitForObsidianPage(browser: Browser, timeoutMs: number): Promise<Page> {
	const t0 = Date.now();
	while (Date.now() - t0 < timeoutMs) {
		for (const ctx of browser.contexts()) {
			for (const page of ctx.pages()) {
				const url = page.url();
				if (url.startsWith('app://') || url.includes('obsidian')) return page;
			}
		}
		await sleep(400);
	}
	throw new Error('Obsidian page not found via CDP');
}

export async function ensureRestrictedModeOff(page: Page, vaultId: string): Promise<void> {
	await page.evaluate((id) => {
		try {
			localStorage.setItem(`enable-plugin-${id}`, 'true');
		} catch {
			/* ignore */
		}
	}, vaultId);
	await page.evaluate(() => {
		try {
			const w = window as unknown as {
				app?: { plugins?: { setEnable?: (v: boolean) => void; enablePlugin?: (id: string) => Promise<void> } };
			};
			w.app?.plugins?.setEnable?.(true);
		} catch {
			/* ignore */
		}
	});
}

export async function dismissHarmlessModals(page: Page): Promise<void> {
	await page.evaluate(() => {
		const forbid = /Trust author|Download|Install|Browse|社区|安装|下载|Enable plugins/i;
		for (const b of Array.from(document.querySelectorAll('button'))) {
			const t = (b.textContent || '').trim();
			if (!t || forbid.test(t)) continue;
			if (/^(OK|Got it|I understand|Close|Dismiss|知道了)$/i.test(t)) {
				(b as HTMLButtonElement).click();
			}
		}
	});
}

export async function launchObsidianForShareUiE2e(opts?: {
	userDataDir?: string;
	vaultPath?: string;
}): Promise<ObsidianSession> {
	if (!obsidianAppPresent()) throw new Error(`Obsidian.app not found at ${OBSIDIAN_APP}`);
	const vaultPath = opts?.vaultPath ?? SMOKE_VAULT;
	if (!existsSync(vaultPath)) throw new Error(`Smoke vault missing: ${vaultPath}`);
	ensureVaultPluginPreseed(vaultPath);

	const userDataDir = opts?.userDataDir ?? DEFAULT_USER_DATA;
	rmSync(userDataDir, { recursive: true, force: true });
	writeE2eObsidianJson(userDataDir, vaultPath);

	const port = await freePort();
	const child = spawn(
		OBSIDIAN_BIN,
		[`--user-data-dir=${userDataDir}`, `--remote-debugging-port=${port}`],
		{ stdio: ['ignore', 'ignore', 'ignore'], detached: true, env: { ...process.env } },
	);
	child.unref();

	try {
		await waitForCdp(port, 60_000);
		const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
		const page = await waitForObsidianPage(browser, 60_000);
		await ensureRestrictedModeOff(page, E2E_VAULT_ID);
		await dismissHarmlessModals(page);
		await page.waitForFunction(
			(pluginId: string) => {
				const w = window as unknown as {
					app?: { vault?: unknown; plugins?: { plugins?: Record<string, unknown> } };
				};
				return !!(w.app?.vault && w.app?.plugins?.plugins?.[pluginId]);
			},
			PLUGIN_ID,
			{ timeout: 90_000 },
		);
		return {
			browser,
			page,
			port,
			userDataDir,
			vaultId: E2E_VAULT_ID,
			child,
			cdpUrl: `http://127.0.0.1:${port}`,
		};
	} catch (err) {
		try {
			if (child.pid) process.kill(-child.pid, 'SIGTERM');
		} catch {
			/* ignore */
		}
		throw err;
	}
}

export async function closeObsidianSession(session: ObsidianSession | undefined): Promise<void> {
	if (!session) return;
	try {
		await session.browser.close();
	} catch {
		/* ignore */
	}
	try {
		if (session.child.pid) process.kill(-session.child.pid, 'SIGTERM');
	} catch {
		/* ignore */
	}
}

/** Open note via Obsidian API, then open Share panel and enable password. */
export async function publishNoteWithPasswordViaUi(
	page: Page,
	opts: { notePath: string; content?: string },
): Promise<{ publishUrl: string; password: string }> {
	await page.evaluate(
		async ({ notePath, content }) => {
			const w = window as unknown as {
				app?: {
					vault?: {
						getAbstractFileByPath?: (p: string) => { path?: string } | null;
						create?: (p: string, data: string) => Promise<unknown>;
						createFolder?: (p: string) => Promise<unknown>;
						adapter?: { exists?: (p: string) => Promise<boolean> };
					};
					workspace?: {
						getLeaf?: (newLeaf?: boolean) => { openFile?: (f: unknown) => Promise<void> };
					};
					plugins?: { plugins?: Record<string, { activateView?: () => Promise<void> }> };
				};
			};
			const vault = w.app?.vault;
			if (!vault) throw new Error('app.vault missing');
			const sleepMs = (ms: number) => new Promise((r) => setTimeout(r, ms));
			const resolve = () => vault.getAbstractFileByPath?.(notePath) ?? null;

			// Disk-preseeded notes may lag vault index on first open.
			let file = resolve();
			for (let i = 0; !file && i < 40; i++) {
				await sleepMs(250);
				file = resolve();
			}
			if (!file) {
				const parts = notePath.split('/');
				if (parts.length > 1) {
					let acc = '';
					for (const part of parts.slice(0, -1)) {
						acc = acc ? `${acc}/${part}` : part;
						if (!vault.getAbstractFileByPath?.(acc)) {
							try {
								await vault.createFolder?.(acc);
							} catch {
								/* exists */
							}
						}
					}
				}
				try {
					file = (await vault.create?.(
						notePath,
						content || `---\ntitle: UI password note\n---\n# UI password\n`,
					)) as { path?: string };
				} catch {
					for (let i = 0; !file && i < 40; i++) {
						await sleepMs(250);
						file = resolve();
					}
				}
			}
			if (!file) throw new Error(`note missing after create: ${notePath}`);
			const leaf = w.app?.workspace?.getLeaf?.(false);
			await leaf?.openFile?.(file);
			await w.app?.plugins?.plugins?.['mdfriday-share']?.activateView?.();
		},
		{ notePath: opts.notePath, content: opts.content },
	);
	await sleep(800);

	// Ensure Share panel leaf is visible and follows the opened note
	await page.waitForSelector('.workspace-leaf-content[data-type="MDFriday_Share"]', {
		timeout: 30_000,
	});
	const panel = page.locator('.workspace-leaf-content[data-type="MDFriday_Share"]');
	await panel.locator('.card-password').waitFor({ timeout: 30_000 });

	const toggle = panel.locator('.card-password [role="switch"].toggle').first();
	await toggle.waitFor({ timeout: 10_000 });
	const on = await toggle.evaluate((el) => el.classList.contains('on'));
	if (!on) {
		await toggle.click({ force: true });
	}
	const value = panel.locator('.password-value');
	await value.waitFor({ state: 'visible', timeout: 15_000 });
	const password = (await value.innerText()).trim();
	if (!password) throw new Error('password not generated after toggle');

	const publishBtn = panel.locator('.panel-actions .btn-primary').first();
	await publishBtn.click();

	// Wait for published result URL
	const urlBox = panel.locator('.success-url-box .url, .state-result .url').first();
	await urlBox.waitFor({ timeout: 240_000 });
	const publishUrl = (await urlBox.innerText()).trim();
	if (!/^https?:\/\//i.test(publishUrl)) throw new Error(`bad publish url: ${publishUrl}`);
	return { publishUrl, password };
}

export function readSmokePluginData(): Record<string, unknown> {
	const p = path.join(SMOKE_VAULT, '.obsidian/plugins', PLUGIN_ID, 'data.json');
	if (!existsSync(p)) return {};
	return JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
}

export async function deleteStagingProject(opts: {
	apiBase: string;
	projectId: string;
	token: string;
	clientHeader: string;
}): Promise<void> {
	await fetch(`${opts.apiBase.replace(/\/$/, '')}/v1/projects/${opts.projectId}`, {
		method: 'DELETE',
		headers: {
			authorization: `Bearer ${opts.token}`,
			'X-MDFriday-Client': opts.clientHeader,
		},
	});
}
