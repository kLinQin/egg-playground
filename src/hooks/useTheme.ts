import { useEffect, useState } from 'react';
import type { Theme } from '../types';

const STORAGE_KEY = 'webden-theme';

export function useTheme() {
   const [theme, setTheme] = useState<Theme>(() => {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
   });

   useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEY, theme);
   }, [theme]);

   return { theme, setTheme };
}