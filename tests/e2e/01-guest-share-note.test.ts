/**
 * Share critical path against staging (headless plugin path via @mdfriday/core).
 *
 * Covered:
 * - Guest mint (POST /v1/auth/guest) with contentExpiresAt ≈ now+7d
 * - Note project bind + themed build + publish (hostingMode share)
 * - Public URL on share.fsky.top returns 200 with note marker
 * - Project expiresAt ≈ now+7d
 * - X-MDFriday-Client is obsidian-share/<ver>
 *
 * Not covered (manual / future): Obsidian ribbon UI, Claim OAuth, Desktop E2E-09.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { EXPIRY_TOLERANCE_MS, SEVEN_DAYS_MS, loadShareE2eEnv } from './env.ts';
import {
	SharePluginDriver,
	fetchThemeCatalog,
	type PluginPublishResult,
} from './share-plugin-driver.ts';

const skip = process.env.E2E_SKIP === '1';

describe('E2E Share: guest note → share.fsky.top (staging)', { skip, timeout: 300_000 }, () => {
	const env = loadShareE2eEnv();
	let driver: SharePluginDriver;
	let guestKey = '';
	let guestId = '';
	let projectId = '';
	let published: PluginPublishResult | undefined;
	const marker = `Share hello ${env.runId}`;
	const t0 = Date.now();

	before(async () => {
		driver = new SharePluginDriver({
			apiBaseUrl: env.apiBase,
			publicBaseUrl: env.shareBase,
		});
		await driver.init();
	});

	after(async () => {
		if (process.env.E2E_KEEP_DATA === '1') {
			driver?.dispose();
			return;
		}
		try {
			if (guestKey && projectId) {
				await fetch(`${env.apiBase.replace(/\/$/, '')}/v1/projects/${projectId}`, {
					method: 'DELETE',
					headers: {
						authorization: `Bearer ${guestKey}`,
						'X-MDFriday-Client': driver.clientHeader,
					},
				});
			}
		} catch (err) {
			console.warn('cleanup delete project failed', err);
		}
		driver?.dispose();
	});

	it('1. guest mint returns key + ~7d contentExpiresAt', async () => {
		const g = await driver.guestKey();
		guestKey = g.key;
		guestId = g.guestId;
		assert.ok(guestKey.startsWith('MDF_'), `key prefix: ${guestKey.slice(0, 8)}`);
		assert.ok(guestId, 'guestId');
		assert.ok(typeof g.contentExpiresAt === 'number', 'contentExpiresAt missing — is staging on 7d TTL?');
		const delta = (g.contentExpiresAt as number) - t0;
		assert.ok(
			Math.abs(delta - SEVEN_DAYS_MS) <= EXPIRY_TOLERANCE_MS,
			`contentExpiresAt skew: delta=${delta} expected≈${SEVEN_DAYS_MS}`,
		);
		console.log(`  guest=${guestId} contentExpiresAt=+${Math.round(delta / 86_400_000)}d`);
	});

	it('2. publish sample note with paper theme (obsidian-share client)', async () => {
		const catalog = await fetchThemeCatalog(env.apiBase);
		const paper = catalog.find((e) => e.slug === 'paper');
		assert.ok(paper?.packUrl, 'default note theme (paper) entitled for guests');

		driver.writeVault({
			'Notes/Hello.md': `---\ntitle: Share hello\n---\n# ${marker}\n\nFrom obsidian-share tests/e2e.\n`,
		});
		const site = await driver.createNoteProject('share-hello', 'Notes/Hello.md', paper!);
		published = await driver.buildAndPublish(site, { token: guestKey, guest: true }, { force: true });
		projectId = published.projectId;

		assert.ok(published.siteId, 'siteId');
		assert.ok(projectId, 'projectId');
		assert.match(published.baseURL, /^https:\/\/share\.fsky\.top\/s\/[^/]+\/$/);
		assert.match(published.clientHeader, /^obsidian-share\//);
		console.log(
			`  project=${projectId} url=${published.url} files=${published.filesUploaded} build=${published.buildMs}ms publish=${published.publishMs}ms client=${published.clientHeader} core=${driver.coreVersion}`,
		);
	});

	it('3. public page 200 contains marker', async () => {
		assert.ok(published, 'publish step did not run');
		const page = await fetch(`${published.url}?e2e=${env.runId}`);
		const html = await page.text();
		assert.equal(page.status, 200, html.slice(0, 200));
		assert.ok(html.includes(marker), 'published HTML missing marker');
	});

	it('4. project expiresAt ≈ now+7d; kind note / hosting share', async () => {
		assert.ok(projectId && guestKey);
		const res = await fetch(`${env.apiBase.replace(/\/$/, '')}/v1/projects/${projectId}`, {
			headers: {
				authorization: `Bearer ${guestKey}`,
				'X-MDFriday-Client': driver.clientHeader,
			},
		});
		const body = (await res.json()) as {
			project?: {
				expiresAt?: number | null;
				expires_at?: number | null;
				kind?: string;
				hostingMode?: string;
				hosting_mode?: string;
				siteId?: string;
				site_id?: string;
			};
		};
		assert.equal(res.status, 200, JSON.stringify(body).slice(0, 300));
		const p = body.project!;
		const expiresAt = p.expiresAt ?? p.expires_at ?? null;
		assert.ok(typeof expiresAt === 'number' && expiresAt > 0, 'expiresAt missing on project');
		const delta = expiresAt! - t0;
		assert.ok(
			Math.abs(delta - SEVEN_DAYS_MS) <= EXPIRY_TOLERANCE_MS,
			`expiresAt skew: delta=${delta} expected≈${SEVEN_DAYS_MS}`,
		);
		const kind = p.kind;
		const hosting = p.hostingMode ?? p.hosting_mode;
		assert.equal(kind, 'note');
		assert.equal(hosting, 'share');
		console.log(`  expiresAt=+${Math.round(delta / 86_400_000)}d kind=${kind} hosting=${hosting}`);
	});
});
