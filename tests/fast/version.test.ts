import { readFileSync } from 'fs';
import path from 'path';
import { VERSION } from '../../src/index';

describe('published version', () => {
  it('matches package.json so the built package does not read a missing file', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
    ) as { version: string };

    expect(VERSION).toBe(packageJson.version);
  });
});
