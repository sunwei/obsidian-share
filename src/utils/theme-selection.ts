import type { CatalogEntry } from '../theme/types';

/**
 * Legacy wiki allowlist (Digital Garden / Publish). Share UI never uses folder kind.
 */
export const FOLDER_WIKI_THEME_SLUGS = [
	'quartz',
	'creator',
	'flint',
	'jasper',
] as const;

export function isFolderWikiTheme(entry: CatalogEntry): boolean {
	const slug = (entry.slug || '').toLowerCase();
	const family = (entry.family || '').toLowerCase();
	return (FOLDER_WIKI_THEME_SLUGS as readonly string[]).some(
		(s) => s === slug || s === family,
	);
}

/**
 * Share theme picker: notes family / note kinds only.
 * `kind` is accepted for API compat; folder is treated like note (Share refuses folders upstream).
 */
export function filterThemesForSelection(
	themes: CatalogEntry[],
	kind: 'note' | 'folder',
): CatalogEntry[] {
	void kind;
	return themes.filter((t) => {
		const family = String(t.family || '').toLowerCase();
		if (family === 'notes' || family === 'note') return true;
		const kinds = (t.kinds || []).map((k) => String(k).toLowerCase());
		if (kinds.includes('note') || kinds.includes('notes')) return true;
		return false;
	});
}
