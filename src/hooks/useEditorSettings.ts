import { useEffect, useState } from 'react';
import type { EditorSettings } from '../types';

const STORAGE_KEY = 'webden-editor-settings';

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
   fontSize: 14,
   lineHeight: 1.5,
   lineNumbers: true,
   lineWrap: false,
   autocomplete: true,
   tabSize: 2,
   indentWithTabs: false,
   indentGuides: true,
   linting: true,
   highlightActiveLine: true,
   closeBrackets: true,
   bottomBarHeight: 24,
   tabMaxWidth: 200,
   headerHeight: 34,
};

function read(): EditorSettings {
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_EDITOR_SETTINGS;
      return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(raw) };
   } catch {
      return DEFAULT_EDITOR_SETTINGS;
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

   const resetAll = () => {
      setSettings(DEFAULT_EDITOR_SETTINGS);
   };

   return { settings, update, resetAll };
}