import type { FastifyInstance } from 'fastify';
import { sendSuccess } from '../utils/response.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    return sendSuccess(reply, {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });
}
