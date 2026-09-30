import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { z } from "zod";

const r2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
});

type R2 = { client: S3Client; bucket: string };

const globalForR2 = globalThis as unknown as { vwR2?: R2 };

function getR2(): R2 {
  if (!globalForR2.vwR2) {
    const env = r2EnvSchema.parse(process.env);
    globalForR2.vwR2 = {
      bucket: env.R2_BUCKET,
      client: new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      }),
    };
  }
  return globalForR2.vwR2;
}

export async function headBucket(): Promise<void> {
  const { client, bucket } = getR2();
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}

export async function putObject(key: string, body: string | Uint8Array, contentType: string) {
  const { client, bucket } = getR2();
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function getObjectText(key: string): Promise<string> {
  const { client, bucket } = getR2();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return (await res.Body?.transformToString()) ?? "";
}

export async function deleteObject(key: string): Promise<void> {
  const { client, bucket } = getR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
