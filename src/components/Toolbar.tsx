import { useEffect, useRef, useState } from 'react';
import {
   Type,
   Sun,
   Moon,
   GitBranch,
   Upload,
   Check,
   Folder,
   FolderOpen,
   HardDrive,
   Trash2,
   ChevronDown,
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
   fsSupported: boolean;
   folderName: string | null;
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
   fsSupported,
   folderName,
}: Props) {
   const [fontOpen, setFontOpen] = useState(false);
   const fontRef = useRef<HTMLDivElement>(null);
   const fileRef = useRef<HTMLInputElement>(null);

   const [sourceOpen, setSourceOpen] = useState(false);
   const sourceRef = useRef<HTMLDivElement>(null);

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

   /* klik di luar → tutup dropdown source */
   useEffect(() => {
      if (!sourceOpen) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (sourceRef.current && !sourceRef.current.contains(target)) {
            setSourceOpen(false);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [sourceOpen]);

   /* ---------- label + icon source aktif ---------- */
   const sourceLabel =
      source === 'disk'
         ? folderName ?? 'Folder'
         : source === 'github'
            ? 'GitHub'
            : 'Local';

   const SourceIcon =
      source === 'disk'
         ? FolderOpen
         : source === 'github'
            ? GitBranch
            : HardDrive;

   /* ---------- handler pilih source ---------- */
   const handleSelectSource = (next: FileSource) => {
      setSourceOpen(false);
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

            {/* ---------- source dropdown ---------- */}
            <span className="toolbar__divider" />

            <div className="source-dropdown" ref={sourceRef}>
               <button
                  className="source-dropdown__trigger"
                  onClick={() => setSourceOpen((v) => !v)}
                  title={`Source: ${sourceLabel}`}
               >
                  <SourceIcon size={14} />
                  <span>{sourceLabel}</span>
                  <ChevronDown size={12} />
               </button>

               {sourceOpen && (
                  <div className="dropdown__menu dropdown--menu-left source-dropdown__menu">
                     <button
                        className="dropdown__item"
                        onClick={() => handleSelectSource('local')}
                     >
                        <span className="dropdown__item-left">
                           <HardDrive size={14} />
                           <span>Local</span>
                        </span>
                        {source === 'local' && <Check size={14} />}
                     </button>

                     {fsSupported && (
                        <button
                           className="dropdown__item"
                           onClick={() => handleSelectSource('disk')}
                        >
                           <span className="dropdown__item-left">
                              <FolderOpen size={14} />
                              <span>Folder</span>
                           </span>
                           {source === 'disk' && <Check size={14} />}
                        </button>
                     )}

                     <button
                        className="dropdown__item"
                        onClick={() => handleSelectSource('github')}
                     >
                        <span className="dropdown__item-left">
                           <GitBranch size={14} />
                           <span>GitHub</span>
                        </span>
                        {source === 'github' && <Check size={14} />}
                     </button>
                  </div>
               )}
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