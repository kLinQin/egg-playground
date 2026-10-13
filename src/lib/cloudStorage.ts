import {
   S3Client,
   GetObjectCommand,
   PutObjectCommand,
   DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { B2Config } from '../types';

/* ===================== Konstanta ===================== */

const MANIFEST_PATH = '__manifest.json';
const MANIFEST_VERSION = 1;
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_PARALLEL_DOWNLOADS = 5;

/* ===================== Tipe ===================== */

export type CloudFile = {
   name: string;
   content: string;
};

export type PullResult =
   | {
      ok: true;
      files: CloudFile[];
      skipped: number;
      total: number;
   }
   | { ok: false; message: string };

export type SyncOperation =
   | { type: 'upsert'; path: string; content: string }
   | { type: 'delete'; path: string };

export type SyncResult =
   | {
      ok: true;
      upserted: number;
      deleted: number;
      commitSha: string;
   }
   | { ok: false; message: string };

export type VerifyResult =
   | { ok: true; bucket: string; fileCount: number }
   | { ok: false; message: string };

type ManifestEntry = {
   size: number;
   sha1: string;
   updatedAt: string;
};

type Manifest = {
   version: number;
   updatedAt: string;
   files: Record<string, ManifestEntry>;
};

/* ===================== Helper: text file ===================== */

const TEXT_EXTENSIONS = [
   'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
   'html', 'htm', 'css', 'scss', 'sass', 'less',
   'json', 'md', 'markdown',
   'py', 'rs', 'sql', 'xml',
   'txt', 'yml', 'yaml', 'toml', 'ini', 'env',
   'sh', 'bash', 'zsh',
   'go', 'java', 'kt', 'swift', 'rb', 'php', 'c', 'h', 'cpp', 'hpp', 'cs',
   'vue', 'svelte',
   'gitignore', 'editorconfig',
];

function isTextFile(name: string): boolean {
   const lower = name.toLowerCase();
   const basename = lower.split('/').pop() ?? '';
   if (
      basename === '.gitignore' ||
      basename === '.editorconfig' ||
      basename === 'license' ||
      basename === 'readme'
   ) {
      return true;
   }
   const dot = lower.lastIndexOf('.');
   if (dot === -1) return false;
   const ext = lower.slice(dot + 1);
   return TEXT_EXTENSIONS.includes(ext);
}

/* ===================== Helper: base64 UTF-8 ===================== */

function encodeBase64Utf8(text: string): string {
   const bytes = new TextEncoder().encode(text);
   let binary = '';
   const chunk = 0x8000;
   for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(
         ...(bytes.subarray(i, i + chunk) as unknown as number[])
      );
   }
   return btoa(binary);
}

function decodeBase64Utf8(base64: string): string {
   const binary = atob(base64.replace(/\n/g, ''));
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
   }
   return new TextDecoder('utf-8').decode(bytes);
}

/* ===================== Helper: sha1 (untuk manifest) ===================== */

async function sha1Hex(text: string): Promise<string> {
   const bytes = new TextEncoder().encode(text);
   const buf = await crypto.subtle.digest('SHA-1', bytes);
   return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
}

/* ===================== Helper: S3 client ===================== */

function normalizeEndpoint(endpoint: string): string {
   const trimmed = endpoint.trim().replace(/^https?:\/\//, '');
   return `https://${trimmed}`;
}

function createClient(config: B2Config): S3Client {
   return new S3Client({
      endpoint: normalizeEndpoint(config.endpoint),
      region: config.region,
      credentials: {
         accessKeyId: config.keyId,
         secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true,
   });
}

function isNotFound(err: unknown): boolean {
   if (typeof err !== 'object' || err === null) return false;
   const anyErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
   if (anyErr.name === 'NoSuchKey' || anyErr.name === 'NotFound') return true;
   if (anyErr.$metadata?.httpStatusCode === 404) return true;
   return false;
}

/* ===================== Manifest: read ===================== */

async function readManifest(
   client: S3Client,
   bucket: string
): Promise<Manifest | null> {
   try {
      const res = await client.send(
         new GetObjectCommand({ Bucket: bucket, Key: MANIFEST_PATH })
      );
      if (!res.Body) return null;
      const text = await res.Body.transformToString('utf-8');
      const parsed = JSON.parse(text) as Manifest;
      if (parsed.version !== MANIFEST_VERSION) return null;
      if (!parsed.files || typeof parsed.files !== 'object') return null;
      return parsed;
   } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
   }
}

/* ===================== Manifest: write ===================== */

async function writeManifest(
   client: S3Client,
   bucket: string,
   manifest: Manifest
): Promise<void> {
   await client.send(
      new PutObjectCommand({
         Bucket: bucket,
         Key: MANIFEST_PATH,
         Body: JSON.stringify(manifest),
         ContentType: 'application/json',
      })
   );
}

/* ===================== Verify connection ===================== */

export async function verifyB2(config: B2Config): Promise<VerifyResult> {
   if (
      !config.keyId ||
      !config.applicationKey ||
      !config.bucket ||
      !config.endpoint ||
      !config.region
   ) {
      return { ok: false, message: 'Config B2 belum lengkap.' };
   }

   try {
      const client = createClient(config);
      const manifest = await readManifest(client, config.bucket);
      const fileCount = manifest ? Object.keys(manifest.files).length : 0;
      return { ok: true, bucket: config.bucket, fileCount };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal terhubung ke bucket B2.';
      return { ok: false, message };
   }
}

/* ===================== Pull ===================== */

async function downloadFile(
   client: S3Client,
   bucket: string,
   path: string
): Promise<string | null> {
   try {
      const res = await client.send(
         new GetObjectCommand({ Bucket: bucket, Key: path })
      );
      if (!res.Body) return null;
      return await res.Body.transformToString('utf-8');
   } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
   }
}

