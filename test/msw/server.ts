import { setupServer } from 'msw/node';

// Handlers are added per-test via server.use(...); MSW intercepts fetch()
// itself, so this exercises the real lib/api/* code (schema gate, 404
// branching, ETag/304) against realistic HTTP responses rather than
// mocking those functions directly.
export const server = setupServer();
