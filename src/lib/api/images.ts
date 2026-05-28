import { apiRequest } from './client';
import { PresignImageUploadsResponseSchema } from './schemas';

export type PresignedUpload = {
  key: string;
  url: string;
  expiresIn: number;
};

/**
 * Request short-lived presigned S3 PUT URLs for a batch of object keys.
 * Used by the Figma import dialog after card writes succeed: the Studio
 * uploads PNG bytes directly to S3 with no Lambda payload-size hop.
 *
 * Keys must look like `exp/<theme>_<idx>.png` — the Lambda rejects anything
 * else.
 */
export async function presignImageUploads(
  keys: string[],
): Promise<PresignedUpload[]> {
  if (keys.length === 0) return [];
  const raw = await apiRequest<unknown>('/images/presign', {
    method: 'POST',
    body: { keys },
  });
  const parsed = PresignImageUploadsResponseSchema.parse(raw);
  return parsed.urls;
}
