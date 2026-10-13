import { useEffect, useState } from 'react';
import {
   ArrowDown,
   ArrowUp,
   Settings,
   X,
   Loader2,
   Save,
   LogOut,
   KeyRound,
   Cloud,
   ShieldCheck,
   Lock,
} from 'lucide-react';
import type { B2Config, GitStatus, ChangeItem } from '../types';
import { verifyB2 } from '../lib/cloudStorage';
import { useB2Auth } from '../hooks/useB2Auth';
import { ChangesList } from './ChangesList';

type Props = {
   status: GitStatus;
   onPull: (config: B2Config) => void;
   onPush: (config: B2Config, commitMessage: string) => void;
   onClearAll: () => void;

   changes: ChangeItem[];
   pendingIds: Set<string>;
   onStage: (fileId: string) => void;
   onUnstage: (fileId: string) => void;
   onRestore: (fileId: string) => void;
   onStageAll: () => void;
   onUnstageAll: () => void;
   onRestoreAll: () => void;
};

/* ---------- env config ---------- */
const ENV_PASSCODE = import.meta.env.VITE_B2_PASSCODE ?? '';
const ENV_KEY_ID = import.meta.env.VITE_B2_KEY_ID ?? '';
const ENV_APP_KEY = import.meta.env.VITE_B2_APP_KEY ?? '';
const ENV_BUCKET = import.meta.env.VITE_B2_BUCKET ?? '';
const ENV_ENDPOINT = import.meta.env.VITE_B2_ENDPOINT ?? '';
const ENV_REGION = import.meta.env.VITE_B2_REGION ?? '';

const HAS_ENV_CONFIG =
   !!ENV_PASSCODE &&
   !!ENV_KEY_ID &&
   !!ENV_APP_KEY &&
   !!ENV_BUCKET &&
   !!ENV_ENDPOINT &&
   !!ENV_REGION;

