import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
   initial: number;
   min?: number;
   max?: number;
   reverse?: boolean;
   /** kalau diisi, lebar disimpan ke localStorage dengan key ini */
   storageKey?: string;
};

function readStored(key: string | undefined, fallback: number): number {
   if (!key) return fallback;
   try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
   } catch {
      return fallback;
   }
}

export function useResizable({
   initial,
   min = 150,
   max = 500,
   reverse = false,
   storageKey,
}: Options) {
   const [width, setWidth] = useState(() => readStored(storageKey, initial));
   const draggingRef = useRef(false);
   const startXRef = useRef(0);
   const startWidthRef = useRef(0);

   /* persist ke localStorage (debounced via timeout kecil) */
   useEffect(() => {
      if (!storageKey) return;
      const t = setTimeout(() => {
         localStorage.setItem(storageKey, String(width));
      }, 200);
      return () => clearTimeout(t);
   }, [width, storageKey]);

   const onMouseDown = useCallback(
      (e: React.MouseEvent) => {
         draggingRef.current = true;
         startXRef.current = e.clientX;
         startWidthRef.current = width;
         document.body.style.cursor = 'col-resize';
         document.body.style.userSelect = 'none';
      },
      [width]
   );

   useEffect(() => {
      const onMove = (e: MouseEvent) => {
         if (!draggingRef.current) return;
         const raw = e.clientX - startXRef.current;
         const delta = reverse ? -raw : raw;
         const next = Math.min(max, Math.max(min, startWidthRef.current + delta));
         setWidth(next);
      };
      const onUp = () => {
         if (!draggingRef.current) return;
         draggingRef.current = false;
         document.body.style.cursor = '';
         document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      return () => {
         document.removeEventListener('mousemove', onMove);
         document.removeEventListener('mouseup', onUp);
      };
   }, [min, max, reverse]);

   return { width, onMouseDown };
}