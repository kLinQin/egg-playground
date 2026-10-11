import { useEffect, useState } from 'react';
import type { EditorSettings } from '../types';

const STORAGE_KEY = 'webden-editor-settings';

const DEFAULTS: EditorSettings = {
   fontSize: 14,
   lineHeight: 1.5,
   lineNumbers: true,
   lineWrap: false,
   autocomplete: true,
   editorTheme: 'auto',
   tabSize: 2,
   indentWithTabs: false,
};

function read(): EditorSettings {
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      return { ...DEFAULTS, ...JSON.parse(raw) };
   } catch {
      return DEFAULTS;
   }
}

export function useEditorSettings() {
   const [settings, setSettings] = useState<EditorSettings>(read);

   useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
   }, [settings]);

   const update = <K extends keyof EditorSettings>(
      key: K,
      value: EditorSettings[K]
   ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
   };

   return { settings, update };
}