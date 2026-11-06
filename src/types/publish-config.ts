/**
 * Path-scoped publish domain model (MDFriday Share).
 * Share is note-only — folder/wiki belongs to Digital Garden.
 */

import { DEFAULT_THEME_SLUGS } from '../utils/theme';

/** Share only publishes notes; folder kept in the type for legacy pathConfigs. */
export type SelectionKind = 'note' | 'folder';

/** Single-note: faithful | themed. */
export type PublishMode = 'faithful' | 'themed';

export type AccountTier = 'guest' | 'free' | 'pro';

export interface PathPublishConfig {
	mode: PublishMode;
	/** Catalog slug; required when mode=themed */
	themeSlug?: string;
	/** Local flag only — plaintext submitted at publish time, not persisted */
	hasPasswordFlag?: boolean;
	/**
	 * Server project/content expiry (epoch ms). Cached for UI only —
	 * cleanup is always decided by the API. Never invent client-side TTL.
	 */
	contentExpiresAt?: number | null;
	updatedAt?: number;
}

export interface PublishRecord {
	url: string;
	publishedAt: number;
	mode: PublishMode;
	projectName: string;
	path?: string;
}

/** Share always treats selection as a note (folder paths are refused upstream). */
export function selectionKindFromContents(_contents: {
	file?: unknown;
	folder?: unknown;
}[]): SelectionKind {
	return 'note';
}

/** Right-click / quick-publish defaults (ignore saved path config). */
export function getDefaultPublishConfig(kind: SelectionKind): PathPublishConfig {
	void kind;
	return {
		mode: 'faithful',
		hasPasswordFlag: false,
	};
}

/** Note may be faithful or themed; folder values coerce to themed for legacy data. */
export function coercePublishMode(
	kind: SelectionKind,
	mode: PublishMode | undefined,
): PublishMode {
	if (kind === 'folder') return 'themed';
	return mode === 'themed' ? 'themed' : 'faithful';
}

/** @deprecated Share defaults — note theme slug helper */
export function defaultNoteThemeSlug(): string {
	return DEFAULT_THEME_SLUGS.NOTE;
}
