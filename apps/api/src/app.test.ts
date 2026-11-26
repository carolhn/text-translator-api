import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

const app = createApp();

describe('app', () => {
  it('returns 404 NOT_FOUND in the standard format for unknown routes', async () => {
    const res = await request(app).get('/amora');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND', message: 'Route GET /amora not found' });
  });

  it('returns 400 INVALID_JSON for malformed bodies', async () => {
    const res = await request(app)
      .post('/translate')
      .set('Content-Type', 'application/json')
      .send('{invalid');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
  });
});
