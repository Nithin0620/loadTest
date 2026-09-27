import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurlCommand } from '../lib/k6/curlParser.js';

test('cURL Parser Test Suite', async (t) => {
  await t.test('should parse simple GET cURL', () => {
    const curl = 'curl https://api.example.com/products';
    const parsed = parseCurlCommand(curl);

    assert.equal(parsed.targetUrl, 'https://api.example.com/products');
    assert.equal(parsed.httpMethod, 'GET');
    assert.equal(parsed.headers.length, 0);
    assert.equal(parsed.auth.authType, 'none');
  });

  await t.test('should parse complex POST cURL with headers and JSON body', () => {
    const curl = `curl -X POST https://api.example.com/v1/checkout \\
      -H 'Content-Type: application/json' \\
      -H 'Accept: application/json' \\
      -H 'Authorization: Bearer token_secret_123' \\
      -d '{"itemId": 42, "qty": 3}'`;

    const parsed = parseCurlCommand(curl);

    assert.equal(parsed.targetUrl, 'https://api.example.com/v1/checkout');
    assert.equal(parsed.httpMethod, 'POST');
    assert.equal(parsed.auth.authType, 'bearer');
    assert.equal(parsed.auth.token, 'token_secret_123');
    assert.equal(parsed.bodyType, 'json');
    assert.equal(parsed.bodyContent, '{"itemId": 42, "qty": 3}');
    assert.ok(parsed.headers.some(h => h.key === 'Content-Type' && h.value === 'application/json'));
  });

  await t.test('should parse basic auth flag -u user:pass', () => {
    const curl = 'curl -u admin:supersecret -X DELETE https://api.example.com/resource/99';
    const parsed = parseCurlCommand(curl);

    assert.equal(parsed.httpMethod, 'DELETE');
    assert.equal(parsed.auth.authType, 'basic');
    assert.equal(parsed.auth.username, 'admin');
    assert.equal(parsed.auth.password, 'supersecret');
  });

  await t.test('should handle wrapped single and double quotes properly', () => {
    const curl = `curl "https://api.example.com/search?q=load+test" --header "X-Trace-ID: abc-123"`;
    const parsed = parseCurlCommand(curl);

    assert.equal(parsed.targetUrl, 'https://api.example.com/search?q=load+test');
    assert.equal(parsed.headers[0].key, 'X-Trace-ID');
    assert.equal(parsed.headers[0].value, 'abc-123');
  });
});
