import { createHash } from 'node:crypto';

/*** Fingerprint AI-owned content for drift and overwrite protection. */
export function hashArtifact(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
