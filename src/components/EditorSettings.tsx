import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import type { EditorSettings as SettingsType } from '../types';
import { EDITOR_THEMES } from '../editorThemes';

type Props = {
   settings: SettingsType;
   onChange: <K extends keyof SettingsType>(
      key: K,
      value: SettingsType[K]
   ) => void;
};

export function EditorSettingsMenu({ settings, onChange }: Props) {
   const [open, setOpen] = useState(false);
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!open) return;
      const onClick = (e: MouseEvent) => {
         if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [open]);

   return (
      <div className="dropdown" ref={ref}>
         <button
            className="icon-btn"
            onClick={() => setOpen((v) => !v)}
            title="Editor settings"
         >
            <Settings size={16} />
         </button>

         {open && (
            <div className="dropdown__menu editor-settings">
               <label className="editor-settings__row">
                  <span>Editor theme</span>
                  <select
                     className="editor-settings__select"
                     value={settings.editorTheme}
                     onChange={(e) =>
                        onChange(
                           'editorTheme',
                           e.target.value as SettingsType['editorTheme']
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
                        onChange('fontSize', Number(e.target.value) || 14)
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
                        onChange('lineHeight', Number(e.target.value) || 1.5)
                     }
                  />
               </label>

               <div className="dropdown__sep" />

               <label className="editor-settings__row">
                  <span>Line numbers</span>
                  <input
                     type="checkbox"
                     checked={settings.lineNumbers}
                     onChange={(e) => onChange('lineNumbers', e.target.checked)}
                  />
               </label>

               <label className="editor-settings__row">
                  <span>Line wrap</span>
                  <input
                     type="checkbox"
                     checked={settings.lineWrap}
                     onChange={(e) => onChange('lineWrap', e.target.checked)}
                  />
               </label>

               <label className="editor-settings__row">
                  <span>Autocomplete</span>
                  <input
                     type="checkbox"
                     checked={settings.autocomplete}
                     onChange={(e) => onChange('autocomplete', e.target.checked)}
                  />
               </label>
            </div>
         )}
      </div>
   );
}