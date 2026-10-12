import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
   ArrowDown,
   ArrowUp,
   KeyRound,
   X,
   ShieldCheck,
   Loader2,
   LogIn,
   LogOut,
   Copy,
   Check,
   ChevronDown,
   Search,
   GitCommit,
   ExternalLink,
   RefreshCw,
   Plus,
   Minus,
   Undo2,
   FileEdit,
   FilePlus,
   FileMinus,
   Settings,
   GitBranch,
} from 'lucide-react';
import type { GitConfig, GitStatus, ChangeItem } from '../types';
import {
   verifyToken,
   loginWithDeviceFlow,
   listOwners,
   listRepos,
   listBranches,
   listCommits,
   relativeTime,
} from '../lib/github';
import type {
   OwnerOption,
   RepoOption,
   BranchOption,
   CommitOption,
} from '../lib/github';
import { useGitAuth } from '../hooks/useGitAuth';

type Props = {
   status: GitStatus;
   onPull: (config: GitConfig) => void;
   onPush: (config: GitConfig, commitMessage: string) => void;
   onClearAll: () => void;

   changes: ChangeItem[];
   onStage: (fileId: string) => void;
   onUnstage: (fileId: string) => void;
   onRestore: (fileId: string) => void;
   onStageAll: () => void;
   onUnstageAll: () => void;
   onRestoreAll: () => void;
};

type DeviceState =
   | { state: 'idle' }
   | { state: 'waiting'; userCode: string; verificationUri: string }
   | { state: 'error'; message: string };

/* ===================== Dropdown with portal ===================== */

type DropdownProps = {
   value: string;
   placeholder: string;
   options: { value: string; label: string }[];
   onSelect: (value: string) => void;
   disabled?: boolean;
   searchable?: boolean;
   loading?: boolean;
};

function Dropdown({
   value,
   placeholder,
   options,
   onSelect,
   disabled,
   searchable,
   loading,
}: DropdownProps) {
   const [open, setOpen] = useState(false);
   const [query, setQuery] = useState('');
   const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

   const triggerRef = useRef<HTMLButtonElement>(null);
   const menuRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!open) return;

      const compute = () => {
         const trigger = triggerRef.current;
         if (!trigger) return;
         const rect = trigger.getBoundingClientRect();
         setMenuPos({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
         });
      };

      compute();

      window.addEventListener('scroll', compute, true);
      window.addEventListener('resize', compute);
      return () => {
         window.removeEventListener('scroll', compute, true);
         window.removeEventListener('resize', compute);
      };
   }, [open]);

   useEffect(() => {
      if (!open) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (
            triggerRef.current?.contains(target) ||
            menuRef.current?.contains(target)
         ) {
            return;
         }
         setOpen(false);
         setQuery('');
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [open]);

   const filtered = useMemo(() => {
      if (!query.trim()) return options;
      const q = query.toLowerCase();
      return options.filter((o) => o.label.toLowerCase().includes(q));
   }, [options, query]);

   const menu = open ? (
      <div
         ref={menuRef}
         className="dropdown__menu dropdown__menu--portal"
         style={{
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
         }}
      >
         {searchable && (
            <div className="dropdown__search">
               <Search size={12} />
               <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari..."
               />
            </div>
         )}

         <div className="dropdown__list">
            {filtered.length === 0 && (
               <div className="dropdown__empty">Tidak ada hasil</div>
            )}
            {filtered.map((o) => (
               <button
                  key={o.value}
                  type="button"
                  className="dropdown__item"
                  onClick={() => {
                     onSelect(o.value);
                     setOpen(false);
                     setQuery('');
                  }}
               >
                  <span>{o.label}</span>
                  {o.value === value && <Check size={14} />}
               </button>
            ))}
         </div>
      </div>
   ) : null;

   return (
      <div className="dropdown dropdown--full">
         <button
            ref={triggerRef}
            type="button"
            className="dropdown__trigger"
            onClick={() => !disabled && setOpen((v) => !v)}
            disabled={disabled}
         >
            <span className={value ? '' : 'dropdown__placeholder'}>
               {value || placeholder}
            </span>
            {loading ? (
               <Loader2 size={12} className="spin" />
            ) : (
               <ChevronDown size={12} />
            )}
         </button>

         {menu && createPortal(menu, document.body)}
      </div>
   );
}

/* ===================== Change status helpers ===================== */

function statusLabel(status: ChangeItem['status']): string {
   if (status === 'added') return 'A';
   if (status === 'deleted') return 'D';
   return 'M';
}

