/**
 * Share UI password journey (staging, headed Obsidian):
 * Open note → enable Password switch → Publish → visitor opens #password= URL → auto-unlock.
 *
 * Skip without Obsidian.app or when E2E_SKIP / E2E_SKIP_UI / E2E_SKIP_PASSWORD=1.
 *
 *   npm run build:smoke
 *   MDF_E2E_ENV=staging npm run test:e2e:ui:password
 */
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { chromium } from 'playwright';
import { loadShareE2eEnv } from '../env.ts';
import {
	SMOKE_VAULT,
	closeObsidianSession,
	launchObsidianForShareUiE2e,
	obsidianAppPresent,
	publishNoteWithPasswordViaUi,
	type ObsidianSession,
} from './obsidian-harness.ts';

const skip =
	process.env.E2E_SKIP === '1' ||
	process.env.E2E_SKIP_UI === '1' ||
	process.env.E2E_SKIP_PASSWORD === '1' ||
	!obsidianAppPresent();

const skipReason = !obsidianAppPresent()
	? 'Obsidian.app not installed — UI E2E is macOS/desktop only'
	: process.env.E2E_SKIP_PASSWORD === '1'
		? 'E2E_SKIP_PASSWORD set'
		: process.env.E2E_SKIP_UI === '1' || process.env.E2E_SKIP === '1'
			? 'E2E_SKIP / E2E_SKIP_UI set'
			: '';

describe(
	'E2E Share UI: password switch → publish → #password= unlock',
	{ skip, timeout: 480_000 },
	() => {
		if (skip && skipReason) console.log(`  skip: ${skipReason}`);

		const env = loadShareE2eEnv();
		let session: ObsidianSession | undefined;
		const noteRel = `Notes/ui-password-${env.runId}.md`;
		const canary = `MDF_SHARE_UI_${env.runId}`;
		let publishUrl = '';
		let password = '';

		const noteBody = `---\ntitle: UI password note\n---\n# UI password\n\n${canary}\n`;

		before(async () => {
			mkdirSync(path.join(SMOKE_VAULT, 'Notes'), { recursive: true });
			writeFileSync(path.join(SMOKE_VAULT, noteRel), noteBody, 'utf8');
			session = await launchObsidianForShareUiE2e();
		});

		after(async () => {
			await closeObsidianSession(session);
		});

		it('1. toggle password + publish from Share panel', async () => {
			assert.ok(session);
			const result = await publishNoteWithPasswordViaUi(session.page, {
				notePath: noteRel,
				content: noteBody,
			});
			publishUrl = result.publishUrl;
			password = result.password;
			assert.ok(password.length >= 8, 'generated password too short');
			assert.ok(publishUrl.includes('#password='), `publish URL missing fragment: ${publishUrl}`);
			console.log(`  published ${publishUrl.split('#')[0]} password=${password.slice(0, 4)}…`);
		});

		it('2. visitor auto-unlocks via #password= (decrypt.js)', async () => {
			assert.ok(publishUrl && password);
			const browser = await chromium.launch({ headless: true });
			try {
				const page = await browser.newPage();
				await page.goto(publishUrl, { waitUntil: 'networkidle', timeout: 60_000 });
				await page.waitForFunction(
					(marker) => document.body?.innerText?.includes(marker as string),
					canary,
					{ timeout: 45_000 },
				);
				const text = await page.locator('body').innerText();
				assert.ok(text.includes(canary), 'canary not visible after unlock');
				assert.ok(!page.url().includes('password='), `fragment not stripped: ${page.url()}`);
			} finally {
				await browser.close();
			}
		});
	},
);
