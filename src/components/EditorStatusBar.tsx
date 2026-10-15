import { useEffect, useRef, useState } from 'react';
import {
   Check,
   Wrench,
   X,
   Undo2,
   Redo2,
   TextSelect,
   Copy,
   Scissors,
   Clipboard,
   Brackets,
   Quote,
   Search,
   Keyboard,
   KeyboardOff,
   CornerDownLeft,
   Space,
   Delete,
   ArrowUp,
   ArrowDown,
   ArrowLeft,
   ArrowRight,
} from 'lucide-react';
import type { LangDef } from '../languages';
import { LANGS } from '../languages';

type SelectMode = 'word' | 'line' | null;

type Props = {
   line: number;
   col: number;
   language: LangDef;
   autoLanguage: LangDef;
   languageOverride: string | null;
   onChangeLanguage: (id: string | null) => void;
   lineCount: number;
   charCount: number;
   errors?: number;
   warnings?: number;

   /* keyboard lock */
   keyboardLocked: boolean;
   onToggleKeyboardLock: () => void;

   /* select mode (word/line hold) */
   selectMode: SelectMode;

   /* mobile action bar */
   onUndo: () => void;
   onRedo: () => void;
   onSelectAll: () => void;
   onSelectWord: () => void;
   onSelectLine: () => void;
   onCopy: () => void;
   onCut: () => void;
   onPaste: () => void;
   onInsertComma: () => void;
   onInsertBrackets: () => void;
   onInsertQuotes: () => void;
   onInsertSpace: () => void;
   onInsertEnter: () => void;
   onBackspace: () => void;
   onArrowLeft: () => void;
   onArrowRight: () => void;
   onArrowUp: () => void;
   onArrowDown: () => void;
   onSearch: () => void;
};

const DRAG_THRESHOLD = 5;

