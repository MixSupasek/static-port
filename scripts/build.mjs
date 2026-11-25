import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const revision = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) {
  throw new Error('The build requires a full Git commit SHA.');
}

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
await copyFile(new URL('../index.html', import.meta.url), new URL('index.html', output));
await writeFile(new URL('version.json', output), JSON.stringify({
  version,
  revision,
  builtAt: new Date().toISOString(),
}, null, 2) + '\n');
console.log(`Built version ${version} from ${revision}`);
