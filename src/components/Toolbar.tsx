import { useEffect, useRef, useState } from 'react';
import {
   Type,
   Sun,
   Moon,
   GitBranch,
   Upload,
   Check,
   Folder,
   Trash2,
   Save,
   Pencil,
   Eye,
   Code2,
   Settings,
} from 'lucide-react';
import type {
   FontChoice,
   Theme,
   FileItem,
   EditorSettings,
   EditorTheme,
} from '../types';
import { EDITOR_THEMES } from '../editorThemes';

type Props = {
   theme: Theme;
   onToggleTheme: () => void;
   fonts: FontChoice[];
   activeFontId: string;
   onSelectFont: (id: string) => void;
   onUploadFont: (file: File) => void;
   onRemoveFont: (id: string) => void;
   onToggleGit: () => void;
   gitOpen: boolean;
   onToggleFiles: () => void;
   filesOpen: boolean;

   /* editor controls */
   file: FileItem | null;
   onSaveFile: () => void;
   onEditFile: () => void;
   previewOpen: boolean;
   onTogglePreview: () => void;
   settings: EditorSettings;
   onChangeSettings: <K extends keyof EditorSettings>(
      key: K,
      value: EditorSettings[K]
   ) => void;
};

export function Toolbar({
   theme,
   onToggleTheme,
   fonts,
   activeFontId,
   onSelectFont,
   onUploadFont,
   onRemoveFont,
   onToggleGit,
   gitOpen,
   onToggleFiles,
   filesOpen,
   file,
   onSaveFile,
   onEditFile,
   previewOpen,
   onTogglePreview,
   settings,
   onChangeSettings,
}: Props) {
   const [fontOpen, setFontOpen] = useState(false);
   const [settingsOpen, setSettingsOpen] = useState(false);
   const fontRef = useRef<HTMLDivElement>(null);
   const settingsRef = useRef<HTMLDivElement>(null);
   const fileRef = useRef<HTMLInputElement>(null);

   /* klik di luar → tutup dropdown */
   useEffect(() => {
      if (!fontOpen && !settingsOpen) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (fontRef.current && !fontRef.current.contains(target)) {
            setFontOpen(false);
         }
         if (settingsRef.current && !settingsRef.current.contains(target)) {
            setSettingsOpen(false);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [fontOpen, settingsOpen]);

   const isMarkdown = file ? /\.(md|markdown)$/i.test(file.name) : false;

   return (
      <div className="toolbar">
         <div className="toolbar__left">
            <button
               className={`icon-btn ${filesOpen ? 'icon-btn--active' : ''}`}
               onClick={onToggleFiles}
               title={filesOpen ? 'Sembunyikan file manager' : 'Tampilkan file manager'}
            >
               <Folder size={16} />
            </button>
            <span className="toolbar__brand">Eggs</span>

            {/* ---------- editor controls ---------- */}
            {file && (
               <>
                  <span className="toolbar__divider" />

                  {!file.saved ? (
                     <button
                        className="btn btn--primary"
                        onClick={onSaveFile}
                        title="Save (Ctrl+S)"
                     >
                        <Save size={14} /> Save
                     </button>
                  ) : (
                     <button
                        className="btn"
                        onClick={onEditFile}
                        title="Edit"
                     >
                        <Pencil size={14} /> Edit
                     </button>
                  )}

                  {isMarkdown && (
                     <button
                        className={`btn ${previewOpen ? 'btn--primary' : ''}`}
                        onClick={onTogglePreview}
                        title={previewOpen ? 'Tampilkan editor' : 'Tampilkan preview'}
                     >
                        {previewOpen ? (
                           <>
                              <Code2 size={14} /> Edit
                           </>
                        ) : (
                           <>
                              <Eye size={14} /> Preview
                           </>
                        )}
                     </button>
                  )}

                  <div className="dropdown dropdown--menu-left" ref={settingsRef}>
                     <button
                        className="icon-btn"
                        onClick={() => setSettingsOpen((v) => !v)}
                        title="Editor settings"
                     >
                        <Settings size={16} />
                     </button>

                     {settingsOpen && (
                        <div className="dropdown__menu editor-settings">
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
               </>
            )}
         </div>

         <div className="toolbar__right">
            <div className="dropdown" ref={fontRef}>
               <button
                  className="icon-btn"
                  onClick={() => setFontOpen((v) => !v)}
                  title="Font"
               >
                  <Type size={16} />
               </button>

               {fontOpen && (
                  <div className="dropdown__menu">
                     {fonts.map((f) => {
                        const isCustom = !!f.dataBase64;
                        return (
                           <div key={f.id} className="dropdown__font-row">
                              <button
                                 className="dropdown__item dropdown__item--font"
                                 onClick={() => {
                                    onSelectFont(f.id);
                                    setFontOpen(false);
                                 }}
                              >
                                 <span style={{ fontFamily: f.family }}>{f.label}</span>
                                 {f.id === activeFontId && <Check size={14} />}
                              </button>

                              {isCustom && (
                                 <button
                                    className="icon-btn dropdown__font-delete"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       onRemoveFont(f.id);
                                       setFontOpen(false);
                                    }}
                                    title="Hapus font"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              )}
                           </div>
                        );
                     })}

                     <div className="dropdown__sep" />

                     <button
                        className="dropdown__item"
                        onClick={() => fileRef.current?.click()}
                     >
                        <Upload size={14} />
                        <span>Upload font</span>
                     </button>

                     <input
                        ref={fileRef}
                        type="file"
                        accept=".woff2,.woff,.ttf,.otf"
                        hidden
                        onChange={(e) => {
                           const f = e.target.files?.[0];
                           if (f) onUploadFont(f);
                           e.target.value = '';
                           setFontOpen(false);
                        }}
                     />
                  </div>
               )}
            </div>

            <button
               className="icon-btn"
               onClick={onToggleTheme}
               title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
               {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
               className={`icon-btn ${gitOpen ? 'icon-btn--active' : ''}`}
               onClick={onToggleGit}
               title="Git panel"
            >
               <GitBranch size={16} />
            </button>
         </div>
      </div>
   );
}