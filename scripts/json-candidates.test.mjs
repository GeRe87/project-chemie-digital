import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { discoverJsonCandidates } from './json-candidates.mjs';

async function withFixture(callback) {
  const root = await mkdtemp(join(tmpdir(), 'project-chemie-digital-json-'));
  try {
    await mkdir(join(root, 'nested'));
    await writeFile(join(root, 'package.json'), '{}\n');
    await writeFile(join(root, 'nested', 'fixture.json'), '{}\n');
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('discovers required JSON and ignores an absent optional lockfile', async () => {
  await withFixture(async (root) => {
    const candidates = await discoverJsonCandidates({ cwd: root, roots: ['nested'] });

    assert.deepEqual(candidates, [
      join(root, 'nested', 'fixture.json'),
      join(root, 'package.json'),
    ].sort());
    assert.equal(candidates.includes(join(root, 'package-lock.json')), false);
  });
});

test('discovers an optional lockfile when it exists', async () => {
  await withFixture(async (root) => {
    await writeFile(join(root, 'package-lock.json'), '{"lockfileVersion": 3}\n');

    const candidates = await discoverJsonCandidates({ cwd: root, roots: ['nested'] });

    assert.deepEqual(candidates, [
      join(root, 'nested', 'fixture.json'),
      join(root, 'package-lock.json'),
      join(root, 'package.json'),
    ].sort());
  });
});
