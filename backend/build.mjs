import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const nodeDir = dirname(process.execPath);
const tsPath = resolve(nodeDir, '..', 'lib', 'node_modules', 'typescript', 'lib', 'typescript.js');
const ts = await import(tsPath);

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.join(dir, entry.name);
    return entry.isDirectory() ? await getFiles(res) : res;
  }));
  return files.flat();
}

const srcFiles = await getFiles('src');
const testFiles = await getFiles('test');
const allFiles = srcFiles.concat(testFiles).filter((f) => f.endsWith('.ts'));

for (const file of allFiles) {
  const source = await readFile(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      esModuleInterop: true,
    },
    fileName: file,
  });
  const outPath = path.join('dist', file.replace(/\.ts$/, '.js'));
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, outputText);
}
