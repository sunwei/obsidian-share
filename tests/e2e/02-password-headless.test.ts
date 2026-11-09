/**
 * Share password encrypt — headless staging path (themed paper + legacy password).
 *
 * Covered:
 * - Publish with params.password → public HTML has encrypt gate, canary not in cleartext
 * - Wrong #password= stays locked
 * - Correct #password= auto-unlocks (decrypt.js) and reveals canary
 *
 * Skip: E2E_SKIP=1 or E2E_SKIP_PASSWORD=1
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { chromium } from 'playwright';
import { generateSharePassword, withPasswordFragment } from '../../src/utils/share-password.ts';
import { loadShareE2eEnv } from './env.ts';
import {
	SharePluginDriver,
	fetchThemeCatalog,
	type PluginPublishResult,
} from './share-plugin-driver.ts';

const skip = process.env.E2E_SKIP === '1' || process.env.E2E_SKIP_PASSWORD === '1';

describe('E2E Share: password protect → #password= unlock (staging)', { skip, timeout: 360_000 }, () => {
	const env = loadShareE2eEnv();
	let driver: SharePluginDriver;
	let guestKey = '';
	let projectId = '';
	let published: PluginPublishResult | undefined;
	const password = generateSharePassword();
	const canary = `MDF_SHARE_PWD_${env.runId}`;

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

	it('1. guest mint + publish note with password', async () => {
		const g = await driver.guestKey();
		guestKey = g.key;
		const catalog = await fetchThemeCatalog(env.apiBase);
		const paper = catalog.find((e) => e.slug === 'paper');
		assert.ok(paper?.packUrl, 'paper theme entitled');

		driver.writeVault({
			'Notes/Secret.md': `---\ntitle: Secret share\n---\n# Secret\n\n${canary}\n`,
		});
		const site = await driver.createNoteProject('share-secret', 'Notes/Secret.md', paper!, {
			password,
		});
		published = await driver.buildAndPublish(site, { token: guestKey, guest: true }, { force: true });
		projectId = published.projectId;
		assert.ok(published.siteId);
		assert.match(published.baseURL, /^https:\/\/share\.fsky\.top\/s\/[^/]+\/$/);
		console.log(`  url=${published.baseURL} password=${password.slice(0, 4)}…`);
	});

	it('2. public HTML is locked (canary not clear; encrypt shell present)', async () => {
		assert.ok(published);
		const page = await fetch(`${published.baseURL}?e2e=${env.runId}`);
		const html = await page.text();
		assert.equal(page.status, 200, html.slice(0, 200));
		assert.ok(!html.includes(canary), 'canary leaked in clear HTML');
		assert.ok(
			html.includes('mdf-encrypt-content') || html.includes('data-encrypted'),
			'missing encrypt shell',
		);
		assert.ok(html.includes('mdf-encrypt-modal') || html.includes('mdf-password-input'), 'missing unlock UI');
	});

	it('3. browser: wrong #password= stays locked; correct unlocks', async () => {
		assert.ok(published);
		const browser = await chromium.launch({ headless: true });
		try {
			const wrong = await browser.newPage();
			await wrong.goto(withPasswordFragment(published.baseURL, 'WRONGPASS01'), {
				waitUntil: 'networkidle',
				timeout: 60_000,
			});
			await wrong.waitForTimeout(1500);
			const wrongBody = await wrong.content();
			assert.ok(!wrongBody.includes(canary), 'wrong password unlocked content');
			assert.ok(
				(await wrong.locator('#mdf-encrypt-modal').count()) > 0 ||
					(await wrong.locator('#mdf-password-input').count()) > 0,
				'unlock gate missing after wrong password',
			);
			await wrong.close();

			const ok = await browser.newPage();
			await ok.goto(withPasswordFragment(published.baseURL, password), {
				waitUntil: 'networkidle',
				timeout: 60_000,
			});
			await ok.waitForFunction(
				(marker) => document.body?.innerText?.includes(marker as string),
				canary,
				{ timeout: 30_000 },
			);
			const text = await ok.locator('body').innerText();
			assert.ok(text.includes(canary), 'correct password did not reveal canary');
			// Fragment should be stripped after successful unlock
			assert.ok(!ok.url().includes('password='), `password fragment not stripped: ${ok.url()}`);
			await ok.close();
		} finally {
			await browser.close();
		}
	});
});
