import { useEffect, useState } from 'react';
import {
   Save,
   Undo2,
   FileEdit,
   FilePlus,
   FileMinus,
   HardDrive,
   Check,
   X,
} from 'lucide-react';
import type { ChangeItem } from '../types';

type Props = {
   changes: ChangeItem[];
   pendingIds: Set<string>;
   onDiscard: (fileId: string) => void;
   onDiscardAll: () => void;
   onSaveAll: () => void;
   saving: boolean;
};

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

export function LocalPanel({
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
   const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);

   /* Escape → cancel inline confirm */
   useEffect(() => {
      if (!confirmDiscardAll && !confirmDiscardId) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            setConfirmDiscardAll(false);
            setConfirmDiscardId(null);
         }
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [confirmDiscardAll, confirmDiscardId]);

   /* ---------- mode label ---------- */
   const modeLabel = 'local Storage';

   /* ---------- render satu baris change ---------- */
   const renderChange = (c: ChangeItem) => {
      const isSaved = pendingIds.has(c.file.id);
      const isConfirming = confirmDiscardId === c.file.id;

      /* ---------- inline confirm mode ---------- */
      if (isConfirming) {
         return (
            <div key={c.file.id} className="change-item change-item--confirming">
               <span className="change-item__confirm-text">
                  Buang perubahan?
               </span>
               <div className="change-item__confirm-actions">
                  <button
                     className="icon-btn change-item__confirm-ok"
                     onClick={() => {
                        setConfirmDiscardId(null);
                        onDiscard(c.file.id);
                     }}
                     title="Ya, buang"
                  >
                     <Check size={14} />
                  </button>
                  <button
                     className="icon-btn"
                     onClick={() => setConfirmDiscardId(null)}
                     title="Batal"
                  >
                     <X size={14} />
                  </button>
               </div>
            </div>
         );
      }

      /* ---------- normal mode ---------- */
      return (
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

            {isSaved && (
               <span
                  className="change-item__saved"
                  title="Sudah disave, tunggu Save All"
               >
                  <Check size={12} />
                  <span>saved</span>
               </span>
            )}

            <button
               className="icon-btn change-item__action"
               onClick={() => setConfirmDiscardId(c.file.id)}
               title="Buang perubahan"
            >
               <Undo2 size={14} />
            </button>
         </div>
      );
   };

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
            <div className="changes">
               <div className="changes__header">
                  <span className="changes__title">
                     Changes ({changes.length})
                  </span>
               </div>

               <div className="changes__body">
                  {changes.map(renderChange)}
               </div>
            </div>
         ) : (
            <div className="local-panel__hint">
               Tidak ada perubahan.
            </div>
         )}
      </div>
   );
}