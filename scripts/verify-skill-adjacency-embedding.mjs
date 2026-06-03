#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const functionPath = path.join(root, 'supabase/functions/calculate-skill-adjacency/index.ts');
const migrationPath = path.join(root, 'supabase/migrations/20251213000001_skill_embeddings.sql');
const followUpMigrationPath = path.join(root, 'supabase/migrations/20260531000300_update_skill_embedding_model.sql');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeVector(dimensions, offset = 0) {
  return Array.from({ length: dimensions }, (_, index) => {
    const value = Math.sin((index + 1 + offset) / 17) + Math.cos((index + 1 + offset) / 31);
    return Number(value.toFixed(8));
  });
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const source = fs.readFileSync(functionPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');
const followUpMigration = fs.readFileSync(followUpMigrationPath, 'utf8');

assert(source.includes('DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"'), 'calculate-skill-adjacency must default to gemini-embedding-001');
assert(source.includes('DEFAULT_EMBEDDING_DIMENSIONS = 768'), 'calculate-skill-adjacency must request an explicit 768-dimensional embedding for the current schema');
assert(source.includes('SUPPORTED_EMBEDDING_DIMENSIONS = new Set([768, 1536, 3072])'), 'calculate-skill-adjacency must document supported Gemini embedding dimensions');
assert(source.includes('outputDimensionality: config.dimensions'), 'embedContent request must set outputDimensionality');
assert(source.includes('taskType: "SEMANTIC_SIMILARITY"'), 'embedContent request must set semantic-similarity task type');
assert(!source.includes("gemini-2.5-flash"), 'calculate-skill-adjacency must not use a generative Gemini model for embeddings');
assert(migration.includes("gemini-embedding-001"), 'base skill-embedding migration must reference gemini-embedding-001');
assert(followUpMigration.includes("gemini-embedding-001"), 'follow-up migration must update existing defaults to gemini-embedding-001');
assert(followUpMigration.includes("embedding_model IS DISTINCT FROM 'gemini-embedding-001'"), 'follow-up migration must clear stale cached embeddings from older model families');

const sourceVector = makeVector(768, 0);
const adjacentVector = makeVector(768, 1);
const unrelatedVector = makeVector(768, 333);
assert(sourceVector.length === 768, 'smoke source vector must be 768 dimensions');
assert(adjacentVector.length === 768, 'smoke adjacent vector must be 768 dimensions');

const adjacency = [
  { id: '2.C.1.a', score: cosineSimilarity(sourceVector, adjacentVector) },
  { id: '2.C.2.b', score: cosineSimilarity(sourceVector, unrelatedVector) },
]
  .filter((row) => row.score >= 0.5)
  .sort((a, b) => b.score - a.score);

assert(adjacency.length > 0, 'smoke adjacency must return at least one adjacent skill');
assert(adjacency[0].score > 0.5 && adjacency[0].score <= 1, 'smoke adjacency similarity must be in expected range');

console.log(JSON.stringify({
  ok: true,
  model: 'gemini-embedding-001',
  embeddingDimensions: sourceVector.length,
  adjacentCount: adjacency.length,
  topSimilarity: Number(adjacency[0].score.toFixed(4)),
}, null, 2));
