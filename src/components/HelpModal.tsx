import { useEffect, useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { HELP_SECTIONS } from '../lib/helpContent';

type Props = {
   open: boolean;
   onClose: () => void;
};

export function HelpModal({ open, onClose }: Props) {
   const [activeId, setActiveId] = useState<string>(
      HELP_SECTIONS[0]?.id ?? ''
   );

   /* Escape → tutup */
   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [open, onClose]);

   /* Reset active section saat dibuka */
   useEffect(() => {
      if (open) setActiveId(HELP_SECTIONS[0]?.id ?? '');
   }, [open]);

   if (!open) return null;

   const activeSection =
      HELP_SECTIONS.find((s) => s.id === activeId) ?? HELP_SECTIONS[0];

   return (
      <div className="dialog-backdrop help-backdrop" onClick={onClose}>
         <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            {/* ---------- Header ---------- */}
            <div className="help-modal__header">
               <BookOpen size={16} />
               <span className="help-modal__title">Tutorial & Panduan</span>
               <button
                  className="icon-btn"
                  onClick={onClose}
                  title="Tutup"
                  aria-label="Tutup"
               >
                  <X size={16} />
               </button>
            </div>

            {/* ---------- Body ---------- */}
            <div className="help-modal__body">
               {/* Sidebar */}
               <nav className="help-modal__sidebar">
                  {HELP_SECTIONS.map((s) => (
                     <button
                        key={s.id}
                        className={`help-modal__nav-item ${s.id === activeId ? 'is-active' : ''}`}
                        onClick={() => setActiveId(s.id)}
                     >
                        {s.title}
                     </button>
                  ))}
               </nav>

               {/* Content */}
               <div className="help-modal__content">
                  {activeSection?.content}
               </div>
            </div>
         </div>
      </div>
   );
}