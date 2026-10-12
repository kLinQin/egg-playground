import {
   Save,
   Undo2,
   FileEdit,
   FilePlus,
   FileMinus,
   HardDrive,
   FolderOpen,
   Trash2,
   Check,
} from 'lucide-react';
import type { ChangeItem, FileSource } from '../types';

type Props = {
   source: FileSource;
   folderName: string | null;
   changes: ChangeItem[];
   pendingIds: Set<string>;
   onDiscard: (fileId: string) => void;
   onDiscardAll: () => void;
   onSaveAll: () => void;
   onClearAll: () => void;
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
   source,
   folderName,
   changes,
   pendingIds,
   onDiscard,
   onDiscardAll,
   onSaveAll,
   onClearAll,
   saving,
}: Props) {
   const hasChanges = changes.length > 0;

   /* ---------- mode label ---------- */
   const modeLabel =
      source === 'disk'
         ? folderName
            ? `Folder: ${folderName}`
            : 'Folder'
         : 'Local (localStorage)';

   /* ---------- render satu baris change ---------- */
   const renderChange = (c: ChangeItem) => {
      const isSaved = pendingIds.has(c.file.id);

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
               onClick={() => onDiscard(c.file.id)}
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
            {source === 'disk' ? (
               <FolderOpen size={14} />
            ) : (
               <HardDrive size={14} />
            )}
            <span className="local-panel__mode-label">{modeLabel}</span>

            {/* Clear All — hanya muncul di mode local */}
            {source === 'local' && (
               <button
                  className="icon-btn local-panel__clear"
                  onClick={onClearAll}
                  disabled={saving}
                  title="Hapus semua file di Local"
               >
                  <Trash2 size={14} />
               </button>
            )}
         </div>

         {/* ---------- action buttons ---------- */}
         <div className="local-panel__actions-section">
            <div className="local-panel__actions">
               <button
                  className="btn btn--primary"
                  onClick={onSaveAll}
                  disabled={!hasChanges || saving}
                  title={
                     !hasChanges
                        ? 'Tidak ada file yang perlu disimpan'
                        : 'Simpan semua file dan bersihkan dari Changes'
                  }
               >
                  <Save size={14} />
                  {saving ? 'Menyimpan...' : 'Save All'}
               </button>

               <button
                  className="btn"
                  onClick={onDiscardAll}
                  disabled={!hasChanges || saving}
                  title="Buang semua perubahan"
               >
                  <Undo2 size={14} />
                  Discard All
               </button>
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