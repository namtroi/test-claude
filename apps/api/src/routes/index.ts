import type { FastifyInstance } from 'fastify';
import { analyzeRoutes } from './analyze.js';
import { driftRoutes } from './drift.js';
import { healthRoutes } from './health.js';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);
  await fastify.register(analyzeRoutes);
  await fastify.register(driftRoutes);
}
