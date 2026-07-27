import { readFile } from 'node:fs/promises';

import { discoverJsonCandidates } from './json-candidates.mjs';

const candidates = await discoverJsonCandidates();

let failures = 0;
for (const file of candidates) {
  try {
    JSON.parse(await readFile(file, 'utf8'));
    console.log(`OK ${file}`);
  } catch (error) {
    failures += 1;
    console.error(`INVALID ${file}: ${error.message}`);
  }
}

process.exitCode = failures === 0 ? 0 : 1;
