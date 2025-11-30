import type { FastifyInstance } from 'fastify';
import { AnalyzeRequestSchema, type AnalyzeRequest, type AnalyzeResponse } from '@repo-viz/shared';
import { ParserService } from '../services/parser.service.js';
import { MermaidService } from '../services/mermaid.service.js';
import { validateBody } from '../middleware/validation.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export async function analyzeRoutes(fastify: FastifyInstance) {
  const parserService = new ParserService();
  const mermaidService = new MermaidService();

  fastify.post<{ Body: AnalyzeRequest }>(
    '/analyze',
    {
      preHandler: validateBody(AnalyzeRequestSchema),
    },
    async (request, reply) => {
      logger.info('Analyzing files', { count: request.body.files.length });

      const { parsedFiles, graph } = parserService.parseProject(request.body.files);
      const mermaid = mermaidService.generateMermaid(graph);

      const response: AnalyzeResponse = {
        files: parsedFiles,
        graph,
        mermaid,
      };

      logger.info('Analysis complete', { filesCount: parsedFiles.length, nodesCount: graph.length });

      return sendSuccess(reply, response);
    }
  );
}
