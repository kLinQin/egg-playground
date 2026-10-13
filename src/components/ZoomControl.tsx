import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

type Props = {
   zoom: number;
   onZoomIn: () => void;
   onZoomOut: () => void;
   onReset: () => void;
   min: number;
   max: number;
};

const HOLD_DELAY = 400;
const HOLD_INTERVAL = 60;

export function ZoomControl({
   zoom,
   onZoomIn,
   onZoomOut,
   onReset,
   min,
   max,
}: Props) {
   const zoomRef = useRef(zoom);
   const minRef = useRef(min);
   const maxRef = useRef(max);
   const inRef = useRef(onZoomIn);
   const outRef = useRef(onZoomOut);

   useEffect(() => { zoomRef.current = zoom; }, [zoom]);
   useEffect(() => { minRef.current = min; }, [min]);
   useEffect(() => { maxRef.current = max; }, [max]);
   useEffect(() => { inRef.current = onZoomIn; }, [onZoomIn]);
   useEffect(() => { outRef.current = onZoomOut; }, [onZoomOut]);

   const timeoutRef = useRef<number | null>(null);
   const intervalRef = useRef<number | null>(null);

   const stop = () => {
      if (timeoutRef.current !== null) {
         window.clearTimeout(timeoutRef.current);
         timeoutRef.current = null;
      }
      if (intervalRef.current !== null) {
         window.clearInterval(intervalRef.current);
         intervalRef.current = null;
      }
   };

   const applyStep = (dir: 1 | -1) => {
      const z = zoomRef.current;
      if (dir === 1) {
         if (z >= maxRef.current) return;
         inRef.current();
      } else {
         if (z <= minRef.current) return;
         outRef.current();
      }
   };

   const startHold = (dir: 1 | -1) => {
      applyStep(dir);
      stop();
      timeoutRef.current = window.setTimeout(() => {
         intervalRef.current = window.setInterval(() => {
            applyStep(dir);
         }, HOLD_INTERVAL);
      }, HOLD_DELAY);
   };

   useEffect(() => stop, []);

   return (
      <div className="zoom-control">
         <button
            type="button"
            className="zoom-control__btn"
            disabled={zoom <= min}
            title="Perkecil UI"
            onMouseDown={(e) => {
               if (e.button !== 0) return;
               e.preventDefault();
               startHold(-1);
            }}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={(e) => {
               e.preventDefault();
               startHold(-1);
            }}
            onTouchEnd={stop}
            onTouchCancel={stop}
            onClick={(e) => e.preventDefault()}
         >
            <Minus size={12} />
         </button>

         <button
            type="button"
            className="zoom-control__value"
            onClick={onReset}
            title="Reset ke 100%"
         >
            {zoom}%
         </button>

         <button
            type="button"
            className="zoom-control__btn"
            disabled={zoom >= max}
            title="Perbesar UI"
            onMouseDown={(e) => {
               if (e.button !== 0) return;
               e.preventDefault();
               startHold(1);
            }}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={(e) => {
               e.preventDefault();
               startHold(1);
            }}
            onTouchEnd={stop}
            onTouchCancel={stop}
            onClick={(e) => e.preventDefault()}
         >
            <Plus size={12} />
         </button>
      </div>
   );
}