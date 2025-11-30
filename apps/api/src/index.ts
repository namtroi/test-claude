import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: false,
    bodyLimit: 10 * 1024 * 1024, // 10MB
    connectionTimeout: 30000, // 30s
  });

  fastify.setErrorHandler(errorHandler);

  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['http://localhost:3000']
      : true,
    credentials: true,
  });

  fastify.addHook('onRequest', async (request) => {
    // Generate request ID
    request.id = crypto.randomUUID();

    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      requestId: request.id,
    });
  });

  await registerRoutes(fastify);

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await fastify.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await fastify.close();
    process.exit(0);
  });

  try {
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
