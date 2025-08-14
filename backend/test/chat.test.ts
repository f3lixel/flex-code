import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/index.js');

function getPort(server: any): number {
  const address = server.address();
  if (typeof address === 'string' || !address) {
    throw new Error('Invalid server address');
  }
  return address.port;
}

test('GET /chat/:id/messages returns session data', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  const port = getPort(server);

  const response = await fetch(`http://localhost:${port}/chat/test/messages`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.messages));
  assert.equal(typeof body.sessionId, 'string');
});
