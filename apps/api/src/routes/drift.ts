import type { FastifyInstance } from 'fastify';
import { DriftRequestSchema, type DriftRequest } from '@repo-viz/shared';
import { DriftService } from '../services/drift.service.js';
import { validateBody } from '../middleware/validation.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export async function driftRoutes(fastify: FastifyInstance) {
  const driftService = new DriftService();

  fastify.post<{ Body: DriftRequest }>(
    '/drift',
    {
      preHandler: validateBody(DriftRequestSchema),
    },
    async (request, reply) => {
      logger.info('Detecting drift');

      const result = driftService.detectDrift(request.body.current, request.body.previous);

      logger.info('Drift detection complete', {
        added: result.added.length,
        removed: result.removed.length,
        modified: result.modified.length,
      });

      return sendSuccess(reply, result);
    }
  );
}
