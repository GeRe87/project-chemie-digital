import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

export const DEFAULT_JSON_ROOTS = Object.freeze(['.agents', 'apps', 'packages']);
export const REQUIRED_ROOT_JSON_FILES = Object.freeze(['package.json']);
export const OPTIONAL_ROOT_JSON_FILES = Object.freeze(['package-lock.json']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

export async function discoverJsonCandidates({
  cwd = '.',
  roots = DEFAULT_JSON_ROOTS,
  requiredFiles = REQUIRED_ROOT_JSON_FILES,
  optionalFiles = OPTIONAL_ROOT_JSON_FILES,
} = {}) {
  const candidates = requiredFiles.map((file) => join(cwd, file));

  for (const file of optionalFiles) {
    const path = join(cwd, file);
    if (await isFile(path)) candidates.push(path);
  }

  for (const root of roots) {
    candidates.push(...await walk(join(cwd, root)));
  }

  return candidates
    .filter((file) => ['.json', '.jsonld'].includes(extname(file)))
    .sort((left, right) => left.localeCompare(right));
}
