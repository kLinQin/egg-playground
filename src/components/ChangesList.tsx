import { useEffect, useState } from 'react';
import {
   Check,
   X,
   Undo2,
   Plus,
   Minus,
   FileEdit,
   FilePlus,
   FileMinus,
} from 'lucide-react';
import type { ChangeItem } from '../types';

type Mode = 'git' | 'local';

type Props = {
   mode: Mode;
   changes: ChangeItem[];
   pendingIds: Set<string>;

   /* git mode only */
   onStage?: (fileId: string) => void;
   onUnstage?: (fileId: string) => void;
   onStageAll?: () => void;
   onUnstageAll?: () => void;

   /* both modes */
   onRestore: (fileId: string) => void;
   onRestoreAll: () => void;

   /* diff */
   onOpenDiff?: (fileId: string) => void;

   /* teks label */
   savedTitle: string;
   emptyText?: string;
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

export function ChangesList({
   mode,
   changes,
   pendingIds,
   onStage,
   onUnstage,
   onStageAll,
   onUnstageAll,
   onRestore,
   onRestoreAll,
   onOpenDiff,
   savedTitle,
   emptyText = 'Tidak ada perubahan.',
}: Props) {
   const [confirmRestoreAll, setConfirmRestoreAll] = useState(false);
   const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

   useEffect(() => {
      if (!confirmRestoreAll && !confirmRestoreId) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            setConfirmRestoreAll(false);
            setConfirmRestoreId(null);
         }
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [confirmRestoreAll, confirmRestoreId]);

   const stagedChanges = changes.filter((c) => c.staged);
   const unstagedChanges = changes.filter((c) => !c.staged);

   const showStageControls = mode === 'git';

   return (
      <div className="changes">
         <div className="changes__header">
            {confirmRestoreAll ? (
               <>
                  <span className="changes__confirm-text">
                     Buang semua perubahan?
                  </span>
                  <div className="changes__confirm-actions">
                     <button
                        className="icon-btn changes__confirm-ok"
                        onClick={() => {
                           setConfirmRestoreAll(false);
                           onRestoreAll();
                        }}
                        title="Ya, buang semua"
                     >
                        <Check size={14} />
                     </button>
                     <button
                        className="icon-btn"
                        onClick={() => setConfirmRestoreAll(false)}
                        title="Batal"
                     >
                        <X size={14} />
                     </button>
                  </div>
               </>
            ) : (
               <>
                  <span className="changes__title">
                     Changes ({changes.length})
                  </span>
                  <div className="changes__actions">
                     {showStageControls && unstagedChanges.length > 0 && (
                        <button
                           className="icon-btn"
                           onClick={onStageAll}
                           title="Stage semua"
                        >
                           <Plus size={14} />
                        </button>
                     )}
                     {showStageControls && stagedChanges.length > 0 && (
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
                           onClick={() => setConfirmRestoreAll(true)}
                           title="Restore semua"
                        >
                           <Undo2 size={14} />
                        </button>
                     )}
                  </div>
               </>
            )}
         </div>

         <div className="changes__body">
            {changes.length === 0 && (
               <div className="changes__empty">{emptyText}</div>
            )}

            {changes.map((c) => {
               const isSaved = pendingIds.has(c.file.id);
               const isConfirming = confirmRestoreId === c.file.id;

               if (isConfirming) {
                  return (
                     <div
                        key={c.file.id}
                        className="change-item change-item--confirming"
                     >
                        <span className="change-item__confirm-text">
                           Buang perubahan?
                        </span>
                        <div className="change-item__confirm-actions">
                           <button
                              className="icon-btn change-item__confirm-ok"
                              onClick={() => {
                                 setConfirmRestoreId(null);
                                 onRestore(c.file.id);
                              }}
                              title="Ya, buang"
                           >
                              <Check size={14} />
                           </button>
                           <button
                              className="icon-btn"
                              onClick={() => setConfirmRestoreId(null)}
                              title="Batal"
                           >
                              <X size={14} />
                           </button>
                        </div>
                     </div>
                  );
               }

               return (
                  <div key={c.file.id} className="change-item">
                     <span
                        className={`change-item__status change-item__status--${c.status}`}
                        title={c.status}
                     >
                        {statusLabel(c.status)}
                     </span>

                     <button
                        type="button"
                        className="change-item__open"
                        onClick={() => onOpenDiff?.(c.file.id)}
                        disabled={!onOpenDiff}
                        title={onOpenDiff ? 'Lihat diff' : undefined}
                     >
                        <StatusIcon status={c.status} />
                        <span className="change-item__name" title={c.file.name}>
                           {c.file.name}
                        </span>
                     </button>

                     {isSaved && (
                        <span className="change-item__saved" title={savedTitle}>
                           <Check size={12} />
                           <span>saved</span>
                        </span>
                     )}

                     {showStageControls &&
                        (c.staged ? (
                           <button
                              className="icon-btn change-item__action"
                              onClick={() => onUnstage?.(c.file.id)}
                              title="Unstage"
                           >
                              <Minus size={14} />
                           </button>
                        ) : (
                           <button
                              className="icon-btn change-item__action"
                              onClick={() => onStage?.(c.file.id)}
                              title="Stage"
                           >
                              <Plus size={14} />
                           </button>
                        ))}

                     <button
                        className="icon-btn change-item__action"
                        onClick={() => setConfirmRestoreId(c.file.id)}
                        title="Restore"
                     >
                        <Undo2 size={14} />
                     </button>
                  </div>
               );
            })}
         </div>
      </div>
   );
}