export async function pullCloud(config: B2Config): Promise<PullResult> {
   try {
      const client = createClient(config);
      const manifest = await readManifest(client, config.bucket);

      if (!manifest) {
         return { ok: true, files: [], skipped: 0, total: 0 };
      }

      const allPaths = Object.keys(manifest.files);
      const total = allPaths.length;

      const acceptedPaths: string[] = [];
      let skipped = 0;

      for (const path of allPaths) {
         if (path === MANIFEST_PATH) continue;

         const entry = manifest.files[path];
         if (!entry) continue;

         if (entry.size > MAX_FILE_SIZE) {
            skipped += 1;
            continue;
         }

         if (!isTextFile(path)) {
            skipped += 1;
            continue;
         }

         acceptedPaths.push(path);
      }

      const out: CloudFile[] = [];

      for (let i = 0; i < acceptedPaths.length; i += MAX_PARALLEL_DOWNLOADS) {
         const batch = acceptedPaths.slice(i, i + MAX_PARALLEL_DOWNLOADS);
         const results = await Promise.all(
            batch.map(async (path) => {
               const content = await downloadFile(client, config.bucket, path);
               return content === null ? null : { name: path, content };
            })
         );
         for (const r of results) {
            if (r === null) {
               skipped += 1;
               continue;
            }
            out.push(r);
         }
      }

      return { ok: true, files: out, skipped, total };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal pull dari bucket B2.';
      return { ok: false, message };
   }
}

/* ===================== Sync (upsert + delete) ===================== */

export async function syncFiles(
   config: B2Config,
   operations: SyncOperation[],
   commitMessage: string
): Promise<SyncResult> {
   if (operations.length === 0) {
      return { ok: false, message: 'Tidak ada operasi untuk disinkronkan.' };
   }

   try {
      const client = createClient(config);

      const manifest = (await readManifest(client, config.bucket)) ?? {
         version: MANIFEST_VERSION,
         updatedAt: new Date().toISOString(),
         files: {},
      };

      const upsertOps = operations.filter(
         (op): op is Extract<SyncOperation, { type: 'upsert' }> =>
            op.type === 'upsert'
      );
      const deleteOps = operations.filter(
         (op): op is Extract<SyncOperation, { type: 'delete' }> =>
            op.type === 'delete'
      );

      /* ---------- upsert: upload file + update manifest ---------- */
      for (const op of upsertOps) {
         if (op.path === MANIFEST_PATH) continue;

         await client.send(
            new PutObjectCommand({
               Bucket: config.bucket,
               Key: op.path,
               Body: op.content,
               ContentType: 'text/plain; charset=utf-8',
            })
         );

         const sha1 = await sha1Hex(op.content);
         const size = new TextEncoder().encode(op.content).length;

         manifest.files[op.path] = {
            size,
            sha1,
            updatedAt: new Date().toISOString(),
         };
      }

      /* ---------- delete: hapus file + hapus dari manifest ---------- */
      for (const op of deleteOps) {
         if (op.path === MANIFEST_PATH) continue;

         try {
            await client.send(
               new DeleteObjectCommand({
                  Bucket: config.bucket,
                  Key: op.path,
               })
            );
         } catch (err) {
            if (!isNotFound(err)) throw err;
         }

         delete manifest.files[op.path];
      }

      /* ---------- update manifest terakhir ---------- */
      manifest.updatedAt = new Date().toISOString();
      await writeManifest(client, config.bucket, manifest);

      /* ---------- commit sha sintetis dari hash manifest ---------- */
      const commitSha = (await sha1Hex(JSON.stringify(manifest))).slice(0, 40);

      return {
         ok: true,
         upserted: upsertOps.length,
         deleted: deleteOps.length,
         commitSha,
      };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal sync ke bucket B2.';
      return { ok: false, message };
   }
}