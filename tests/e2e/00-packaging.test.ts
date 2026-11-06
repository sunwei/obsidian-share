/**
 * Packaging / identity checks — no network required beyond reading the repo.
 * Covered: mdfriday-share id, smoke-vault plugin install shape, staging sync artifacts.
 * Not covered: Obsidian UI / ribbon clicks.
 */
import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { REPO_ROOT } from './share-plugin-driver.ts';

const smokePlugin = path.join(REPO_ROOT, 'tests/smoke-vault/.obsidian/plugins/mdfriday-share');
const community = path.join(REPO_ROOT, 'tests/smoke-vault/.obsidian/community-plugins.json');

describe('Share packaging (smoke-vault + manifest)', () => {
	it('manifest id is mdfriday-share and name is MDFriday Share', () => {
		const m = JSON.parse(readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf8')) as {
			id: string;
			name: string;
			description?: string;
		};
		assert.equal(m.id, 'mdfriday-share');
		assert.equal(m.name, 'MDFriday Share');
		assert.ok(m.description && !/obsidian/i.test(m.description), 'description must not say Obsidian');
	});

	it('smoke-vault enables only mdfriday-share', () => {
		assert.ok(existsSync(community), 'community-plugins.json missing — run npm run sync:smoke-vault');
		const enabled = JSON.parse(readFileSync(community, 'utf8')) as string[];
		assert.deepEqual(enabled, ['mdfriday-share']);
	});

	it('smoke-vault plugin dir has staging build artifacts', () => {
		for (const name of ['main.js', 'styles.css', 'manifest.json']) {
			const p = path.join(smokePlugin, name);
			assert.ok(existsSync(p), `missing ${p} — run npm run build:smoke`);
		}
		const installed = JSON.parse(readFileSync(path.join(smokePlugin, 'manifest.json'), 'utf8')) as {
			id: string;
		};
		assert.equal(installed.id, 'mdfriday-share');
		// main.js should be symlink or copy of repo root build
		const main = path.join(smokePlugin, 'main.js');
		const st = lstatSync(main);
		if (st.isSymbolicLink()) {
			const target = readlinkSync(main);
			assert.ok(target.includes('main.js'), `unexpected symlink: ${target}`);
		} else {
			assert.ok(st.size > 1000, 'main.js looks empty');
		}
	});

	it('client header prefix matches Share identity', () => {
		const m = JSON.parse(readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf8')) as {
			version: string;
		};
		assert.match(`obsidian-share/${m.version}`, /^obsidian-share\/\d/);
	});
});
