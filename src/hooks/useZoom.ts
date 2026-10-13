import { useEffect, useState } from 'react';

const STORAGE_KEY = 'webden-ui-zoom';
const MIN = 50;
const MAX = 200;
const STEP = 10;
const DEFAULT = 100;

function read(): number {
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT;
      const n = Number(raw);
      if (Number.isNaN(n)) return DEFAULT;
      return Math.min(MAX, Math.max(MIN, n));
   } catch {
      return DEFAULT;
   }
}

export function useZoom() {
   const [zoom, setZoom] = useState<number>(read);

   /* apply ke root + persist */
   useEffect(() => {
      document.documentElement.style.zoom = String(zoom / 100);
      /* expose ke CSS untuk kalkulasi tinggi */
      document.documentElement.style.setProperty(
         '--ui-zoom',
         String(zoom / 100)
      );
      try {
         localStorage.setItem(STORAGE_KEY, String(zoom));
      } catch {
         /* ignore */
      }
   }, [zoom]);

   const zoomIn = () => setZoom((z) => Math.min(MAX, z + STEP));
   const zoomOut = () => setZoom((z) => Math.max(MIN, z - STEP));
   const reset = () => setZoom(DEFAULT);

   return { zoom, zoomIn, zoomOut, reset, min: MIN, max: MAX, step: STEP };
}