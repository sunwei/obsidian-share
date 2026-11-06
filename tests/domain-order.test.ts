import assert from 'node:assert/strict';
import test from 'node:test';
import { oldestFirst, primaryDomain } from '../src/services/domain-order.ts';

test('oldestFirst reverses the newest-first API list', () => {
	const rows = [{ hostname: 'newer.example' }, { hostname: 'older.example' }];
	assert.deepEqual(
		oldestFirst(rows).map((row) => row.hostname),
		['older.example', 'newer.example'],
	);
});

test('primaryDomain is the oldest active hostname', () => {
	const primary = primaryDomain([
		{ hostname: 'second.example', status: 'active', certStatus: 'active' },
		{ hostname: 'first.example', status: 'active', certStatus: 'active' },
		{ hostname: 'pending.example', status: 'pending', certStatus: 'provisioning' },
	]);
	assert.equal(primary?.hostname, 'first.example');
});
