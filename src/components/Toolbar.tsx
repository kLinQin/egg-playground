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
   HelpCircle,
} from 'lucide-react';
import type { FontChoice, Theme, FileSource } from '../types';

/* ===================== Brand icons ===================== */

function GithubBrandIcon({ size = 13 }: { size?: number }) {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         width={size}
         height={size}
         viewBox="0 0 24 24"
         fill="currentColor"
         aria-hidden="true"
      >
         <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
      </svg>
   );
}

function BackblazeBrandIcon({ size = 13 }: { size?: number }) {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         width={size}
         height={size}
         viewBox="0 0 24 24"
         fill="currentColor"
         aria-hidden="true"
      >
         <path d="M9.3108.0003c.6527 1.3502 1.5666 4.0812-1.3887 7.1738-1.8096 1.8796-3.078 3.8487-2.3496 6.0644.3642 1.1037 1.1864 2.5079 2.8867 2.7852.6107.1008 1.3425-.0006 1.7403-.1406 2.4538-.8544 2.098-3.4138 1.5546-5.0469-.07-.2129-.1915-.7333-.2363-.9238-.3726-1.6023.776-2.6562 1.129-3.8047.028-.0925.0534-.1819.0702-.2715.042-.21.067-.423.0781-.6387 0-1.8264-.9882-2.6303-1.7754-3.5996C10.1794.5643 9.3107.0003 9.3107.0003Zm6.2754 6.0175s-.709.3366-1.2188.8829c-.4454.4818-.8635.8789-1.2949 1.8593-.028.14-.0518.2863-.0742.4375-.2325 1.6416 1.1473 3.1446.7187 5.1895-.112.535-.3554.7123-.7812 1.6367-.5098 1.1065-.383 2.588.3594 3.5293.6723.8488 1.879 1.2321 3.0527.9492 2.1065-.5042 3.0646-2.2822 2.8965-4.2851-.1317-1.58-.8154-2.7536-2.754-4.961-.9607-1.0925-1.6072-2.409-1.5624-3.4062.1373-1.2074.6582-1.832.6582-1.832zM4.8928 15.1936c-.0222.0145-.0439.0614-.0586.1602a.0469.0469 0 0 1-.0059.0195v.01c-.1148.5406-.1649 1.823.1153 2.9.3534 1.4436 1.4175 3.9028 4.4121 5.1295 2.518 1.0343 5.7188.5407 7.8504-1.6275.5287-.5435.4072-.4905-.489-.2016v-.002c-1.1122.3562-3.5185.5462-4.7684-1.0005-1.5226-1.885-.4303-3.3632-1.3574-3.1504-3.6156.8343-5.2673-1.4657-5.5475-2.4255-.0584-.1999-.1442-.5583-.1632-.7938z" />
      </svg>
   );
}

/* ===================== Toolbar ===================== */

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

   /* help */
   helpOpen: boolean;
   onToggleHelp: () => void;
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
   helpOpen,
   onToggleHelp,
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

            <button
               className={`icon-btn ${helpOpen ? 'icon-btn--active' : ''}`}
               onClick={onToggleHelp}
               title={helpOpen ? 'Tutup tutorial' : 'Tutorial & panduan'}
            >
               <HelpCircle size={16} />
            </button>
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
                  <GithubBrandIcon size={13} />
                  <span>GitHub</span>
               </button>

               <button
                  type="button"
                  role="tab"
                  aria-selected={source === 'b2'}
                  className={`source-switch__btn ${source === 'b2' ? 'source-switch__btn--active' : ''}`}
                  onClick={() => handleSelectSource('b2')}
                  title="Backblaze B2 bucket"
               >
                  <BackblazeBrandIcon size={13} />
                  <span className="source-switch__btn-long">Backblaze B2</span>
                  <span className="source-switch__btn-short">B2</span>
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