export function B2Panel({
   status,
   onPull,
   onPush,
   onClearAll,
   changes,
   pendingIds,
   onStage,
   onUnstage,
   onRestore,
   onStageAll,
   onUnstageAll,
   onRestoreAll,
}: Props) {
   const {
      keyId,
      setKeyId,
      applicationKey,
      setApplicationKey,
      bucket,
      setBucket,
      endpoint,
      setEndpoint,
      region,
      setRegion,
      config,
      isComplete,
      clearAll: clearB2Auth,
   } = useB2Auth();

   const [commitMessage, setCommitMessage] = useState('Update from Eggs');
   const [configOpen, setConfigOpen] = useState(false);

   /* ---------- passcode mode ---------- */
   const [passcodeMode, setPasscodeMode] = useState(false);
   const [passcodeInput, setPasscodeInput] = useState('');
   const [passcodeError, setPasscodeError] = useState('');

   const [verifyState, setVerifyState] = useState<
      | { state: 'idle' }
      | { state: 'busy' }
      | { state: 'ok'; bucket: string; fileCount: number }
      | { state: 'error'; message: string }
   >({ state: 'idle' });

   const isBusy = status.state === 'busy';
   const canAct = isComplete && !isBusy;
   const stagedChanges = changes.filter((c) => c.staged);
   const hasStaged = stagedChanges.length > 0;
   const showConfig = !canAct || configOpen;

   const isNotifying = status.state !== 'idle';
   const notifClass =
      status.state === 'success'
         ? 'status-bar--success'
         : status.state === 'error'
            ? 'status-bar--error'
            : status.state === 'busy'
               ? 'status-bar--busy'
               : '';

   /* auto-verify kalau config sudah lengkap */
   useEffect(() => {
      if (!isComplete) return;
      if (verifyState.state !== 'idle') return;

      let cancelled = false;

      (async () => {
         setVerifyState({ state: 'busy' });
         const result = await verifyB2(config);
         if (cancelled) return;
         if (result.ok) {
            setVerifyState({
               state: 'ok',
               bucket: result.bucket,
               fileCount: result.fileCount,
            });
         } else {
            setVerifyState({ state: 'error', message: result.message });
         }
      })();

      return () => {
         cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isComplete]);

   const handleVerify = async () => {
      setVerifyState({ state: 'busy' });
      const result = await verifyB2(config);
      if (result.ok) {
         setVerifyState({
            state: 'ok',
            bucket: result.bucket,
            fileCount: result.fileCount,
         });
      } else {
         setVerifyState({ state: 'error', message: result.message });
      }
   };

   const handleLogout = () => {
      clearB2Auth();
      setVerifyState({ state: 'idle' });
      setConfigOpen(false);
      onClearAll();
   };

   /* ---------- passcode: buka form ---------- */
   const openPasscodeMode = () => {
      setPasscodeMode(true);
      setPasscodeInput('');
      setPasscodeError('');
      setConfigOpen(false);
   };

   /* ---------- passcode: batal ---------- */
   const cancelPasscodeMode = () => {
      setPasscodeMode(false);
      setPasscodeInput('');
      setPasscodeError('');
   };

   /* ---------- passcode: submit ---------- */
   const submitPasscode = () => {
      setPasscodeError('');

      if (!HAS_ENV_CONFIG) {
         setPasscodeError(
            'Config .env belum lengkap. Periksa VITE_B2_* di file .env.'
         );
         return;
      }

      if (passcodeInput !== ENV_PASSCODE) {
         setPasscodeError('Passcode salah.');
         return;
      }

      /* ---------- auto-isi config dari .env ---------- */
      setKeyId(ENV_KEY_ID);
      setApplicationKey(ENV_APP_KEY);
      setBucket(ENV_BUCKET);
      setEndpoint(ENV_ENDPOINT);
      setRegion(ENV_REGION);

      setPasscodeMode(false);
      setPasscodeInput('');
      setPasscodeError('');
      setVerifyState({ state: 'idle' });
   };

   /* ---------- passcode form ---------- */
   if (passcodeMode) {
      return (
         <div className="git-panel">
            <div className="git-panel__header">
               <Lock size={14} />
               <span className="git-panel__title">Unlock B2</span>
            </div>

            <div className="git-panel__scroll">
               <label className="field">
                  <span>Passcode</span>
                  <input
                     type="password"
                     value={passcodeInput}
                     onChange={(e) => {
                        setPasscodeInput(e.target.value);
                        setPasscodeError('');
                     }}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') submitPasscode();
                        if (e.key === 'Escape') cancelPasscodeMode();
                     }}
                     placeholder="Masukkan passcode"
                     autoFocus
                     autoComplete="off"
                  />
               </label>

               {passcodeError && (
                  <div className="git-verify git-verify--error">
                     {passcodeError}
                  </div>
               )}

               <button
                  className="btn btn--primary"
                  onClick={submitPasscode}
                  disabled={!passcodeInput}
               >
                  <KeyRound size={14} /> Unlock
               </button>

               <button className="btn" onClick={cancelPasscodeMode}>
                  <X size={14} /> Batal
               </button>

               <div className="git-panel__hint">
                  <KeyRound size={12} />
                  <span>Config akan diambil otomatis dari .env.</span>
               </div>
            </div>
         </div>
      );
   }

   /* ---------- panel normal ---------- */
   return (
      <div className="git-panel">
         <div className="git-panel__header">
            <span className="git-panel__title">B2 Cloud</span>
            {canAct && (
               <button
                  className={`icon-btn ${configOpen ? 'icon-btn--active' : ''}`}
                  onClick={() => setConfigOpen((v) => !v)}
                  title={configOpen ? 'Tampilkan panel utama' : 'Buka settings B2'}
               >
                  <Settings size={16} />
               </button>
            )}
         </div>

         {/* ===================== CONFIG VIEW ===================== */}
         {showConfig && (
            <div className="git-panel__scroll">
               <label className="field">
                  <span>Key ID</span>
                  <input
                     value={keyId}
                     onChange={(e) => {
                        setKeyId(e.target.value);
                        setVerifyState({ state: 'idle' });
                     }}
                     placeholder="005..."
                     autoComplete="off"
                  />
               </label>

               <label className="field">
                  <span>Application Key</span>
                  <input
                     type="password"
                     value={applicationKey}
                     onChange={(e) => {
                        setApplicationKey(e.target.value);
                        setVerifyState({ state: 'idle' });
                     }}
                     placeholder="K005..."
                     autoComplete="off"
                  />
               </label>

               <label className="field">
                  <span>Bucket name</span>
                  <input
                     value={bucket}
                     onChange={(e) => {
                        setBucket(e.target.value);
                        setVerifyState({ state: 'idle' });
                     }}
                     placeholder="kode-eggs-2026"
                     autoComplete="off"
                  />
               </label>

               <label className="field">
                  <span>Endpoint</span>
                  <input
                     value={endpoint}
                     onChange={(e) => {
                        setEndpoint(e.target.value);
                        setVerifyState({ state: 'idle' });
                     }}
                     placeholder="s3.us-east-005.backblazeb2.com"
                     autoComplete="off"
                  />
               </label>

               <label className="field">
                  <span>Region</span>
                  <input
                     value={region}
                     onChange={(e) => {
                        setRegion(e.target.value);
                        setVerifyState({ state: 'idle' });
                     }}
                     placeholder="us-east-005"
                     autoComplete="off"
                  />
               </label>

               <button
                  className="btn"
                  disabled={!isComplete || verifyState.state === 'busy'}
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
                     <Cloud size={16} />
                     <span className="git-verify__text">
                        Terhubung ke <strong>{verifyState.bucket}</strong> (
                        {verifyState.fileCount} file)
                     </span>
                     <button
                        className="icon-btn git-verify__logout"
                        onClick={handleLogout}
                        title="Hapus config"
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

               {canAct && (
                  <button
                     className="btn btn--primary"
                     onClick={() => setConfigOpen(false)}
                  >
                     <Save size={14} /> Selesai — Tampilkan Panel
                  </button>
               )}

               <div className="git-panel__hint">
                  <KeyRound size={12} />
                  <span>
                     Config disimpan di localStorage — hilang saat Logout.
                  </span>
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

               <ChangesList
                  mode="git"
                  changes={changes}
                  pendingIds={pendingIds}
                  onStage={onStage}
                  onUnstage={onUnstage}
                  onStageAll={onStageAll}
                  onUnstageAll={onUnstageAll}
                  onRestore={onRestore}
                  onRestoreAll={onRestoreAll}
                  savedTitle="Sudah disave, tunggu Push"
               />
            </>
         )}

         {/* ===================== Bottom bar ===================== */}
         <div className={`status-bar status-bar--panel ${isNotifying ? notifClass : ''}`}>
            {isNotifying ? (
               <span className="status-bar__notif">{status.message}</span>
            ) : (
               <>
                  <Cloud size={11} />
                  <span className="status-bar__item">
                     {bucket || '—'}
                  </span>
                  <span className="status-bar__sep" />
                  <span className="status-bar__item">{region || '—'}</span>
                  <span className="status-bar__spacer" />
                  {HAS_ENV_CONFIG && (
                     <button
                        type="button"
                        className="icon-btn status-bar__unlock-btn"
                        onClick={openPasscodeMode}
                        title="Unlock dengan passcode"
                     >
                        <KeyRound size={12} />
                     </button>
                  )}
               </>
            )}
         </div>
      </div>
   );
}