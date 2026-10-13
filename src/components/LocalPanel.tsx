import { useEffect, useState } from 'react';
import {
   Save,
   Undo2,
   HardDrive,
   Check,
   X,
} from 'lucide-react';
import type { ChangeItem, GitStatus } from '../types';
import { ChangesList } from './ChangesList';

type Props = {
   status: GitStatus;
   changes: ChangeItem[];
   pendingIds: Set<string>;
   onDiscard: (fileId: string) => void;
   onDiscardAll: () => void;
   onSaveAll: () => void;
   saving: boolean;
};

export function LocalPanel({
   status,
   changes,
   pendingIds,
   onDiscard,
   onDiscardAll,
   onSaveAll,
   saving,
}: Props) {
   const hasChanges = changes.length > 0;

   /* ---------- inline confirm state ---------- */
   const [confirmDiscardAll, setConfirmDiscardAll] = useState(false);

   /* Escape → cancel inline confirm */
   useEffect(() => {
      if (!confirmDiscardAll) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setConfirmDiscardAll(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [confirmDiscardAll]);

   /* ---------- mode label ---------- */
   const modeLabel = 'local Storage';

   /* ---------- notif bottom bar ---------- */
   const isNotifying = status.state !== 'idle';
   const notifClass =
      status.state === 'success'
         ? 'status-bar--success'
         : status.state === 'error'
            ? 'status-bar--error'
            : status.state === 'busy'
               ? 'status-bar--busy'
               : '';

   return (
      <div className="local-panel">
         {/* ---------- header status mode ---------- */}
         <div className="local-panel__mode">
            {confirmDiscardAll ? (
               <>
                  <span className="local-panel__confirm-text">
                     Buang semua perubahan?
                  </span>
                  <div className="local-panel__confirm-actions">
                     <button
                        className="icon-btn local-panel__confirm-ok"
                        onClick={() => {
                           setConfirmDiscardAll(false);
                           onDiscardAll();
                        }}
                        title="Ya, buang semua"
                     >
                        <Check size={14} />
                     </button>
                     <button
                        className="icon-btn"
                        onClick={() => setConfirmDiscardAll(false)}
                        title="Batal"
                     >
                        <X size={14} />
                     </button>
                  </div>
               </>
            ) : (
               <>
                  <HardDrive size={14} />
                  <span className="local-panel__mode-label">{modeLabel}</span>
               </>
            )}
         </div>

         {/* ---------- action buttons (segmented, rata tengah) ---------- */}
         <div className="local-panel__actions-section">
            <div className="local-panel__actions">
               <div className="local-panel__switch">
                  <button
                     type="button"
                     className="local-panel__switch-btn"
                     onClick={onSaveAll}
                     disabled={!hasChanges || saving}
                     title={
                        !hasChanges
                           ? 'Tidak ada file yang perlu disimpan'
                           : 'Simpan semua file dan bersihkan dari Changes'
                     }
                  >
                     <Save size={14} />
                     <span>{saving ? 'Menyimpan...' : 'Save All'}</span>
                  </button>

                  <button
                     type="button"
                     className="local-panel__switch-btn local-panel__switch-btn--danger"
                     onClick={() => setConfirmDiscardAll(true)}
                     disabled={!hasChanges || saving}
                     title="Buang semua perubahan"
                  >
                     <Undo2 size={14} />
                     <span>Discard All</span>
                  </button>
               </div>
            </div>
         </div>

         {/* ---------- changes list ---------- */}
         {hasChanges ? (
            <ChangesList
               mode="local"
               changes={changes}
               pendingIds={pendingIds}
               onRestore={onDiscard}
               onRestoreAll={onDiscardAll}
               savedTitle="Sudah disave, tunggu Save All"
            />
         ) : (
            <div className="local-panel__hint">
               Tidak ada perubahan.
            </div>
         )}

         {/* ---------- bottom bar (normal / notif) ---------- */}
         <div className={`status-bar status-bar--panel ${isNotifying ? notifClass : ''}`}>
            {isNotifying ? (
               <span className="status-bar__notif">{status.message}</span>
            ) : (
               <>
                  <HardDrive size={11} />
                  <span className="status-bar__item">local Storage</span>
               </>
            )}
         </div>
      </div>
   );
}