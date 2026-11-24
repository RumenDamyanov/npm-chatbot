#!/usr/bin/env node

/**
 * Dual ESM/CJS build.
 * tsc leaves extensionless relative imports and would keep a relative
 * package.json import. Node can load the published files only after the
 * ESM specifiers point at real files and each dist folder has its own
 * package.json type.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

console.log('Building @rumenx/chatbot\n');

fs.rmSync(dist, { recursive: true, force: true });

console.log('Building TypeScript declarations...');
execSync('tsc --project tsconfig.json --emitDeclarationOnly --outDir dist/types', {
  cwd: root,
  stdio: 'inherit',
});

console.log('Building ESM modules...');
execSync('tsc --project tsconfig.json --outDir dist/esm', {
  cwd: root,
  stdio: 'inherit',
});

console.log('Building CommonJS modules...');
execSync('tsc --project tsconfig.cjs.json', {
  cwd: root,
  stdio: 'inherit',
});

rewriteRelativeSpecifiers(path.join(dist, 'esm'), ['.js', '.d.ts']);
rewriteRelativeSpecifiers(path.join(dist, 'cjs'), ['.js']);
rewriteRelativeSpecifiers(path.join(dist, 'types'), ['.d.ts']);

fs.writeFileSync(
  path.join(dist, 'esm', 'package.json'),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`
);
fs.writeFileSync(
  path.join(dist, 'cjs', 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`
);

console.log('Build completed.');

function rewriteRelativeSpecifiers(directory, extensions) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      rewriteRelativeSpecifiers(filePath, extensions);
      continue;
    }
    if (!extensions.some(extension => entry.name.endsWith(extension))) {
      continue;
    }

    const updated = fs
      .readFileSync(filePath, 'utf8')
      .replace(
        /(\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])(\.\.?\/[^'"]+)\2/g,
        (match, prefix, quote, specifier) => {
          if (path.extname(specifier)) {
            return match;
          }
          return `${prefix}${quote}${resolveSpecifier(filePath, specifier)}${quote}`;
        }
      );
    fs.writeFileSync(filePath, updated);
  }
}

function resolveSpecifier(fromFile, specifier) {
  const target = path.resolve(path.dirname(fromFile), specifier);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    return `${specifier}/index.js`;
  }
  return `${specifier}.js`;
}
