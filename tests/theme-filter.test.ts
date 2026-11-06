// Run: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	FOLDER_WIKI_THEME_SLUGS,
	filterThemesForSelection,
	isFolderWikiTheme,
} from '../src/utils/theme-selection.ts';
import type { CatalogEntry } from '../src/theme/types.ts';

function entry(
	partial: Partial<CatalogEntry> & Pick<CatalogEntry, 'slug' | 'family'>,
): CatalogEntry {
	return {
		variant: partial.slug,
		version: '1.0.0',
		name: partial.slug,
		packUrl: `https://example.com/${partial.slug}.zip`,
		kinds: ['wiki'],
		tags: [],
		tier: 'professional',
		access: 'free',
		entitled: true,
		lockReason: null,
		...partial,
	} as CatalogEntry;
}

describe('filterThemesForSelection (Share note-only)', () => {
	it('keeps note themes only even if kind=folder is passed', () => {
		const themes = [
			entry({ slug: 'quartz', family: 'quartz' }),
			entry({ slug: 'paper', family: 'notes', kinds: ['note'] }),
		];
		const folder = filterThemesForSelection(themes, 'folder');
		assert.deepEqual(folder.map((t) => t.slug), ['paper']);
	});

	it('note selection uses notes family / note kinds', () => {
		const themes = [
			entry({ slug: 'paper', family: 'notes', kinds: ['note'] }),
			entry({ slug: 'quartz', family: 'quartz' }),
		];
		const note = filterThemesForSelection(themes, 'note');
		assert.deepEqual(note.map((t) => t.slug), ['paper']);
	});

	it('legacy wiki allowlist helper still recognizes flint', () => {
		assert.equal(isFolderWikiTheme(entry({ slug: 'flint', family: 'flint' })), true);
		assert.equal(isFolderWikiTheme(entry({ slug: 'book', family: 'book' })), false);
		assert.ok(FOLDER_WIKI_THEME_SLUGS.includes('quartz'));
	});
});
