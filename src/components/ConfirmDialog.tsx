type Props = {
   open: boolean;
   title: string;
   message: string;
   confirmLabel?: string;
   cancelLabel?: string;
   danger?: boolean;
   onConfirm: () => void;
   onCancel: () => void;
};

export function ConfirmDialog({
   open,
   title,
   message,
   confirmLabel = 'Ya',
   cancelLabel = 'Batal',
   danger = false,
   onConfirm,
   onCancel,
}: Props) {
   if (!open) return null;

   return (
      <div className="dialog-backdrop" onClick={onCancel}>
         <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
         >
            <h3 className="dialog__title">{title}</h3>
            <p className="dialog__message">{message}</p>
            <div className="dialog__actions">
               <button className="btn" onClick={onCancel}>
                  {cancelLabel}
               </button>
               <button
                  className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
                  onClick={onConfirm}
                  autoFocus
               >
                  {confirmLabel}
               </button>
            </div>
         </div>
      </div>
   );
}