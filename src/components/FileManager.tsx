import { useEffect, useMemo, useRef, useState } from 'react';
import {
   Plus,
   Trash2,
   Check,
   X,
   Pencil,
   Folder,
   FolderInput,
   FolderPlus,
   ChevronRight,
   ChevronDown,
   MoreHorizontal,
} from 'lucide-react';
import type { FileItem, FileTreeNode } from '../types';
import { getFileIcon } from '../lib/fileIcons';

type Props = {
   files: FileItem[];
   activeId: string | null;
   changesCount: number;
   stagedCount: number;
   onSelect: (id: string) => void;
   onToggleFolder: (id: string) => void;
   onCreate: (name: string, parentId: string | null) => string | null;
   onCreateFolder: (name: string, parentId: string | null) => string | null;
   onRename: (id: string, name: string) => string | null;
   onRequestDelete: (file: FileItem) => void;
   onMove: (id: string, newParentId: string | null) => void;

   /* Clear All Local (opsional) */
   showClearAll: boolean;
   onRequestClearAll: () => void;
};

/* ---------- indent guide: render `depth` span vertikal ---------- */
function Indent({ depth }: { depth: number }) {
   if (depth === 0) return null;
   return (
      <>
         {Array.from({ length: depth }).map((_, i) => (
            <span key={i} className="file-item__indent" aria-hidden="true" />
         ))}
      </>
   );
}

