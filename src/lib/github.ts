import { Octokit } from 'octokit';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { request } from '@octokit/request';
import type { GitConfig } from '../types';

export function createOctokit(config: GitConfig): Octokit {
   return new Octokit({ auth: config.token });
}

/* ===================== Verify token ===================== */

export type VerifyResult =
   | { ok: true; login: string; name: string | null; avatarUrl: string }
   | { ok: false; message: string };

export async function verifyToken(config: GitConfig): Promise<VerifyResult> {
   try {
      const octokit = createOctokit(config);
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
         ok: true,
         login: data.login,
         name: data.name ?? null,
         avatarUrl: data.avatar_url,
      };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal memverifikasi token.';
      return { ok: false, message };
   }
}

/* ===================== Device Flow ===================== */

export const GITHUB_CLIENT_ID =
   import.meta.env.VITE_GITHUB_CLIENT_ID ?? '';

export type DeviceFlowCallbacks = {
   onCode: (info: {
      userCode: string;
      verificationUri: string;
      expiresIn: number;
   }) => void;
};

export type DeviceFlowResult =
   | { ok: true; token: string }
   | { ok: false; message: string };

export async function loginWithDeviceFlow(
   callbacks: DeviceFlowCallbacks
): Promise<DeviceFlowResult> {
   if (!GITHUB_CLIENT_ID) {
      return {
         ok: false,
         message: 'VITE_GITHUB_CLIENT_ID belum diisi di file .env',
      };
   }

   try {
      const auth = createOAuthDeviceAuth({
         clientType: 'oauth-app',
         clientId: GITHUB_CLIENT_ID,
         scopes: ['repo'],
         request: request.defaults({
            baseUrl: '/github-login',
         }),
         onVerification(verification) {
            callbacks.onCode({
               userCode: verification.user_code,
               verificationUri: verification.verification_uri,
               expiresIn: verification.expires_in,
            });
         },
      });

      const authentication = await auth({ type: 'oauth' });
      return { ok: true, token: authentication.token };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Login gagal atau dibatalkan.';
      return { ok: false, message };
   }
}

/* ===================== Pull ===================== */

export type PulledFile = {
   name: string;
   content: string;
};

export type PullResult =
   | {
      ok: true;
      files: PulledFile[];
      skipped: number;
      total: number;
   }
   | { ok: false; message: string };

const MAX_FILE_SIZE = 500 * 1024; // 500KB

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

function decodeBase64Utf8(base64: string): string {
   const binary = atob(base64.replace(/\n/g, ''));
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
   }
   return new TextDecoder('utf-8').decode(bytes);
}

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

async function walkTree(
   octokit: Octokit,
   config: GitConfig,
   path: string,
   out: PulledFile[],
   skipped: { value: number },
   total: { value: number }
): Promise<void> {
   const { data } = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref: config.branch,
   });

   const items = Array.isArray(data) ? data : [data];

   for (const item of items) {
      if (item.type === 'dir') {
         await walkTree(octokit, config, item.path, out, skipped, total);
         continue;
      }

      if (item.type !== 'file') continue;

      total.value += 1;

      if (item.size !== undefined && item.size > MAX_FILE_SIZE) {
         skipped.value += 1;
         continue;
      }

      if (!isTextFile(item.path)) {
         skipped.value += 1;
         continue;
      }

      try {
         let content = item.content ?? '';
         if (!content && item.sha) {
            const { data: fileData } = await octokit.rest.repos.getContent({
               owner: config.owner,
               repo: config.repo,
               path: item.path,
               ref: config.branch,
            });
            if (!Array.isArray(fileData) && 'content' in fileData) {
               content = fileData.content ?? '';
            }
         }
         out.push({
            name: item.path,
            content: decodeBase64Utf8(content),
         });
      } catch {
         skipped.value += 1;
      }
   }
}

