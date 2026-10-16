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

function clamp(v: number, lo: number, hi: number): number {
   return Math.min(hi, Math.max(lo, v));
}

export function useResizable({
   initial,
   min = 150,
   max = 500,
   reverse = false,
   storageKey,
}: Options) {
   const [width, setWidth] = useState(() =>
      clamp(readStored(storageKey, initial), min, max)
   );

   const draggingRef = useRef(false);
   const pointerIdRef = useRef<number | null>(null);
   const startXRef = useRef(0);
   const startWidthRef = useRef(0);

   /* simpan nilai terbaru min/max/width di ref supaya listener document
      selalu baca nilai terbaru tanpa harus re-subscribe */
   const minRef = useRef(min);
   const maxRef = useRef(max);
   const reverseRef = useRef(reverse);
   const widthRef = useRef(width);

   useEffect(() => { minRef.current = min; }, [min]);
   useEffect(() => { maxRef.current = max; }, [max]);
   useEffect(() => { reverseRef.current = reverse; }, [reverse]);
   useEffect(() => { widthRef.current = width; }, [width]);

   /* clamp ulang kalau min/max berubah (mis. breakpoint berpindah) */
   useEffect(() => {
      setWidth((w) => {
         const next = clamp(w, min, max);
         return next === w ? w : next;
      });
   }, [min, max]);

   /* persist ke localStorage (debounced) */
   useEffect(() => {
      if (!storageKey) return;
      const t = setTimeout(() => {
         localStorage.setItem(storageKey, String(width));
      }, 200);
      return () => clearTimeout(t);
   }, [width, storageKey]);

   /* ---------- pointer handlers ---------- */
   const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      draggingRef.current = true;
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      startWidthRef.current = widthRef.current;

      // cegah browser scroll/gesture saat drag di touch
      e.currentTarget.setPointerCapture(e.pointerId);

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
   }, []);

   useEffect(() => {
      const onMove = (e: PointerEvent) => {
         if (!draggingRef.current) return;
         if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
            return;
         }
         const raw = e.clientX - startXRef.current;
         const delta = reverseRef.current ? -raw : raw;
         const next = clamp(
            startWidthRef.current + delta,
            minRef.current,
            maxRef.current
         );
         setWidth(next);
      };

      const onUp = (e: PointerEvent) => {
         if (!draggingRef.current) return;
         if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
            return;
         }
         draggingRef.current = false;
         pointerIdRef.current = null;
         document.body.style.cursor = '';
         document.body.style.userSelect = '';
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
      return () => {
         document.removeEventListener('pointermove', onMove);
         document.removeEventListener('pointerup', onUp);
         document.removeEventListener('pointercancel', onUp);
      };
   }, []);

   return { width, onPointerDown };
}