export function FileManager({
   files,
   activeId,
   changesCount,
   stagedCount,
   onSelect,
   onToggleFolder,
   onCreate,
   onCreateFolder,
   onRename,
   onRequestDelete,
   onMove,
   showClearAll,
   onRequestClearAll,
}: Props) {
   /* ---------- state ---------- */
   const [addingAt, setAddingAt] = useState<{
      parentId: string | null;
      isFolder: boolean;
   } | null>(null);
   const [draftName, setDraftName] = useState('');
   const [error, setError] = useState<string | null>(null);

   const [editingId, setEditingId] = useState<string | null>(null);
   const [editingName, setEditingName] = useState('');

   /* ---------- inline confirm clear all ---------- */
   const [confirmClearAll, setConfirmClearAll] = useState(false);

   /* ---------- hover state (untuk tampilkan tombol ⋯) ---------- */
   const [hoveredId, setHoveredId] = useState<string | null>(null);

   /* ---------- drag state ---------- */
   const [draggingId, setDraggingId] = useState<string | null>(null);
   const [dragOverFolderId, setDragOverFolderId] = useState<
      string | null | 'root'
   >(null);

   /* ---------- action menu state (⋯) ---------- */
   const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
   const actionMenuRef = useRef<HTMLDivElement>(null);

   /* ---------- move dropdown state ---------- */
   const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
   const moveMenuRef = useRef<HTMLDivElement>(null);

   /* klik di luar → tutup action menu */
   useEffect(() => {
      if (!actionMenuFor) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (actionMenuRef.current && !actionMenuRef.current.contains(target)) {
            setActionMenuFor(null);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [actionMenuFor]);

   /* klik di luar → tutup dropdown Move */
   useEffect(() => {
      if (!moveMenuFor) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (moveMenuRef.current && !moveMenuRef.current.contains(target)) {
            setMoveMenuFor(null);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [moveMenuFor]);

   /* Escape → cancel inline confirm clear all */
   useEffect(() => {
      if (!confirmClearAll) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setConfirmClearAll(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [confirmClearAll]);

   /* ---------- build tree dari flat files ---------- */
   const tree: FileTreeNode[] = useMemo(() => {
      const byParent = new Map<string | null, FileItem[]>();

      for (const f of files) {
         const arr = byParent.get(f.parentId) ?? [];
         arr.push(f);
         byParent.set(f.parentId, arr);
      }

      for (const arr of byParent.values()) {
         arr.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
         });
      }

      const build = (parentId: string | null, depth: number): FileTreeNode[] => {
         const children = byParent.get(parentId) ?? [];
         return children.map((file) => ({
            file,
            depth,
            children:
               file.kind === 'folder' && file.expanded
                  ? build(file.id, depth + 1)
                  : [],
         }));
      };

      return build(null, 0);
   }, [files]);

   /* ---------- count file (bukan folder) ---------- */
   const { fileCount, folderCount } = useMemo(() => {
      let f = 0;
      let d = 0;
      for (const x of files) {
         if (x.kind === 'folder') d += 1;
         else f += 1;
      }
      return { fileCount: f, folderCount: d };
   }, [files]);

   /* ---------- daftar folder untuk dropdown Move ---------- */
   const folderOptions = useMemo(() => {
      return [
         { id: null as string | null, label: '/ (root)', depth: 0 },
         ...files
            .filter((f) => f.kind === 'folder')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((f) => ({
               id: f.id,
               label: f.name,
               depth: 1,
            })),
      ];
   }, [files]);

   /* ---------- cek: apakah descendant ---------- */
   const isDescendant = (candidateId: string, ancestorId: string): boolean => {
      let current = files.find((f) => f.id === candidateId);
      const visited = new Set<string>();
      while (current && current.parentId) {
         if (visited.has(current.parentId)) return false;
         visited.add(current.parentId);
         if (current.parentId === ancestorId) return true;
         current = files.find((f) => f.id === current!.parentId);
      }
      return false;
   };

   /* ---------- create ---------- */
   const startCreate = (parentId: string | null, isFolder: boolean) => {
      setAddingAt({ parentId, isFolder });
      setDraftName('');
      setError(null);

      if (parentId) {
         const parent = files.find((f) => f.id === parentId);
         if (parent && !parent.expanded) onToggleFolder(parentId);
      }
   };

   const commitCreate = () => {
      if (!addingAt) return;
      const name = draftName.trim();
      if (!name) {
         cancelCreate();
         return;
      }
      const err = addingAt.isFolder
         ? onCreateFolder(name, addingAt.parentId)
         : onCreate(name, addingAt.parentId);
      if (err) {
         setError(err);
         return;
      }
      setDraftName('');
      setAddingAt(null);
      setError(null);
   };

   const cancelCreate = () => {
      setDraftName('');
      setAddingAt(null);
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

   /* ---------- drag & drop handlers ---------- */
   const handleDragStart = (id: string, e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      setDraggingId(id);
   };

   const handleDragEnd = () => {
      setDraggingId(null);
      setDragOverFolderId(null);
   };

   const handleDragOver = (id: string | null, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!draggingId) return;
      if (draggingId === id) return;
      if (id && isDescendant(id, draggingId)) return;
      e.dataTransfer.dropEffect = 'move';
      setDragOverFolderId(id);
   };

   const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
   };

   const handleDrop = (targetFolderId: string | null, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(null);
      if (!draggingId) return;
      if (draggingId === targetFolderId) return;
      if (targetFolderId && isDescendant(targetFolderId, draggingId)) return;
      onMove(draggingId, targetFolderId);
      setDraggingId(null);
   };

   /* ---------- render satu baris ---------- */
   const renderItem = (node: FileTreeNode) => {
      const { file, depth } = node;
      const isFolder = file.kind === 'folder';
      const isEditing = editingId === file.id;
      const isDirty = !isFolder && file.content !== file.savedContent;
      const isDragging = draggingId === file.id;
      const isDragOver = dragOverFolderId === file.id;

      const status: 'added' | 'modified' | null = isFolder
         ? null
         : file.isNew
            ? 'added'
            : isDirty
               ? 'modified'
               : null;

      /* folder → tanpa icon; file → pakai getFileIcon */
      const { Icon, color } = isFolder
         ? { Icon: null, color: null }
         : getFileIcon(file.name);

      /* ---------- tampil tombol ⋯? ---------- */
      const showMore =
         file.id === activeId || file.id === hoveredId;

      /* ---------- chevron (folder) / spacer (file) ---------- */
      const chevron = isFolder ? (
         <button
            type="button"
            className="file-item__chevron"
            onClick={(e) => {
               e.stopPropagation();
               onToggleFolder(file.id);
            }}
            title={file.expanded ? 'Collapse' : 'Expand'}
            aria-label={file.expanded ? 'Collapse' : 'Expand'}
            aria-expanded={file.expanded}
         >
            {file.expanded ? (
               <ChevronDown size={18} />
            ) : (
               <ChevronRight size={18} />
            )}
         </button>
      ) : (
         <span className="file-item__chevron-spacer" aria-hidden="true" />
      );

      /* ---------- editing mode ---------- */
      if (isEditing) {
         return (
            <div
               key={file.id}
               className="file-item file-item--editing"
            >
               <Indent depth={depth} />
               {chevron}
               {Icon && (
                  <Icon
                     size={12}
                     className="file-item__icon"
                     {...(color ? { style: { color } } : {})}
                  />
               )}
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
               <button className="icon-btn" onClick={commitRename} title="Simpan">
                  <Check size={14} />
               </button>
               <button className="icon-btn" onClick={cancelRename} title="Batal">
                  <X size={14} />
               </button>
            </div>
         );
      }

      /* ---------- normal mode ---------- */
      return (
         <div key={file.id}>
            <div
               className={
                  'file-item' +
                  (file.id === activeId ? ' file-item--active' : '') +
                  (isDragging ? ' file-item--dragging' : '') +
                  (isDragOver ? ' file-item--drag-over' : '')
               }
               draggable
               onDragStart={(e) => handleDragStart(file.id, e)}
               onDragEnd={handleDragEnd}
               onDragOver={(e) => isFolder && handleDragOver(file.id, e)}
               onDragLeave={handleDragLeave}
               onDrop={(e) => isFolder && handleDrop(file.id, e)}
               onClick={() => {
                  if (isFolder) onToggleFolder(file.id);
                  else onSelect(file.id);
               }}
               onMouseEnter={() => setHoveredId(file.id)}
               onMouseLeave={() => setHoveredId(null)}
            >
               <Indent depth={depth} />
               {chevron}
               {Icon && (
                  <Icon
                     size={12}
                     className="file-item__icon"
                     {...(color ? { style: { color } } : {})}
                  />
               )}
               <span
                  className={`file-item__name ${status ? `file-item__name--${status}` : ''
                     }`}
               >
                  {file.name}
                  {isDirty && <span className="file-item__dirty">*</span>}
               </span>

               {/* tombol ⋯ (more) — hanya saat active atau hover */}
               {showMore && (
                  <button
                     className="file-item__action file-item__action--more"
                     onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuFor(actionMenuFor === file.id ? null : file.id);
                     }}
                     title="Aksi"
                     aria-label="Aksi"
                  >
                     <MoreHorizontal size={14} />
                  </button>
               )}

               {/* dropdown aksi */}
               {actionMenuFor === file.id && (
                  <div
                     className="action-menu"
                     ref={actionMenuRef}
                     onClick={(e) => e.stopPropagation()}
                  >
                     <button
                        className="action-menu__item"
                        onClick={() => {
                           setActionMenuFor(null);
                           setMoveMenuFor(file.id);
                        }}
                     >
                        <FolderInput size={14} />
                        <span>Move</span>
                     </button>
                     <button
                        className="action-menu__item"
                        onClick={() => {
                           setActionMenuFor(null);
                           startRename(file);
                        }}
                     >
                        <Pencil size={14} />
                        <span>Rename</span>
                     </button>
                     <button
                        className="action-menu__item action-menu__item--danger"
                        onClick={() => {
                           setActionMenuFor(null);
                           onRequestDelete(file);
                        }}
                     >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                     </button>
                  </div>
               )}

               {/* dropdown Move (dari action menu) */}
               {moveMenuFor === file.id && (
                  <div
                     className="move-menu"
                     ref={moveMenuRef}
                     onClick={(e) => e.stopPropagation()}
                  >
                     <div className="move-menu__title">Pindah ke:</div>
                     {folderOptions
                        .filter(
                           (opt) =>
                              opt.id !== file.id &&
                              (!opt.id || !isDescendant(opt.id, file.id))
                        )
                        .map((opt) => (
                           <button
                              key={opt.id ?? '__root__'}
                              className="move-menu__item"
                              onClick={() => {
                                 onMove(file.id, opt.id);
                                 setMoveMenuFor(null);
                              }}
                           >
                              {opt.id === null ? (
                                 <FolderInput size={12} />
                              ) : (
                                 <Folder size={12} style={{ color: '#dcb67a' }} />
                              )}
                              <span>{opt.label}</span>
                           </button>
                        ))}
                  </div>
               )}
            </div>

            {/* ---------- children (rekursif) ---------- */}
            {isFolder && file.expanded && (
               <>
                  {addingAt?.parentId === file.id && (
                     <div className="file-item file-item--editing">
                        <Indent depth={depth + 1} />
                        <span
                           className="file-item__chevron-spacer"
                           aria-hidden="true"
                        />
                        {(() => {
                           const name = draftName || 'untitled';
                           const inner = addingAt.isFolder
                              ? { Icon: null, color: null }
                              : getFileIcon(name);
                           return inner.Icon ? (
                              <inner.Icon
                                 size={14}
                                 className="file-item__icon"
                                 {...(inner.color ? { style: { color: inner.color } } : {})}
                              />
                           ) : null;
                        })()}
                        <input
                           autoFocus
                           className="file-item__input"
                           value={draftName}
                           placeholder={addingAt.isFolder ? 'nama-folder' : 'nama-file.ext'}
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

                  {node.children.map((c) => renderItem(c))}
               </>
            )}
         </div>
      );
   };

   return (
      <div className="file-manager">
         <div className="file-manager__header">
            {confirmClearAll ? (
               <>
                  <span className="file-manager__confirm-text">
                     Hapus semua file?
                  </span>
                  <div className="file-manager__header-actions">
                     <button
                        className="icon-btn file-manager__confirm-ok"
                        onClick={() => {
                           setConfirmClearAll(false);
                           onRequestClearAll();
                        }}
                        title="Ya, hapus semua"
                     >
                        <Check size={16} />
                     </button>
                     <button
                        className="icon-btn"
                        onClick={() => setConfirmClearAll(false)}
                        title="Batal"
                     >
                        <X size={16} />
                     </button>
                  </div>
               </>
            ) : (
               <>
                  <span>Files</span>
                  <div className="file-manager__header-actions">
                     <button
                        className="icon-btn"
                        onClick={() => startCreate(null, true)}
                        title="Folder baru"
                        disabled={!!addingAt || editingId !== null}
                     >
                        <FolderPlus size={16} />
                     </button>
                     <button
                        className="icon-btn"
                        onClick={() => startCreate(null, false)}
                        title="File baru"
                        disabled={!!addingAt || editingId !== null}
                     >
                        <Plus size={16} />
                     </button>
                     {showClearAll && (
                        <button
                           className="icon-btn file-manager__clear"
                           onClick={() => setConfirmClearAll(true)}
                           title="Hapus semua file di Local"
                        >
                           <Trash2 size={16} />
                        </button>
                     )}
                  </div>
               </>
            )}
         </div>

         <div
            className={
               'file-manager__list' +
               (dragOverFolderId === 'root' ? ' file-manager__list--drag-over' : '')
            }
            onDragOver={(e) => handleDragOver(null, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(null, e)}
         >
            {addingAt?.parentId === null && (
               <div className="file-item file-item--editing">
                  <span
                     className="file-item__chevron-spacer"
                     aria-hidden="true"
                  />
                  {(() => {
                     const name = draftName || 'untitled';
                     const inner = addingAt.isFolder
                        ? { Icon: null, color: null }
                        : getFileIcon(name);
                     return inner.Icon ? (
                        <inner.Icon
                           size={14}
                           className="file-item__icon"
                           {...(inner.color ? { style: { color: inner.color } } : {})}
                        />
                     ) : null;
                  })()}
                  <input
                     autoFocus
                     className="file-item__input"
                     value={draftName}
                     placeholder={addingAt.isFolder ? 'nama-folder' : 'nama-file.ext'}
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

            {tree.length === 0 && !addingAt && (
               <div className="file-manager__empty">
                  Belum ada file. Klik + untuk buat.
               </div>
            )}

            {tree.map((node) => renderItem(node))}
         </div>

         {error && <div className="file-manager__error">{error}</div>}

         <div className="status-bar status-bar--panel">
            <span className="status-bar__item">
               {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </span>

            {folderCount > 0 && (
               <>
                  <span className="status-bar__sep" />
                  <span className="status-bar__item">
                     {folderCount} {folderCount === 1 ? 'folder' : 'folders'}
                  </span>
               </>
            )}

            {changesCount > 0 && (
               <>
                  <span className="status-bar__sep" />
                  <span className="status-bar__item">{changesCount} changes</span>
               </>
            )}

            {stagedCount > 0 && (
               <>
                  <span className="status-bar__sep" />
                  <span className="status-bar__item">{stagedCount} staged</span>
               </>
            )}
         </div>
      </div>
   );
}