import { useEffect, useRef, useState } from 'react';
import { X, SlidersHorizontal, Eye, Code2, Save, RotateCcw } from 'lucide-react';
import type { FileItem, EditorSettings } from '../types';
import { getFileIcon } from '../lib/fileIcons';
import { StepperControl } from './StepperControl';
import { ZoomControl } from './ZoomControl';

type Props = {
   files: FileItem[];
   tabs: string[];
   activeTabId: string | null;
   onSelect: (id: string) => void;
   onClose: (id: string) => void;
   settings: EditorSettings;
   onChangeSettings: <K extends keyof EditorSettings>(
      key: K,
      value: EditorSettings[K]
   ) => void;
   onResetSettings: () => void;
   previewOpen: boolean;
   onTogglePreview: () => void;
   onSave: () => void;

   /* zoom UI */
   zoom: number;
   onZoomIn: () => void;
   onZoomOut: () => void;
   onZoomReset: () => void;
   zoomMin: number;
   zoomMax: number;

   isMobile: boolean;
};

const DRAG_THRESHOLD = 5;

export function TabBar({
   files,
   tabs,
   activeTabId,
   onSelect,
   onClose,
   settings,
   onChangeSettings,
   onResetSettings,
   previewOpen,
   onTogglePreview,
   onSave,
   zoom,
   onZoomIn,
   onZoomOut,
   onZoomReset,
   zoomMin,
   zoomMax,
   isMobile,
}: Props) {
   const scrollRef = useRef<HTMLDivElement>(null);
   const settingsRef = useRef<HTMLDivElement>(null);
   const [settingsOpen, setSettingsOpen] = useState(false);
   const [confirmReset, setConfirmReset] = useState(false);

   /* drag-to-scroll state */
   const dragRef = useRef({
      active: false,
      moved: false,
      startX: 0,
      startScrollLeft: 0,
      pointerId: -1,
      pressTabId: null as string | null,
      pressOnClose: false,
   });

   /* auto-scroll ke tab aktif */
   useEffect(() => {
      if (!activeTabId || !scrollRef.current) return;
      const el = scrollRef.current.querySelector<HTMLElement>(
         `[data-tab-id="${activeTabId}"]`
      );
      if (el) {
         el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
         });
      }
   }, [activeTabId]);

   /* klik di luar → tutup dropdown settings */
   useEffect(() => {
      if (!settingsOpen) return;
      const onClick = (e: MouseEvent) => {
         const target = e.target as Node;
         if (settingsRef.current && !settingsRef.current.contains(target)) {
            setSettingsOpen(false);
            setConfirmReset(false);
         }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
   }, [settingsOpen]);

   /* Escape → tutup dropdown / cancel reset */
   useEffect(() => {
      if (!settingsOpen) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            if (confirmReset) {
               setConfirmReset(false);
            } else {
               setSettingsOpen(false);
            }
         }
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [settingsOpen, confirmReset]);

   const visibleTabs = tabs
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is FileItem => !!f);

   const activeFile = files.find((f) => f.id === activeTabId) ?? null;
   const isMarkdown = activeFile
      ? /\.(md|markdown)$/i.test(activeFile.name)
      : false;
   const isDirty = activeFile
      ? activeFile.kind === 'file' &&
      (activeFile.isNew || activeFile.content !== activeFile.savedContent)
      : false;

   const handleResetClick = () => {
      if (confirmReset) {
         onResetSettings();
         setConfirmReset(false);
      } else {
         setConfirmReset(true);
      }
   };

   /* ---------- drag-to-scroll (pointer events: mouse + touch + pen) ---------- */
   const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const el = scrollRef.current;
      if (!el) return;

      const target = e.target as HTMLElement;
      const tabEl = target.closest<HTMLElement>('.tab-item');
      const pressTabId = tabEl?.dataset.tabId ?? null;
      const pressOnClose = !!target.closest('.tab-item__close');

      dragRef.current = {
         active: true,
         moved: false,
         startX: e.clientX,
         startScrollLeft: el.scrollLeft,
         pointerId: e.pointerId,
         pressTabId,
         pressOnClose,
      };
      el.setPointerCapture(e.pointerId);
   };

   const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d.active) return;
      const el = scrollRef.current;
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
      const el = scrollRef.current;
      if (el && el.hasPointerCapture(d.pointerId)) {
         el.releasePointerCapture(d.pointerId);
      }

      // Kalau tidak drag → anggap klik
      if (!d.moved && d.pressTabId) {
         if (d.pressOnClose) {
            onClose(d.pressTabId);
         } else {
            onSelect(d.pressTabId);
         }
      }

      d.active = false;
      d.pressTabId = null;
      d.pressOnClose = false;
   };

   return (
      <div className="tab-bar">
         <div
            className="tab-bar__scroll"
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
         >
            {visibleTabs.map((file) => {
               const isActive = file.id === activeTabId;
               const isFileDirty = file.content !== file.savedContent;
               const isNew = file.isNew;
               const { Icon, color } = getFileIcon(file.name);

               const indicator = isNew
                  ? 'added'
                  : isFileDirty
                     ? 'modified'
                     : null;

               return (
                  <div
                     key={file.id}
                     data-tab-id={file.id}
                     className={`tab-item ${isActive ? 'tab-item--active' : ''}`}
                     title={file.name}
                  >
                     <Icon
                        size={12}
                        className="tab-item__icon"
                        {...(color ? { style: { color } } : {})}
                     />
                     <span className="tab-item__name">
                        {file.name}
                        {indicator === 'modified' && (
                           <span className="tab-item__dot tab-item__dot--modified">
                              *
                           </span>
                        )}
                        {indicator === 'added' && (
                           <span className="tab-item__dot tab-item__dot--added">
                              *
                           </span>
                        )}
                     </span>
                     <button
                        type="button"
                        className="tab-item__close"
                        title="Tutup tab"
                     >
                        <X size={12} />
                     </button>
                  </div>
               );
            })}
         </div>

         {/* ---------- Save button (muncul kalau ada perubahan) ---------- */}
         {isDirty && (
            <div className="tab-bar__action">
               <button
                  className="icon-btn tab-bar__save-btn"
                  onClick={onSave}
                  title="Belum disimpan — klik untuk simpan (Ctrl+S)"
               >
                  <Save size={14} />
               </button>
            </div>
         )}

         {/* ---------- Preview button (markdown only) ---------- */}
         {isMarkdown && (
            <div className="tab-bar__action">
               <button
                  className={`icon-btn ${previewOpen ? 'icon-btn--active' : ''}`}
                  onClick={onTogglePreview}
                  title={previewOpen ? 'Tampilkan editor' : 'Tampilkan preview'}
               >
                  {previewOpen ? <Code2 size={14} /> : <Eye size={14} />}
               </button>
            </div>
         )}

         {/* ---------- Settings button ---------- */}
         <div className="tab-bar__settings" ref={settingsRef}>
            <button
               className="icon-btn"
               onClick={() => {
                  setSettingsOpen((v) => !v);
                  setConfirmReset(false);
               }}
               title="Editor settings"
            >
               <SlidersHorizontal size={14} />
            </button>

            {settingsOpen && (
               <div className="dropdown__menu dropdown--menu-left editor-settings">
                  {/* ---------- Reset all ---------- */}
                  <button
                     type="button"
                     className={`editor-settings__reset ${confirmReset ? 'is-confirming' : ''}`}
                     onClick={handleResetClick}
                     onMouseLeave={() => {
                        if (confirmReset) setConfirmReset(false);
                     }}
                  >
                     <RotateCcw size={13} />
                     <span>
                        {confirmReset
                           ? 'Klik lagi untuk konfirmasi'
                           : 'Reset ke default'}
                     </span>
                  </button>

                  <div className="dropdown__sep" />

                  {/* ---------- Zoom UI (PC only) ---------- */}
                  {!isMobile && (
                     <>
                        <div className="editor-settings__row">
                           <span>UI zoom</span>
                           <ZoomControl
                              zoom={zoom}
                              onZoomIn={onZoomIn}
                              onZoomOut={onZoomOut}
                              onReset={onZoomReset}
                              min={zoomMin}
                              max={zoomMax}
                           />
                        </div>
                        <div className="dropdown__sep" />
                     </>
                  )}

                  <div className="editor-settings__row">
                     <span>Font size</span>
                     <StepperControl
                        value={settings.fontSize}
                        onChange={(v) => onChangeSettings('fontSize', v)}
                        min={10}
                        max={32}
                        format={(v) => `${v}px`}
                     />
                  </div>

                  <div className="editor-settings__row">
                     <span>Line height</span>
                     <StepperControl
                        value={settings.lineHeight}
                        onChange={(v) => onChangeSettings('lineHeight', v)}
                        min={1}
                        max={3}
                        step={0.1}
                        format={(v) => v.toFixed(1)}
                     />
                  </div>

                  <div className="editor-settings__row">
                     <span>Header height</span>
                     <StepperControl
                        value={settings.headerHeight}
                        onChange={(v) => onChangeSettings('headerHeight', v)}
                        min={24}
                        max={60}
                        format={(v) => `${v}px`}
                     />
                  </div>

                  <div className="editor-settings__row">
                     <span>Bottom bar</span>
                     <StepperControl
                        value={settings.bottomBarHeight}
                        onChange={(v) =>
                           onChangeSettings('bottomBarHeight', v)
                        }
                        min={20}
                        max={60}
                        format={(v) => `${v}px`}
                     />
                  </div>

                  <div className="editor-settings__row">
                     <span>Tab width</span>
                     <StepperControl
                        value={settings.tabMaxWidth}
                        onChange={(v) => onChangeSettings('tabMaxWidth', v)}
                        min={80}
                        max={300}
                        step={10}
                        format={(v) => `${v}px`}
                     />
                  </div>

                  <div className="editor-settings__row">
                     <span>Tab size</span>
                     <StepperControl
                        value={settings.tabSize}
                        onChange={(v) => onChangeSettings('tabSize', v)}
                        min={1}
                        max={8}
                        format={(v) => String(v)}
                     />
                  </div>

                  <div className="dropdown__sep" />

                  <label className="editor-settings__row">
                     <span>Line numbers</span>
                     <input
                        type="checkbox"
                        checked={settings.lineNumbers}
                        onChange={(e) =>
                           onChangeSettings('lineNumbers', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Line wrap</span>
                     <input
                        type="checkbox"
                        checked={settings.lineWrap}
                        onChange={(e) =>
                           onChangeSettings('lineWrap', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Autocomplete</span>
                     <input
                        type="checkbox"
                        checked={settings.autocomplete}
                        onChange={(e) =>
                           onChangeSettings('autocomplete', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Indent guides</span>
                     <input
                        type="checkbox"
                        checked={settings.indentGuides}
                        onChange={(e) =>
                           onChangeSettings('indentGuides', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Linting</span>
                     <input
                        type="checkbox"
                        checked={settings.linting}
                        onChange={(e) =>
                           onChangeSettings('linting', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Highlight active line</span>
                     <input
                        type="checkbox"
                        checked={settings.highlightActiveLine}
                        onChange={(e) =>
                           onChangeSettings(
                              'highlightActiveLine',
                              e.target.checked
                           )
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Close brackets</span>
                     <input
                        type="checkbox"
                        checked={settings.closeBrackets}
                        onChange={(e) =>
                           onChangeSettings('closeBrackets', e.target.checked)
                        }
                     />
                  </label>

                  <label className="editor-settings__row">
                     <span>Indent with tabs</span>
                     <input
                        type="checkbox"
                        checked={settings.indentWithTabs}
                        onChange={(e) =>
                           onChangeSettings('indentWithTabs', e.target.checked)
                        }
                     />
                  </label>
               </div>
            )}
         </div>
      </div>
   );
}