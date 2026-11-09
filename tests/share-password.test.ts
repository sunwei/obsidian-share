import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	generateSharePassword,
	readPasswordFromLocation,
	withPasswordFragment,
} from '../src/utils/share-password.ts';

describe('share-password', () => {
	it('generates crockford-like passwords of fixed length', () => {
		const a = generateSharePassword();
		const b = generateSharePassword();
		assert.equal(a.length, 10);
		assert.equal(b.length, 10);
		assert.match(a, /^[0-9A-HJKMNP-TV-Z]+$/);
		assert.notEqual(a, b);
	});

	it('appends #password= and strips prior hash', () => {
		assert.equal(
			withPasswordFragment('https://share.fsky.top/s/abc/', 'K7QM2XPA9R'),
			'https://share.fsky.top/s/abc/#password=K7QM2XPA9R',
		);
		assert.equal(
			withPasswordFragment('https://share.fsky.top/s/abc/#old=1', 'NEW'),
			'https://share.fsky.top/s/abc/#password=NEW',
		);
		assert.equal(withPasswordFragment('https://share.fsky.top/s/abc/', ''), 'https://share.fsky.top/s/abc/');
	});

	it('reads password from fragment first', () => {
		assert.equal(readPasswordFromLocation('#password=ABC123', ''), 'ABC123');
		assert.equal(readPasswordFromLocation('#foo=1&password=XYZ', '?password=Q'), 'XYZ');
		assert.equal(readPasswordFromLocation('', '?password=FROMQ'), 'FROMQ');
		assert.equal(readPasswordFromLocation('#other=1', ''), null);
	});
});
