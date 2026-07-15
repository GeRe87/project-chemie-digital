import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const roots = ['content', '.agents'];
let failures = 0;
for (const root of roots) {
  for (const file of await walk(root)) {
    if (!['.json', '.jsonld'].includes(extname(file))) continue;
    try {
      JSON.parse(await readFile(file, 'utf8'));
      console.log(`OK ${file}`);
    } catch (error) {
      failures += 1;
      console.error(`INVALID ${file}: ${error.message}`);
    }
  }
}
process.exitCode = failures === 0 ? 0 : 1;