export async function pullRepo(config: GitConfig): Promise<PullResult> {
   try {
      const octokit = createOctokit(config);
      const out: PulledFile[] = [];
      const skipped = { value: 0 };
      const total = { value: 0 };

      await walkTree(octokit, config, '', out, skipped, total);

      return {
         ok: true,
         files: out,
         skipped: skipped.value,
         total: total.value,
      };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal pull dari repository.';
      return { ok: false, message };
   }
}

/* ===================== Push (multi-file, single commit) ===================== */

export type PushFile = {
   path: string;
   content: string;
};

export type PushResult =
   | {
      ok: true;
      pushed: number;
      commitSha: string;
   }
   | { ok: false; message: string };

export async function pushFiles(
   config: GitConfig,
   files: PushFile[],
   commitMessage: string
): Promise<PushResult> {
   if (files.length === 0) {
      return { ok: false, message: 'Tidak ada file untuk di-push.' };
   }

   try {
      const octokit = createOctokit(config);

      /* ---------- 1. Ambil ref branch saat ini ---------- */
      const { data: ref } = await octokit.rest.git.getRef({
         owner: config.owner,
         repo: config.repo,
         ref: `heads/${config.branch}`,
      });

      const baseCommitSha = ref.object.sha;

      /* ---------- 2. Ambil commit terakhir untuk dapat base tree ---------- */
      const { data: baseCommit } = await octokit.rest.git.getCommit({
         owner: config.owner,
         repo: config.repo,
         commit_sha: baseCommitSha,
      });

      const baseTreeSha = baseCommit.tree.sha;

      /* ---------- 3. Buat blob untuk setiap file ---------- */
      const blobs = await Promise.all(
         files.map(async (file) => {
            const { data: blob } = await octokit.rest.git.createBlob({
               owner: config.owner,
               repo: config.repo,
               content: encodeBase64Utf8(file.content),
               encoding: 'base64',
            });
            return { path: file.path, sha: blob.sha };
         })
      );

      /* ---------- 4. Buat tree baru (menggabungkan base tree + blob baru) ---------- */
      const { data: newTree } = await octokit.rest.git.createTree({
         owner: config.owner,
         repo: config.repo,
         base_tree: baseTreeSha,
         tree: blobs.map((b) => ({
            path: b.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: b.sha,
         })),
      });

      /* ---------- 5. Buat commit baru yang menunjuk tree baru ---------- */
      const { data: newCommit } = await octokit.rest.git.createCommit({
         owner: config.owner,
         repo: config.repo,
         message: commitMessage,
         tree: newTree.sha,
         parents: [baseCommitSha],
      });

      /* ---------- 6. Update branch ke commit baru ---------- */
      await octokit.rest.git.updateRef({
         owner: config.owner,
         repo: config.repo,
         ref: `heads/${config.branch}`,
         sha: newCommit.sha,
      });

      return {
         ok: true,
         pushed: files.length,
         commitSha: newCommit.sha,
      };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal push ke repository.';
      return { ok: false, message };
   }
}

/* ===================== List owners / repos / branches ===================== */

export type OwnerOption = {
   login: string;
   type: 'user' | 'org';
};

export type ListOwnersResult =
   | { ok: true; owners: OwnerOption[] }
   | { ok: false; message: string };

export async function listOwners(
   config: GitConfig
): Promise<ListOwnersResult> {
   try {
      const octokit = createOctokit(config);

      const [me, orgs] = await Promise.all([
         octokit.rest.users.getAuthenticated(),
         octokit.rest.orgs.listForAuthenticatedUser({ per_page: 100 }),
      ]);

      const owners: OwnerOption[] = [
         { login: me.data.login, type: 'user' },
         ...orgs.data.map((o) => ({
            login: o.login,
            type: 'org' as const,
         })),
      ];

      return { ok: true, owners };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal memuat daftar owner.';
      return { ok: false, message };
   }
}

export type RepoOption = {
   name: string;
   fullName: string;
   defaultBranch: string;
   updatedAt: string;
   private: boolean;
};

export type ListReposResult =
   | { ok: true; repos: RepoOption[] }
   | { ok: false; message: string };

