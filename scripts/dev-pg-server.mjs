import net from 'node:net';
import { fromNodeSocket } from 'pg-gateway/node';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite('./.dev-pgdata');
const port = parseInt(process.env.PG_PORT || '5432', 10);

process.on('uncaughtException', (err) => {
  console.error('[Dev PG Server] Uncaught exception:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Dev PG Server] Unhandled rejection:', reason);
});

const server = net.createServer(async (socket) => {
  socket.on('error', (err) => {
    // Ignore common network disconnects like ECONNRESET
    if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
      console.error('[Dev PG Server] Socket error:', err.message);
    }
  });

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
    console.error('Socket handling error:', err?.message || err);
  }
});

server.on('error', (err) => {
  console.error('[Dev PG Server] Server error:', err);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[Dev PG Server] PostgreSQL server running on 127.0.0.1:${port}`);
});
