import net from 'node:net';
import { fromNodeSocket } from 'pg-gateway/node';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite('./.dev-pgdata');
const port = parseInt(process.env.PG_PORT || '5432', 10);

const server = net.createServer(async (socket) => {
  try {
    await fromNodeSocket(socket, {
      server: {
        auth: { type: 'trust' },
        async handleQuery(query, params) {
          return await db.query(query, params);
        }
      }
    });
  } catch (err) {
    console.error('Socket error:', err);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[Dev PG Server] PostgreSQL server running on 127.0.0.1:${port}`);
});
