import { useState } from 'react';
import { X, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { HELP_SECTIONS } from '../lib/helpContent';

type Props = {
   onClose: () => void;
};

export function HelpView({ onClose }: Props) {
   const [activeId, setActiveId] = useState(HELP_SECTIONS[0].id);

   const activeIndex = Math.max(
      0,
      HELP_SECTIONS.findIndex((s) => s.id === activeId)
   );
   const active = HELP_SECTIONS[activeIndex] ?? HELP_SECTIONS[0];

   const goPrev = () => {
      if (activeIndex > 0) {
         setActiveId(HELP_SECTIONS[activeIndex - 1].id);
      }
   };

   const goNext = () => {
      if (activeIndex < HELP_SECTIONS.length - 1) {
         setActiveId(HELP_SECTIONS[activeIndex + 1].id);
      }
   };

   return (
      <div className="help-view">
         <div className="help-view__header">
            <BookOpen size={14} />
            <span className="help-view__title">Tutorial & Panduan</span>
            <button
               className="icon-btn"
               onClick={onClose}
               title="Tutup tutorial"
            >
               <X size={16} />
            </button>
         </div>

         <div className="help-view__body">
            <nav className="help-view__sidebar">
               {HELP_SECTIONS.map((s) => (
                  <button
                     key={s.id}
                     type="button"
                     className={`help-view__nav-item ${s.id === activeId ? 'is-active' : ''}`}
                     onClick={() => setActiveId(s.id)}
                  >
                     {s.title}
                  </button>
               ))}
            </nav>

            <div className="help-view__content">{active.content}</div>
         </div>

         <div className="help-view__bottombar">
            <span className="help-view__bottombar-title">{active.title}</span>
            <span className="help-view__bottombar-spacer" />
            <span className="help-view__bottombar-count">
               {activeIndex + 1} / {HELP_SECTIONS.length}
            </span>
            <button
               type="button"
               className="icon-btn"
               onClick={goPrev}
               disabled={activeIndex === 0}
               title="Section sebelumnya"
            >
               <ChevronLeft size={14} />
            </button>
            <button
               type="button"
               className="icon-btn"
               onClick={goNext}
               disabled={activeIndex === HELP_SECTIONS.length - 1}
               title="Section berikutnya"
            >
               <ChevronRight size={14} />
            </button>
         </div>
      </div>
   );
}