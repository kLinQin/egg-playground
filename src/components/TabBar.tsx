import { useEffect, useRef } from 'react';
import { X, FileText } from 'lucide-react';
import type { FileItem } from '../types';

type Props = {
   files: FileItem[];
   tabs: string[];
   activeTabId: string | null;
   onSelect: (id: string) => void;
   onClose: (id: string) => void;
};

export function TabBar({
   files,
   tabs,
   activeTabId,
   onSelect,
   onClose,
}: Props) {
   const scrollRef = useRef<HTMLDivElement>(null);

   /* auto-scroll ke tab aktif */
   useEffect(() => {
      if (!activeTabId || !scrollRef.current) return;
      const el = scrollRef.current.querySelector<HTMLElement>(
         `[data-tab-id="${activeTabId}"]`
      );
      if (el) {
         el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
   }, [activeTabId]);

   const visibleTabs = tabs
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is FileItem => !!f);

   if (visibleTabs.length === 0) return null;

   return (
      <div className="tab-bar" ref={scrollRef}>
         {visibleTabs.map((file) => {
            const isActive = file.id === activeTabId;
            return (
               <div
                  key={file.id}
                  data-tab-id={file.id}
                  className={`tab-item ${isActive ? 'tab-item--active' : ''}`}
                  onClick={() => onSelect(file.id)}
                  title={file.name}
               >
                  <FileText size={12} className="tab-item__icon" />
                  <span className="tab-item__name">
                     {file.name}
                     {!file.saved && <span className="tab-item__dirty">*</span>}
                  </span>
                  <button
                     type="button"
                     className="tab-item__close"
                     onClick={(e) => {
                        e.stopPropagation();
                        onClose(file.id);
                     }}
                     title="Tutup tab"
                  >
                     <X size={12} />
                  </button>
               </div>
            );
         })}
      </div>
   );
}