function StatusIcon({ status }: { status: ChangeItem['status'] }) {
   if (status === 'added') return <FilePlus size={14} />;
   if (status === 'deleted') return <FileMinus size={14} />;
   return <FileEdit size={14} />;
}

/* ===================== GitPanel ===================== */

export function GitPanel({
   status,
   onPull,
   onPush,
   onClearAll,
   changes,
   onStage,
   onUnstage,
   onRestore,
   onStageAll,
   onUnstageAll,
   onRestoreAll,
}: Props) {
   const {
      token,
      setToken,
      owner,
      setOwner,
      repo,
      setRepo,
      branch,
      setBranch,
      clearAll: clearGitAuth,
   } = useGitAuth();

   const [commitMessage, setCommitMessage] = useState('Update from Eggs');

   const [verifyState, setVerifyState] = useState<
      | { state: 'idle' }
      | { state: 'busy' }
      | { state: 'ok'; login: string; avatarUrl: string }
      | { state: 'error'; message: string }
   >({ state: 'idle' });

   const [deviceState, setDeviceState] = useState<DeviceState>({ state: 'idle' });
   const [copied, setCopied] = useState(false);

   const [owners, setOwners] = useState<OwnerOption[]>([]);
   const [ownerType, setOwnerType] = useState<'user' | 'org'>('user');
   const [ownersLoading, setOwnersLoading] = useState(false);

   const [repos, setRepos] = useState<RepoOption[]>([]);
   const [reposLoading, setReposLoading] = useState(false);
   const [, setRepoDefaultBranch] = useState('');

   const [branches, setBranches] = useState<BranchOption[]>([]);
   const [branchesLoading, setBranchesLoading] = useState(false);

   const [commits, setCommits] = useState<CommitOption[]>([]);
   const [commitsLoading, setCommitsLoading] = useState(false);
   const [commitsError, setCommitsError] = useState<string | null>(null);

   const [configOpen, setConfigOpen] = useState(false);

   const config: GitConfig = { token, owner, repo, branch };
   const isBusy = status.state === 'busy';
   const canAct = !!token && !!owner && !!repo && !!branch && !isBusy;
   const canVerify = !!token && verifyState.state !== 'busy';

   const stagedChanges = changes.filter((c) => c.staged);
   const unstagedChanges = changes.filter((c) => !c.staged);
   const hasStaged = stagedChanges.length > 0;

   const showConfig = !canAct || configOpen;

   const fetchOwners = async (t: string) => {
      setOwnersLoading(true);
      const result = await listOwners({
         token: t,
         owner: '',
         repo: '',
         branch: '',
      });
      setOwnersLoading(false);
      if (result.ok) {
         setOwners(result.owners);
      }
   };

   const fetchCommits = async (cfg: GitConfig) => {
      setCommitsLoading(true);
      setCommitsError(null);
      const result = await listCommits(cfg);
      setCommitsLoading(false);
      if (result.ok) {
         setCommits(result.commits);
      } else {
         setCommits([]);
         setCommitsError(result.message);
      }
   };

   /* auto-verify kalau token tersimpan */
   useEffect(() => {
      if (!token) return;
      if (verifyState.state !== 'idle') return;
      let cancelled = false;

      (async () => {
         setVerifyState({ state: 'busy' });
         const result = await verifyToken({
            token,
            owner: '',
            repo: '',
            branch: '',
         });
         if (cancelled) return;
         if (result.ok) {
            setVerifyState({
               state: 'ok',
               login: result.login,
               avatarUrl: result.avatarUrl,
            });
            fetchOwners(token);
         } else {
            setVerifyState({ state: 'error', message: result.message });
         }
      })();

      return () => {
         cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [token]);

   /* fetch repos setelah owner dipilih */
   useEffect(() => {
      if (!token || !owner) return;
      let cancelled = false;

      (async () => {
         setReposLoading(true);
         setRepos([]);
         const result = await listRepos(config, owner, ownerType);
         if (cancelled) return;
         setReposLoading(false);
         if (result.ok) {
            setRepos(result.repos);
         }
      })();

      return () => {
         cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [token, owner, ownerType]);

   /* fetch branches setelah repo dipilih */
   useEffect(() => {
      if (!token || !owner || !repo) return;
      let cancelled = false;

      (async () => {
         setBranchesLoading(true);
         setBranches([]);
         const result = await listBranches({
            token,
            owner,
            repo,
            branch: '',
         });
         if (cancelled) return;
         setBranchesLoading(false);
         if (result.ok) {
            setBranches(result.branches);
            setRepoDefaultBranch(result.defaultBranch);
            setBranch((curr) => curr || result.defaultBranch);
         }
      })();

      return () => {
         cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [token, owner, repo]);

   /* fetch commits setelah branch dipilih */
   useEffect(() => {
      if (!token || !owner || !repo || !branch) {
         setCommits([]);
         setCommitsError(null);
         return;
      }
      let cancelled = false;

      (async () => {
         setCommitsLoading(true);
         setCommitsError(null);
         const result = await listCommits({
            token,
            owner,
            repo,
            branch,
         });
         if (cancelled) return;
         setCommitsLoading(false);
         if (result.ok) {
            setCommits(result.commits);
         } else {
            setCommits([]);
            setCommitsError(result.message);
         }
      })();

      return () => {
         cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [token, owner, repo, branch]);

   const handleVerify = async () => {
      setVerifyState({ state: 'busy' });
      const result = await verifyToken(config);
      if (result.ok) {
         setVerifyState({
            state: 'ok',
            login: result.login,
            avatarUrl: result.avatarUrl,
         });
         if (!owner) setOwner(result.login);
         fetchOwners(token);
      } else {
         setVerifyState({ state: 'error', message: result.message });
      }
   };

   const handleLogin = async () => {
      setDeviceState({ state: 'idle' });

      const result = await loginWithDeviceFlow({
         onCode: (info) => {
            setDeviceState({
               state: 'waiting',
               userCode: info.userCode,
               verificationUri: info.verificationUri,
            });
         },
      });

      if (result.ok) {
         setToken(result.token);
         setDeviceState({ state: 'idle' });
         setVerifyState({ state: 'busy' });
         const verify = await verifyToken({
            token: result.token,
            owner: '',
            repo: '',
            branch: '',
         });
         if (verify.ok) {
            setVerifyState({
               state: 'ok',
               login: verify.login,
               avatarUrl: verify.avatarUrl,
            });
            setOwner(verify.login);
            fetchOwners(result.token);
         } else {
            setVerifyState({ state: 'error', message: verify.message });
         }
      } else {
         setDeviceState({ state: 'error', message: result.message });
      }
   };

   const copyCode = () => {
      if (deviceState.state !== 'waiting') return;
      navigator.clipboard.writeText(deviceState.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const handleLogout = () => {
      clearGitAuth();
      setOwners([]);
      setRepos([]);
      setBranches([]);
      setCommits([]);
      setCommitsError(null);
      setVerifyState({ state: 'idle' });
      setDeviceState({ state: 'idle' });
      setConfigOpen(false);
      onClearAll();
   };

   const handleRefreshCommits = () => {
      if (!canAct) return;
      fetchCommits(config);
   };

   const ownerOptions = owners.map((o) => ({
      value: o.login,
      label: o.type === 'org' ? `${o.login} (org)` : o.login,
   }));

   const repoOptions = repos.map((r) => ({
      value: r.name,
      label: r.private ? `🔒 ${r.name}` : r.name,
   }));

   const branchOptions = branches.map((b) => ({
      value: b.name,
      label: b.isDefault ? `${b.name} (default)` : b.name,
   }));

   return (
      <div className="git-panel">
         <div className="git-panel__header">
            <span className="git-panel__title">Git</span>

            {canAct && (
               <button
                  className={`icon-btn ${configOpen ? 'icon-btn--active' : ''}`}
                  onClick={() => setConfigOpen((v) => !v)}
                  title={configOpen ? 'Tampilkan panel utama' : 'Buka settings Git'}
               >
                  <Settings size={16} />
               </button>
            )}
         </div>

         {/* ===================== CONFIG VIEW ===================== */}
         {showConfig && (
            <div className="git-panel__scroll">
               {deviceState.state === 'idle' && !token && (
                  <button className="btn" onClick={handleLogin}>
                     <LogIn size={14} /> Login dengan GitHub
                  </button>
               )}

               {deviceState.state === 'waiting' && (
                  <div className="device-flow">
                     <p className="device-flow__instruction">
                        Buka{' '}
                        <a
                           href={deviceState.verificationUri}
                           target="_blank"
                           rel="noreferrer"
                        >
                           {deviceState.verificationUri}
                        </a>{' '}
                        dan masukkan kode:
                     </p>
                     <div className="device-flow__code">
                        <code>{deviceState.userCode}</code>
                        <button className="icon-btn" onClick={copyCode} title="Copy">
                           {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                     </div>
                     <p className="device-flow__hint">
                        <Loader2 size={12} className="spin" /> Menunggu otorisasi...
                     </p>
                  </div>
               )}

               {deviceState.state === 'error' && (
                  <div className="git-verify git-verify--error">
                     {deviceState.message}
                  </div>
               )}

               {!token && (
                  <label className="field">
                     <span>Token (PAT) — atau login di atas</span>
                     <input
                        type="password"
                        value={token}
                        onChange={(e) => {
                           setToken(e.target.value);
                           setVerifyState({ state: 'idle' });
                        }}
                        placeholder="ghp_..."
                        autoComplete="off"
                     />
                  </label>
               )}

               {token && (
                  <div className="field">
                     <span>Token</span>
                     <div className="token-display">
                        <code>
                           {token.slice(0, 8)}...{token.slice(-4)}
                        </code>
                        <button
                           className="icon-btn"
                           onClick={handleLogout}
                           title="Hapus token"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  </div>
               )}

               <button
                  className="btn"
                  disabled={!canVerify}
                  onClick={handleVerify}
               >
                  {verifyState.state === 'busy' ? (
                     <>
                        <Loader2 size={14} className="spin" /> Memverifikasi...
                     </>
                  ) : (
                     <>
                        <ShieldCheck size={14} /> Test Connection
                     </>
                  )}
               </button>

               {verifyState.state === 'ok' && (
                  <div className="git-verify git-verify--ok">
                     <img
                        src={verifyState.avatarUrl}
                        alt={verifyState.login}
                        className="git-verify__avatar"
                     />
                     <span className="git-verify__text">
                        Terhubung sebagai <strong>{verifyState.login}</strong>
                     </span>
                     <button
                        className="icon-btn git-verify__logout"
                        onClick={handleLogout}
                        title="Logout"
                     >
                        <LogOut size={14} />
                     </button>
                  </div>
               )}

               {verifyState.state === 'error' && (
                  <div className="git-verify git-verify--error">
                     {verifyState.message}
                  </div>
               )}

               <div className="field">
                  <span>Owner</span>
                  <Dropdown
                     value={owner}
                     placeholder={owners.length === 0 ? 'Login dulu' : 'Pilih owner'}
                     options={ownerOptions}
                     onSelect={(v) => {
                        setOwner(v);
                        const found = owners.find((o) => o.login === v);
                        setOwnerType(found?.type ?? 'user');
                        setRepo('');
                        setBranch('');
                        setRepos([]);
                        setBranches([]);
                        setCommits([]);
                     }}
                     disabled={owners.length === 0}
                     loading={ownersLoading}
                  />
               </div>

               <div className="field">
                  <span>Repo</span>
                  <Dropdown
                     value={repo}
                     placeholder={
                        !owner
                           ? 'Pilih owner dulu'
                           : reposLoading
                              ? 'Memuat...'
                              : 'Pilih repo'
                     }
                     options={repoOptions}
                     onSelect={(v) => {
                        setRepo(v);
                        setBranch('');
                        setBranches([]);
                        setCommits([]);
                     }}
                     disabled={!owner || repos.length === 0}
                     loading={reposLoading}
                     searchable
                  />
               </div>

               <div className="field">
                  <span>Branch</span>
                  <Dropdown
                     value={branch}
                     placeholder={
                        !repo
                           ? 'Pilih repo dulu'
                           : branchesLoading
                              ? 'Memuat...'
                              : 'Pilih branch'
                     }
                     options={branchOptions}
                     onSelect={(v) => {
                        setBranch(v);
                        setCommits([]);
                     }}
                     disabled={!repo || branches.length === 0}
                     loading={branchesLoading}
                  />
               </div>

               {canAct && (
                  <button
                     className="btn btn--primary"
                     onClick={() => setConfigOpen(false)}
                  >
                     Selesai — Tampilkan Panel
                  </button>
               )}

               <div className="git-panel__hint">
                  <KeyRound size={12} />
                  <span>Token disimpan di localStorage — hilang saat Logout.</span>
               </div>
            </div>
         )}

         {/* ===================== MAIN VIEW ===================== */}
         {!showConfig && (
            <>
               <div className="git-panel__actions-section">
                  <label className="field">
                     <span>Commit message</span>
                     <input
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Update from Eggs"
                     />
                  </label>

                  <div className="git-panel__actions">
                     <button
                        className="btn"
                        disabled={!canAct}
                        onClick={() => onPull(config)}
                     >
                        <ArrowDown size={14} /> Pull
                     </button>
                     <button
                        className="btn btn--primary"
                        disabled={!canAct || !commitMessage.trim() || !hasStaged}
                        onClick={() => onPush(config, commitMessage.trim())}
                        title={
                           !hasStaged
                              ? 'Tidak ada file yang di-stage'
                              : 'Push file yang di-stage'
                        }
                     >
                        <ArrowUp size={14} /> Push
                     </button>
                  </div>
               </div>

               <div className="changes">
                  <div className="changes__header">
                     <span className="changes__title">
                        Changes ({changes.length})
                     </span>
                     <div className="changes__actions">
                        {unstagedChanges.length > 0 && (
                           <button
                              className="icon-btn"
                              onClick={onStageAll}
                              title="Stage semua"
                           >
                              <Plus size={14} />
                           </button>
                        )}
                        {stagedChanges.length > 0 && (
                           <button
                              className="icon-btn"
                              onClick={onUnstageAll}
                              title="Unstage semua"
                           >
                              <Minus size={14} />
                           </button>
                        )}
                        {changes.length > 0 && (
                           <button
                              className="icon-btn"
                              onClick={onRestoreAll}
                              title="Restore semua"
                           >
                              <Undo2 size={14} />
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="changes__body">
                     {changes.length === 0 && (
                        <div className="changes__empty">
                           Tidak ada perubahan.
                        </div>
                     )}

                     {changes.map((c) => (
                        <div key={c.file.id} className="change-item">
                           <span
                              className={`change-item__status change-item__status--${c.status}`}
                              title={c.status}
                           >
                              {statusLabel(c.status)}
                           </span>

                           <StatusIcon status={c.status} />

                           <span className="change-item__name" title={c.file.name}>
                              {c.file.name}
                           </span>

                           {c.staged ? (
                              <button
                                 className="icon-btn change-item__action"
                                 onClick={() => onUnstage(c.file.id)}
                                 title="Unstage"
                              >
                                 <Minus size={14} />
                              </button>
                           ) : (
                              <button
                                 className="icon-btn change-item__action"
                                 onClick={() => onStage(c.file.id)}
                                 title="Stage"
                              >
                                 <Plus size={14} />
                              </button>
                           )}

                           <button
                              className="icon-btn change-item__action"
                              onClick={() => onRestore(c.file.id)}
                              title="Restore"
                           >
                              <Undo2 size={14} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="commit-history">
                  <div className="commit-history__header">
                     <GitCommit size={14} />
                     <span className="commit-history__title">History</span>
                     <button
                        className="icon-btn"
                        onClick={handleRefreshCommits}
                        disabled={commitsLoading}
                        title="Refresh"
                     >
                        {commitsLoading ? (
                           <Loader2 size={12} className="spin" />
                        ) : (
                           <RefreshCw size={12} />
                        )}
                     </button>
                  </div>

                  <div className="commit-history__body">
                     {commitsError && (
                        <div className="commit-history__error">{commitsError}</div>
                     )}

                     {!commitsError && commits.length === 0 && !commitsLoading && (
                        <div className="commit-history__empty">
                           Belum ada commit.
                        </div>
                     )}

                     {commits.length > 0 && (
                        <ul className="commit-history__list">
                           {commits.map((c) => (
                              <li key={c.sha} className="commit-item">
                                 {c.authorAvatarUrl ? (
                                    <img
                                       src={c.authorAvatarUrl}
                                       alt={c.authorName}
                                       className="commit-item__avatar"
                                    />
                                 ) : (
                                    <div className="commit-item__avatar commit-item__avatar--fallback">
                                       {c.authorName.charAt(0).toUpperCase()}
                                    </div>
                                 )}

                                 <div className="commit-item__body">
                                    <div
                                       className="commit-item__message"
                                       title={c.message}
                                    >
                                       {c.message}
                                    </div>
                                    <div className="commit-item__meta">
                                       <span>{c.authorLogin ?? c.authorName}</span>
                                       <span>·</span>
                                       <span>{relativeTime(c.date)}</span>
                                       <span>·</span>
                                       <code>{c.shaShort}</code>
                                    </div>
                                 </div>

                                 <a
                                    href={c.htmlUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="icon-btn commit-item__link"
                                    title="Buka di GitHub"
                                 >
                                    <ExternalLink size={12} />
                                 </a>
                              </li>
                           ))}
                        </ul>
                     )}
                  </div>
               </div>
            </>
         )}

         {/* ===================== Bottom bar ===================== */}
         {canAct && (
            <div className="status-bar status-bar--panel">
               <GitBranch size={11} />
               <span className="status-bar__item">
                  {owner}/{repo}
               </span>
               <span className="status-bar__sep" />
               <span className="status-bar__item">{branch}</span>
               {commits.length > 0 && (
                  <>
                     <span className="status-bar__sep" />
                     <span className="status-bar__item">
                        {commits.length} commit{commits.length !== 1 ? 's' : ''}
                     </span>
                  </>
               )}
            </div>
         )}

         {status.state !== 'idle' && (
            <div className={`git-status git-status--${status.state}`}>
               {status.message}
            </div>
         )}
      </div>
   );
}