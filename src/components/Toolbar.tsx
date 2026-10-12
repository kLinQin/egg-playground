import { useEffect, useRef, useState } from 'react';
import {
   Type,
   Sun,
   Moon,
   GitBranch,
   Upload,
   Check,
   Folder,
   HardDrive,
   Trash2,
} from 'lucide-react';
import type { FontChoice, Theme, FileSource } from '../types';

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

   /* file source */
   source: FileSource;
   onChangeSource: (next: FileSource) => void;
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
   source,
   onChangeSource,
}: Props) {
   const [fontOpen, setFontOpen] = useState(false);
   const fontRef = useRef<HTMLDivElement>(null);
   const fileRef = useRef<HTMLInputElement>(null);

   /* klik di luar → tutup dropdown font */
   useEffect(() => {
      if (!fontOpen) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (fontRef.current && !fontRef.current.contains(target)) {
            setFontOpen(false);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [fontOpen]);

   /* ---------- handler pilih source ---------- */
   const handleSelectSource = (next: FileSource) => {
      if (next === source) return;
      onChangeSource(next);
   };

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
         </div>

         {/* ---------- source switch (center) ---------- */}
         <div className="toolbar__center">
            <div className="source-switch" role="tablist" aria-label="Sumber file">
               <button
                  type="button"
                  role="tab"
                  aria-selected={source === 'local'}
                  className={`source-switch__btn ${source === 'local' ? 'source-switch__btn--active' : ''}`}
                  onClick={() => handleSelectSource('local')}
                  title="Local (localStorage)"
               >
                  <HardDrive size={13} />
                  <span>Local</span>
               </button>

               <button
                  type="button"
                  role="tab"
                  aria-selected={source === 'github'}
                  className={`source-switch__btn ${source === 'github' ? 'source-switch__btn--active' : ''}`}
                  onClick={() => handleSelectSource('github')}
                  title="GitHub repository"
               >
                  <GitBranch size={13} />
                  <span>GitHub</span>
               </button>
            </div>
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