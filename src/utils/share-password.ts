/**
 * Share note password helpers (legacy PBKDF2 encrypt path).
 * Passwords are system-generated; visitors unlock via `#password=` fragment.
 */

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 10-char Crockford base32 (no I L O U) — easy to copy, not user-editable. */
export function generateSharePassword(length = 10): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	let out = '';
	for (let i = 0; i < length; i++) {
		out += CROCKFORD[bytes[i] % CROCKFORD.length];
	}
	return out;
}

/** Append or replace `#password=` on a publish/preview URL. */
export function withPasswordFragment(url: string, password: string): string {
	const pwd = (password || '').trim();
	if (!url) return '';
	const base = url.split('#')[0] || url;
	if (!pwd) return base;
	return `${base}#password=${encodeURIComponent(pwd)}`;
}

/** Read password from `#password=` (preferred) or `?password=` (compat). */
export function readPasswordFromLocation(
	hash: string,
	search: string,
): string | null {
	const fromHash = readPasswordParam(hash.startsWith('#') ? hash.slice(1) : hash);
	if (fromHash) return fromHash;
	const q = search.startsWith('?') ? search.slice(1) : search;
	return readPasswordParam(q);
}

function readPasswordParam(raw: string): string | null {
	if (!raw) return null;
	for (const part of raw.split('&')) {
		const [k, ...rest] = part.split('=');
		if (k === 'password' || k === 'pwd') {
			try {
				const v = decodeURIComponent(rest.join('=') || '').trim();
				return v || null;
			} catch {
				return null;
			}
		}
	}
	return null;
}
