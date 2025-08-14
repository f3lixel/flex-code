import test from 'node:test';
import assert from 'node:assert/strict';
import { getDockerfile } from '../src/services/docker.js';

test('getDockerfile reads Dockerfile content', async () => {
  const content = await getDockerfile();
  assert.ok(content.includes('FROM node:18-alpine'));
});