export function EditorStatusBar({
   line,
   col,
   language,
   autoLanguage,
   languageOverride,
   onChangeLanguage,
   lineCount,
   charCount,
   errors = 0,
   warnings = 0,
   keyboardLocked,
   onToggleKeyboardLock,
   selectMode,
   onUndo,
   onRedo,
   onSelectAll,
   onSelectWord,
   onSelectLine,
   onCopy,
   onCut,
   onPaste,
   onInsertComma,
   onInsertBrackets,
   onInsertQuotes,
   onInsertSpace,
   onInsertEnter,
   onBackspace,
   onArrowLeft,
   onArrowRight,
   onArrowUp,
   onArrowDown,
   onSearch,
}: Props) {
   const hasErrors = errors > 0;
   const hasWarnings = warnings > 0;

   const [open, setOpen] = useState(false);
   const rootRef = useRef<HTMLDivElement>(null);

   /* ---------- mode aksi (replace bottom bar) ---------- */
   const [actionsMode, setActionsMode] = useState(false);

   /* ---------- drag-to-scroll di action-scroll ---------- */
   const actionScrollRef = useRef<HTMLDivElement>(null);
   const dragRef = useRef({
      active: false,
      moved: false,
      startX: 0,
      startScrollLeft: 0,
      pointerId: -1,
      pressAction: null as (() => void) | null,
   });

   /* close dropdown bahasa on outside click */
   useEffect(() => {
      if (!open) return;

      const onDocDown = (e: MouseEvent) => {
         if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setOpen(false);
      };

      document.addEventListener('mousedown', onDocDown);
      document.addEventListener('keydown', onKey);
      return () => {
         document.removeEventListener('mousedown', onDocDown);
         document.removeEventListener('keydown', onKey);
      };
   }, [open]);

   /* Escape → keluar dari mode aksi */
   useEffect(() => {
      if (!actionsMode) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setActionsMode(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [actionsMode]);

   const runAction = (fn: () => void) => {
      fn();
   };

   /* ---------- pointer handlers untuk drag-to-scroll + klik aksi ---------- */
   const handlePointerDown = (
      e: React.PointerEvent<HTMLDivElement>
   ) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const el = actionScrollRef.current;
      if (!el) return;

      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>('button.status-bar__action-btn');
      const actionName = btn?.dataset.action ?? null;

      let pressAction: (() => void) | null = null;
      switch (actionName) {
         case 'undo': pressAction = () => runAction(onUndo); break;
         case 'redo': pressAction = () => runAction(onRedo); break;
         case 'word': pressAction = () => runAction(onSelectWord); break;
         case 'line': pressAction = () => runAction(onSelectLine); break;
         case 'all': pressAction = () => runAction(onSelectAll); break;
         case 'copy': pressAction = () => runAction(onCopy); break;
         case 'cut': pressAction = () => runAction(onCut); break;
         case 'paste': pressAction = () => runAction(onPaste); break;
         case 'comma': pressAction = () => runAction(onInsertComma); break;
         case 'brackets': pressAction = () => runAction(onInsertBrackets); break;
         case 'quotes': pressAction = () => runAction(onInsertQuotes); break;
         case 'space': pressAction = () => runAction(onInsertSpace); break;
         case 'enter': pressAction = () => runAction(onInsertEnter); break;
         case 'backspace': pressAction = () => runAction(onBackspace); break;
         case 'arrow-left': pressAction = () => runAction(onArrowLeft); break;
         case 'arrow-right': pressAction = () => runAction(onArrowRight); break;
         case 'arrow-up': pressAction = () => runAction(onArrowUp); break;
         case 'arrow-down': pressAction = () => runAction(onArrowDown); break;
         default: pressAction = null;
      }

      dragRef.current = {
         active: true,
         moved: false,
         startX: e.clientX,
         startScrollLeft: el.scrollLeft,
         pointerId: e.pointerId,
         pressAction,
      };
      el.setPointerCapture(e.pointerId);
   };

   const handlePointerMove = (
      e: React.PointerEvent<HTMLDivElement>
   ) => {
      const d = dragRef.current;
      if (!d.active) return;
      const el = actionScrollRef.current;
      if (!el) return;
      const dx = e.clientX - d.startX;
      if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
         d.moved = true;
      }
      if (d.moved) {
         el.scrollLeft = d.startScrollLeft - dx;
      }
   };

   const handlePointerUp = () => {
      const d = dragRef.current;
      if (!d.active) return;
      const el = actionScrollRef.current;
      if (el && el.hasPointerCapture(d.pointerId)) {
         el.releasePointerCapture(d.pointerId);
      }

      // kalau tidak drag → anggap klik aksi
      if (!d.moved && d.pressAction) {
         d.pressAction();
      }

      d.active = false;
      d.pressAction = null;
   };

   const CurrentIcon = language.Icon;

   /* ===================== MODE AKSI ===================== */
   if (actionsMode) {
      return (
         <div className="status-bar">
            {/* ---------- X — di posisi yang sama dengan Wrench ---------- */}
            <div className="status-bar__actions">
               <button
                  type="button"
                  className="status-bar__actions-btn is-active"
                  onClick={() => setActionsMode(false)}
                  title="Tutup aksi editor"
                  aria-label="Tutup aksi editor"
               >
                  <X size={12} />
               </button>
            </div>

            <div
               className="status-bar__action-scroll"
               ref={actionScrollRef}
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerCancel={handlePointerUp}
            >
               <button
                  type="button"
                  data-action="undo"
                  className="status-bar__action-btn"
                  title="Undo"
                  aria-label="Undo"
               >
                  <Undo2 size={14} />
                  <span>Undo</span>
               </button>

               <button
                  type="button"
                  data-action="redo"
                  className="status-bar__action-btn"
                  title="Redo"
                  aria-label="Redo"
               >
                  <Redo2 size={14} />
                  <span>Redo</span>
               </button>

               <span className="status-bar__action-sep" />

               <button
                  type="button"
                  data-action="word"
                  className={`status-bar__action-btn ${selectMode === 'word' ? 'is-active' : ''}`}
                  title="Pilih kata di posisi kursor (hold)"
                  aria-label="Select word"
               >
                  <TextSelect size={14} />
                  <span>Word</span>
               </button>

               <button
                  type="button"
                  data-action="line"
                  className={`status-bar__action-btn ${selectMode === 'line' ? 'is-active' : ''}`}
                  title="Pilih baris di posisi kursor (hold)"
                  aria-label="Select line"
               >
                  <TextSelect size={14} />
                  <span>Line</span>
               </button>

               <button
                  type="button"
                  data-action="all"
                  className="status-bar__action-btn"
                  title="Select All"
                  aria-label="Select All"
               >
                  <TextSelect size={14} />
                  <span>All</span>
               </button>

               <button
                  type="button"
                  data-action="copy"
                  className="status-bar__action-btn"
                  title="Copy"
                  aria-label="Copy"
               >
                  <Copy size={14} />
                  <span>Copy</span>
               </button>

               <button
                  type="button"
                  data-action="cut"
                  className="status-bar__action-btn"
                  title="Cut"
                  aria-label="Cut"
               >
                  <Scissors size={14} />
                  <span>Cut</span>
               </button>

               <button
                  type="button"
                  data-action="paste"
                  className="status-bar__action-btn"
                  title="Paste"
                  aria-label="Paste"
               >
                  <Clipboard size={14} />
                  <span>Paste</span>
               </button>

               <span className="status-bar__action-sep" />

               <button
                  type="button"
                  data-action="comma"
                  className="status-bar__action-btn status-bar__action-btn--char"
                  title="Insert ,"
                  aria-label="Insert comma"
               >
                  <span className="status-bar__action-char">,</span>
                  <span>Comma</span>
               </button>

               <button
                  type="button"
                  data-action="brackets"
                  className="status-bar__action-btn"
                  title='Insert [ ]'
                  aria-label='Insert brackets'
               >
                  <Brackets size={14} />
                  <span>Bracket</span>
               </button>

               <button
                  type="button"
                  data-action="quotes"
                  className="status-bar__action-btn"
                  title='Insert " "'
                  aria-label='Insert quotes'
               >
                  <Quote size={14} />
                  <span>Quote</span>
               </button>

               <button
                  type="button"
                  data-action="space"
                  className="status-bar__action-btn"
                  title="Insert space"
                  aria-label="Insert space"
               >
                  <Space size={14} />
                  <span>Space</span>
               </button>

               <button
                  type="button"
                  data-action="enter"
                  className="status-bar__action-btn"
                  title="Insert newline"
                  aria-label="Insert newline"
               >
                  <CornerDownLeft size={14} />
                  <span>Enter</span>
               </button>

               <button
                  type="button"
                  data-action="backspace"
                  className="status-bar__action-btn"
                  title="Hapus 1 karakter"
                  aria-label="Hapus 1 karakter"
               >
                  <Delete size={14} />
                  <span>Del</span>
               </button>

               <span className="status-bar__action-sep" />

               <button
                  type="button"
                  data-action="arrow-left"
                  className="status-bar__action-btn status-bar__action-btn--icon"
                  title="Kursor kiri"
                  aria-label="Kursor kiri"
               >
                  <ArrowLeft size={14} />
               </button>

               <button
                  type="button"
                  data-action="arrow-right"
                  className="status-bar__action-btn status-bar__action-btn--icon"
                  title="Kursor kanan"
                  aria-label="Kursor kanan"
               >
                  <ArrowRight size={14} />
               </button>

               <button
                  type="button"
                  data-action="arrow-up"
                  className="status-bar__action-btn status-bar__action-btn--icon"
                  title="Kursor atas"
                  aria-label="Kursor atas"
               >
                  <ArrowUp size={14} />
               </button>

               <button
                  type="button"
                  data-action="arrow-down"
                  className="status-bar__action-btn status-bar__action-btn--icon"
                  title="Kursor bawah"
                  aria-label="Kursor bawah"
               >
                  <ArrowDown size={14} />
               </button>
            </div>
         </div>
      );
   }

   /* ===================== MODE NORMAL ===================== */
   return (
      <div className="status-bar">
         {/* ---------- Wrench toggle (paling kiri) ---------- */}
         <div className="status-bar__actions">
            <button
               type="button"
               className="status-bar__actions-btn"
               onClick={() => setActionsMode(true)}
               title="Aksi editor"
               aria-label="Aksi editor"
            >
               <Wrench size={12} />
            </button>
         </div>

         {/* ---------- Search ---------- */}
         <div className="status-bar__actions">
            <button
               type="button"
               className="status-bar__actions-btn"
               onClick={onSearch}
               title="Cari (Ctrl+F)"
               aria-label="Cari"
            >
               <Search size={12} />
            </button>
         </div>

         {/* ---------- Keyboard lock toggle ---------- */}
         <div className="status-bar__actions">
            <button
               type="button"
               className={`status-bar__actions-btn ${keyboardLocked ? 'is-active' : ''}`}
               onClick={onToggleKeyboardLock}
               title={
                  keyboardLocked
                     ? 'Keyboard terkunci — klik untuk aktifkan'
                     : 'Kunci keyboard virtual'
               }
               aria-label="Toggle keyboard lock"
               aria-pressed={keyboardLocked}
            >
               {keyboardLocked ? (
                  <KeyboardOff size={12} />
               ) : (
                  <Keyboard size={12} />
               )}
            </button>
         </div>

         {(hasErrors || hasWarnings) && (
            <>
               {hasErrors && (
                  <span className="status-bar__item status-bar__item--error">
                     ✕ {errors}
                  </span>
               )}
               {hasWarnings && (
                  <span className="status-bar__item status-bar__item--warning">
                     ⚠ {warnings}
                  </span>
               )}
            </>
         )}

         <span className="status-bar__spacer" />

         <span className="status-bar__item">{lineCount} lines</span>

         <span className="status-bar__item">{charCount} chars</span>

         <span className="status-bar__item status-bar__item--pos">
            Ln {line}, Col {col}
         </span>

         {/* ---------- Language (paling kanan) ---------- */}
         <div className="status-bar__lang" ref={rootRef}>
            <button
               type="button"
               className="status-bar__lang-btn"
               onClick={() => setOpen((v) => !v)}
               title={`Bahasa: ${language.label}${languageOverride ? ' (manual)' : ' (auto)'}`}
               aria-haspopup="listbox"
               aria-expanded={open}
            >
               <CurrentIcon
                  size={12}
                  className="status-bar__lang-icon"
                  style={language.color ? { color: language.color } : undefined}
               />
               <span className="status-bar__lang-label">{language.short}</span>
               {languageOverride && (
                  <span className="status-bar__lang-dot" aria-hidden="true" />
               )}
            </button>

            {open && (
               <div className="status-bar__lang-menu" role="listbox">
                  <button
                     type="button"
                     className={`status-bar__lang-item ${languageOverride === null ? 'is-active' : ''}`}
                     onClick={() => {
                        onChangeLanguage(null);
                        setOpen(false);
                     }}
                     role="option"
                     aria-selected={languageOverride === null}
                  >
                     <autoLanguage.Icon
                        size={12}
                        style={autoLanguage.color ? { color: autoLanguage.color } : undefined}
                     />
                     <span className="status-bar__lang-item-label">
                        Auto ({autoLanguage.short})
                     </span>
                     {languageOverride === null && (
                        <Check size={12} className="status-bar__lang-check" />
                     )}
                  </button>

                  <div className="status-bar__lang-divider" />

                  {LANGS.map((def) => {
                     const active = languageOverride === def.id;
                     const DefIcon = def.Icon;
                     return (
                        <button
                           key={def.id}
                           type="button"
                           className={`status-bar__lang-item ${active ? 'is-active' : ''}`}
                           onClick={() => {
                              onChangeLanguage(def.id);
                              setOpen(false);
                           }}
                           role="option"
                           aria-selected={active}
                        >
                           <DefIcon
                              size={12}
                              style={def.color ? { color: def.color } : undefined}
                           />
                           <span className="status-bar__lang-item-label">{def.label}</span>
                           {active && (
                              <Check size={12} className="status-bar__lang-check" />
                           )}
                        </button>
                     );
                  })}
               </div>
            )}
         </div>
      </div>
   );
}