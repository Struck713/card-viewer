import { createCatalogServer } from '../server.mjs';
import path from 'node:path';

const root = path.join(process.cwd(), 'public');
const handle = createCatalogServer(root).listeners('request')[0];

export default function handler(req, res) {
  handle(req, res);
}
