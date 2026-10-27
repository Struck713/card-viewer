import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = path.join(here, '..', 'fixtures');

export function readFixture<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(FIXTURES_ROOT, relativePath), 'utf8'),
  ) as T;
}
