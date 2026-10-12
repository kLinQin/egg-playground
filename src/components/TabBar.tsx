import { useEffect, useRef, useState } from 'react';
import { X, SlidersHorizontal, Eye, Code2, Save } from 'lucide-react';
import type { FileItem, EditorSettings } from '../types';
import { getFileIcon } from '../lib/fileIcons';

type Props = {
   files: FileItem[];
   tabs: string[];
   activeTabId: string | null;
   onSelect: (id: string) => void;
   onClose: (id: string) => void;
   settings: EditorSettings;
   onChangeSettings: <K extends keyof EditorSettings>(
      key: K,
      value: EditorSettings[K]
   ) => void;
   previewOpen: boolean;
   onTogglePreview: () => void;
   onSave: () => void;
};

export function TabBar({
   files,
   tabs,
   activeTabId,
   onSelect,
   onClose,
   settings,
   onChangeSettings,
   previewOpen,
   onTogglePreview,
   onSave,
}: Props) {
   const scrollRef = useRef<HTMLDivElement>(null);
   const settingsRef = useRef<HTMLDivElement>(null);
   const [settingsOpen, setSettingsOpen] = useState(false);

   /* auto-scroll ke tab aktif */
   useEffect(() => {
      if (!activeTabId || !scrollRef.current) return;
      const el = scrollRef.current.querySelector<HTMLElement>(
         `[data-tab-id="${activeTabId}"]`
      );
      if (el) {
         el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
         });
      }
   }, [activeTabId]);

   /* klik di luar → tutup dropdown settings */
   useEffect(() => {
      if (!settingsOpen) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (settingsRef.current && !settingsRef.current.contains(target)) {
            setSettingsOpen(false);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [settingsOpen]);

   const visibleTabs = tabs
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is FileItem => !!f);

   const activeFile = files.find((f) => f.id === activeTabId) ?? null;
   const isMarkdown = activeFile
      ? /\.(md|markdown)$/i.test(activeFile.name)
      : false;
   const isDirty = activeFile
      ? activeFile.kind === 'file' &&
      (activeFile.isNew || activeFile.content !== activeFile.savedContent)
      : false;

   return (
      <div className="tab-bar">
         <div className="tab-bar__scroll" ref={scrollRef}>
            {visibleTabs.map((file) => {
               const isActive = file.id === activeTabId;
               const isFileDirty = file.content !== file.savedContent;
               const isNew = file.isNew;
               const { Icon, color } = getFileIcon(file.name);

               const indicator = isNew
                  ? 'added'
                  : isFileDirty
                     ? 'modified'
                     : null;

               return (
                  <div
                     key={file.id}
                     data-tab-id={file.id}
                     className={`tab-item ${isActive ? 'tab-item--active' : ''}`}
                     onClick={() => onSelect(file.id)}
                     title={file.name}
                  >
                     <Icon
                        size={12}
                        className="tab-item__icon"
                        {...(color ? { style: { color } } : {})}
                     />
                     <span className="tab-item__name">
                        {file.name}
                        {indicator === 'modified' && (
                           <span className="tab-item__dot tab-item__dot--modified">
                              *
                           </span>
                        )}
                        {indicator === 'added' && (
                           <span className="tab-item__dot tab-item__dot--added">
                              *
                           </span>
                        )}
                     </span>
                     <button
                        type="button"
                        className="tab-item__close"
                        onClick={(e) => {
                           e.stopPropagation();
                           onClose(file.id);
                        }}
                        title="Tutup tab"
                     >
                        <X size={12} />
                     </button>
                  </div>
               );
            })}
         </div>

         {/* ---------- Save button (muncul kalau ada perubahan) ---------- */}
         {isDirty && (
            <div className="tab-bar__action">
               <button
                  className="icon-btn"
                  onClick={onSave}
                  title="Simpan (Ctrl+S)"
               >
                  <Save size={14} />
               </button>
            </div>
         )}

         {/* ---------- Preview button (markdown only) ---------- */}
         {isMarkdown && (
            <div className="tab-bar__action">
               <button
                  className={`icon-btn ${previewOpen ? 'icon-btn--active' : ''}`}
                  onClick={onTogglePreview}
                  title={previewOpen ? 'Tampilkan editor' : 'Tampilkan preview'}
               >
                  {previewOpen ? <Code2 size={14} /> : <Eye size={14} />}
               </button>
            </div>
         )}

         {/* ---------- Settings button ---------- */}
         <div className="tab-bar__settings" ref={settingsRef}>
            <button
               className="icon-btn"
               onClick={() => setSettingsOpen((v) => !v)}
               title="Editor settings"
            >
               <SlidersHorizontal size={14} />
            </button>

            {settingsOpen && (
               <div className="dropdown__menu dropdown--menu-left editor-settings">
                  <label className="editor-settings__row">
                     <span>Font size</span>
                     <input
                        type="number"
                        min={10}
                        max={32}
                        value={settings.fontSize}
                        onChange={(e) =>
                           onChangeSettings(
                              'fontSize',
                              Number(e.target.value) || 14
                           )
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Line height</span>
                     <input
                        type="number"
                        min={1}
                        max={3}
                        step={0.1}
                        value={settings.lineHeight}
                        onChange={(e) =>
                           onChangeSettings(
                              'lineHeight',
                              Number(e.target.value) || 1.5
                           )
                        }
                     />
                  </label>

                  <div className="dropdown__sep" />

                  <label className="editor-settings__row">
                     <span>Line numbers</span>
                     <input
                        type="checkbox"
                        checked={settings.lineNumbers}
                        onChange={(e) =>
                           onChangeSettings('lineNumbers', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Line wrap</span>
                     <input
                        type="checkbox"
                        checked={settings.lineWrap}
                        onChange={(e) =>
                           onChangeSettings('lineWrap', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Autocomplete</span>
                     <input
                        type="checkbox"
                        checked={settings.autocomplete}
                        onChange={(e) =>
                           onChangeSettings('autocomplete', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Indent guides</span>
                     <input
                        type="checkbox"
                        checked={settings.indentGuides}
                        onChange={(e) =>
                           onChangeSettings('indentGuides', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Linting</span>
                     <input
                        type="checkbox"
                        checked={settings.linting}
                        onChange={(e) =>
                           onChangeSettings('linting', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Highlight active line</span>
                     <input
                        type="checkbox"
                        checked={settings.highlightActiveLine}
                        onChange={(e) =>
                           onChangeSettings(
                              'highlightActiveLine',
                              e.target.checked
                           )
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Close brackets</span>
                     <input
                        type="checkbox"
                        checked={settings.closeBrackets}
                        onChange={(e) =>
                           onChangeSettings('closeBrackets', e.target.checked)
                        }
                     />
                  </label>
               </div>
            )}
         </div>
      </div>
   );
}