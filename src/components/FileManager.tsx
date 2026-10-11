import { useState } from 'react';
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react';
import type { FileItem } from '../types';
import { getFileIcon } from '../lib/fileIcons';

type Props = {
   files: FileItem[];
   activeId: string | null;
   onSelect: (id: string) => void;
   onCreate: (name: string) => string | null;
   onRename: (id: string, name: string) => string | null;
   onRequestDelete: (file: FileItem) => void;
};

export function FileManager({
   files,
   activeId,
   onSelect,
   onCreate,
   onRename,
   onRequestDelete,
}: Props) {
   const [adding, setAdding] = useState(false);
   const [draftName, setDraftName] = useState('');
   const [error, setError] = useState<string | null>(null);

   const [editingId, setEditingId] = useState<string | null>(null);
   const [editingName, setEditingName] = useState('');

   /* ---------- create ---------- */
   const commitCreate = () => {
      const name = draftName.trim();
      if (!name) {
         cancelCreate();
         return;
      }
      const err = onCreate(name);
      if (err) {
         setError(err);
         return;
      }
      setDraftName('');
      setAdding(false);
      setError(null);
   };

   const cancelCreate = () => {
      setDraftName('');
      setAdding(false);
      setError(null);
   };

   /* ---------- rename ---------- */
   const startRename = (file: FileItem) => {
      setEditingId(file.id);
      setEditingName(file.name);
      setError(null);
   };

   const commitRename = () => {
      if (!editingId) return;
      const name = editingName.trim();
      if (!name) {
         cancelRename();
         return;
      }
      const err = onRename(editingId, name);
      if (err) {
         setError(err);
         return;
      }
      setEditingId(null);
      setEditingName('');
      setError(null);
   };

   const cancelRename = () => {
      setEditingId(null);
      setEditingName('');
      setError(null);
   };

   return (
      <div className="file-manager">
         <div className="file-manager__header">
            <span>Files</span>
            <button
               className="icon-btn"
               onClick={() => {
                  setAdding(true);
                  setError(null);
               }}
               title="File baru"
               disabled={adding || editingId !== null}
            >
               <Plus size={16} />
            </button>
         </div>

         <div className="file-manager__list">
            {adding && (
               <div className="file-item file-item--editing">
                  {(() => {
                     const { Icon, color } = getFileIcon(draftName || 'untitled');
                     return (
                        <Icon
                           size={14}
                           className="file-item__icon"
                           {...(color ? { style: { color } } : {})}
                        />
                     );
                  })()}
                  <input
                     autoFocus
                     className="file-item__input"
                     value={draftName}
                     placeholder="nama-file.ext"
                     onChange={(e) => setDraftName(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') commitCreate();
                        if (e.key === 'Escape') cancelCreate();
                     }}
                  />
                  <button className="icon-btn" onClick={commitCreate} title="Simpan">
                     <Check size={14} />
                  </button>
                  <button className="icon-btn" onClick={cancelCreate} title="Batal">
                     <X size={14} />
                  </button>
               </div>
            )}

            {files.length === 0 && !adding && (
               <div className="file-manager__empty">
                  Belum ada file. Klik + untuk buat.
               </div>
            )}

            {files.map((file) => {
               const isEditing = editingId === file.id;
               const isDirty = file.content !== file.savedContent;

               const status: 'added' | 'modified' | null = file.isNew
                  ? 'added'
                  : isDirty
                     ? 'modified'
                     : null;

               const { Icon, color } = getFileIcon(file.name);

               if (isEditing) {
                  return (
                     <div key={file.id} className="file-item file-item--editing">
                        <Icon
                           size={14}
                           className="file-item__icon"
                           {...(color ? { style: { color } } : {})}
                        />
                        <input
                           autoFocus
                           className="file-item__input"
                           value={editingName}
                           onChange={(e) => setEditingName(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename();
                              if (e.key === 'Escape') cancelRename();
                           }}
                        />
                        <button
                           className="icon-btn"
                           onClick={commitRename}
                           title="Simpan"
                        >
                           <Check size={14} />
                        </button>
                        <button
                           className="icon-btn"
                           onClick={cancelRename}
                           title="Batal"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  );
               }

               return (
                  <div
                     key={file.id}
                     className={
                        'file-item' + (file.id === activeId ? ' file-item--active' : '')
                     }
                     onClick={() => onSelect(file.id)}
                  >
                     <Icon
                        size={14}
                        className="file-item__icon"
                        {...(color ? { style: { color } } : {})}
                     />
                     <span
                        className={`file-item__name ${status ? `file-item__name--${status}` : ''
                           }`}
                     >
                        {file.name}
                        {isDirty && <span className="file-item__dirty">*</span>}
                     </span>
                     <button
                        className="file-item__action"
                        onClick={(e) => {
                           e.stopPropagation();
                           startRename(file);
                        }}
                        title="Rename"
                     >
                        <Pencil size={14} />
                     </button>
                     <button
                        className="file-item__action file-item__action--danger"
                        onClick={(e) => {
                           e.stopPropagation();
                           onRequestDelete(file);
                        }}
                        title="Hapus"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
               );
            })}
         </div>

         {error && <div className="file-manager__error">{error}</div>}
      </div>
   );
}