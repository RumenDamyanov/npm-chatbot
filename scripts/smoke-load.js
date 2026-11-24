#!/usr/bin/env node

/**
 * Install the packed tarball in a clean project and load both entry points.
 */

const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const packedName = execSync('npm pack --ignore-scripts', {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .pop();
if (!packedName || !/^[@\w.-]+\.tgz$/.test(packedName)) {
  throw new Error('npm pack did not report a tarball name');
}
const tarball = path.join(root, packedName);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-chatbot-smoke-'));

try {
  fs.writeFileSync(
    path.join(temp, 'package.json'),
    `${JSON.stringify({ name: 'chatbot-smoke', private: true, version: '1.0.0' }, null, 2)}\n`
  );
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-save',
      '--no-package-lock',
      tarball,
      'openai',
      '@anthropic-ai/sdk',
      '@google/generative-ai',
    ],
    { cwd: temp, stdio: 'inherit' }
  );

  fs.writeFileSync(
    path.join(temp, 'check-cjs.cjs'),
    [
      "const assert = require('assert');",
      "const mod = require('@rumenx/chatbot');",
      "assert.strictEqual(typeof mod.Chatbot, 'function');",
      "assert.match(mod.VERSION, /^\\d+\\.\\d+\\.\\d+/);",
      "console.log('cjs', mod.VERSION);",
      '',
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(temp, 'check-esm.mjs'),
    [
      "import assert from 'node:assert';",
      "import * as mod from '@rumenx/chatbot';",
      "assert.strictEqual(typeof mod.Chatbot, 'function');",
      "assert.match(mod.VERSION, /^\\d+\\.\\d+\\.\\d+/);",
      "console.log('esm', mod.VERSION);",
      '',
    ].join('\n')
  );

  execSync('node check-cjs.cjs', { cwd: temp, stdio: 'inherit' });
  execSync('node check-esm.mjs', { cwd: temp, stdio: 'inherit' });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
  fs.rmSync(tarball, { force: true });
}
