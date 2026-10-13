import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

type Props = {
   value: number;
   onChange: (value: number) => void;
   min: number;
   max: number;
   step?: number;
   format?: (value: number) => string;
   titleDecrease?: string;
   titleIncrease?: string;
};

const HOLD_DELAY = 400;   /* ms sebelum auto-repeat mulai */
const HOLD_INTERVAL = 60; /* ms antar repeat */

export function StepperControl({
   value,
   onChange,
   min,
   max,
   step = 1,
   format,
   titleDecrease,
   titleIncrease,
}: Props) {
   const display = format ? format(value) : String(value);

   /* ref untuk mengakses nilai terbaru dari dalam timer */
   const valueRef = useRef(value);
   const minRef = useRef(min);
   const maxRef = useRef(max);
   const stepRef = useRef(step);
   const onChangeRef = useRef(onChange);

   useEffect(() => { valueRef.current = value; }, [value]);
   useEffect(() => { minRef.current = min; }, [min]);
   useEffect(() => { maxRef.current = max; }, [max]);
   useEffect(() => { stepRef.current = step; }, [step]);
   useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

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
      const cur = valueRef.current;
      const lo = minRef.current;
      const hi = maxRef.current;
      const st = stepRef.current;
      const raw = cur + dir * st;
      /* hindari floating point error */
      const next = dir === 1
         ? Math.min(hi, Math.round(raw * 1000) / 1000)
         : Math.max(lo, Math.round(raw * 1000) / 1000);
      if (next !== cur) onChangeRef.current(next);
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

   /* cleanup saat unmount */
   useEffect(() => stop, []);


   return (
      <div className="stepper-control">
         <button
            type="button"
            className="stepper-control__btn"
            disabled={value <= min}
            title={titleDecrease ?? 'Kurangi'}
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

         <span className="stepper-control__value">{display}</span>

         <button
            type="button"
            className="stepper-control__btn"
            disabled={value >= max}
            title={titleIncrease ?? 'Tambah'}
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