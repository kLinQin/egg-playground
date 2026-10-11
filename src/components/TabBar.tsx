import { useEffect, useRef, useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import type { FileItem, EditorSettings, EditorTheme } from '../types';
import { EDITOR_THEMES } from '../editorThemes';
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
};

export function TabBar({
   files,
   tabs,
   activeTabId,
   onSelect,
   onClose,
   settings,
   onChangeSettings,
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

   return (
      <div className="tab-bar">
         <div className="tab-bar__scroll" ref={scrollRef}>
            {visibleTabs.map((file) => {
               const isActive = file.id === activeTabId;
               const isDirty = file.content !== file.savedContent;
               const { Icon, color } = getFileIcon(file.name);

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
                        {isDirty && <span className="tab-item__dirty">*</span>}
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
                     <span>Editor theme</span>
                     <select
                        className="editor-settings__select"
                        value={settings.editorTheme}
                        onChange={(e) =>
                           onChangeSettings(
                              'editorTheme',
                              e.target.value as EditorTheme
                           )
                        }
                     >
                        {EDITOR_THEMES.map((t) => (
                           <option key={t.id} value={t.id}>
                              {t.label}
                           </option>
                        ))}
                     </select>
                  </label>

                  <div className="dropdown__sep" />

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
               </div>
            )}
         </div>
      </div>
   );
}