export async function listRepos(
   config: GitConfig,
   owner: string,
   ownerType: 'user' | 'org'
): Promise<ListReposResult> {
   try {
      const octokit = createOctokit(config);

      const params = {
         per_page: 100,
         sort: 'updated' as const,
         direction: 'desc' as const,
      };

      const me = await octokit.rest.users.getAuthenticated();
      const isSelf = me.data.login.toLowerCase() === owner.toLowerCase();

      const { data } =
         ownerType === 'org'
            ? await octokit.rest.repos.listForOrg({
               org: owner,
               ...params,
            })
            : isSelf
               ? await octokit.rest.repos.listForAuthenticatedUser(params)
               : await octokit.rest.repos.listForUser({
                  username: owner,
                  ...params,
               });

      const repos: RepoOption[] = data.map((r) => ({
         name: r.name,
         fullName: r.full_name,
         defaultBranch: r.default_branch ?? 'main',
         updatedAt: r.updated_at ?? '',
         private: r.private,
      }));

      return { ok: true, repos };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal memuat daftar repo.';
      return { ok: false, message };
   }
}

export type BranchOption = {
   name: string;
   isDefault: boolean;
};

export type ListBranchesResult =
   | { ok: true; branches: BranchOption[]; defaultBranch: string }
   | { ok: false; message: string };

export async function listBranches(
   config: GitConfig
): Promise<ListBranchesResult> {
   try {
      const octokit = createOctokit(config);

      const [branchesRes, repoRes] = await Promise.all([
         octokit.rest.repos.listBranches({
            owner: config.owner,
            repo: config.repo,
            per_page: 100,
         }),
         octokit.rest.repos.get({
            owner: config.owner,
            repo: config.repo,
         }),
      ]);

      const defaultBranch = repoRes.data.default_branch;

      const branches: BranchOption[] = branchesRes.data.map((b) => ({
         name: b.name,
         isDefault: b.name === defaultBranch,
      }));

      return { ok: true, branches, defaultBranch };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal memuat daftar branch.';
      return { ok: false, message };
   }
}

/* ===================== Commits ===================== */

export type CommitOption = {
   sha: string;
   shaShort: string;
   message: string;
   authorLogin: string | null;
   authorName: string;
   authorAvatarUrl: string | null;
   date: string;
   htmlUrl: string;
};

export type ListCommitsResult =
   | { ok: true; commits: CommitOption[] }
   | { ok: false; message: string };

export async function listCommits(
   config: GitConfig,
   perPage = 20
): Promise<ListCommitsResult> {
   try {
      const octokit = createOctokit(config);

      const { data } = await octokit.rest.repos.listCommits({
         owner: config.owner,
         repo: config.repo,
         sha: config.branch,
         per_page: perPage,
      });

      const commits: CommitOption[] = data.map((c) => ({
         sha: c.sha,
         shaShort: c.sha.slice(0, 7),
         message: c.commit.message.split('\n')[0],
         authorLogin: c.author?.login ?? null,
         authorName: c.commit.author?.name ?? 'Unknown',
         authorAvatarUrl: c.author?.avatar_url ?? null,
         date: c.commit.author?.date ?? '',
         htmlUrl: c.html_url,
      }));

      return { ok: true, commits };
   } catch (err: unknown) {
      const message =
         err instanceof Error ? err.message : 'Gagal memuat daftar commit.';
      return { ok: false, message };
   }
}

/* ===================== Relative time helper ===================== */

export function relativeTime(iso: string): string {
   if (!iso) return '';
   const then = new Date(iso).getTime();
   if (Number.isNaN(then)) return '';
   const now = Date.now();
   const diff = Math.floor((now - then) / 1000);

   if (diff < 60) return 'baru saja';
   if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
   if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
   if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
   if (diff < 31536000) return `${Math.floor(diff / 2592000)} bulan lalu`;
   return `${Math.floor(diff / 31536000)} tahun lalu`;
}