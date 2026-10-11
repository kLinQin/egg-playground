type Props = {
   line: number;
   col: number;
   language: string;
   lineCount: number;
   charCount: number;
   errors?: number;
   warnings?: number;
};

export function EditorStatusBar({
   line,
   col,
   language,
   lineCount,
   charCount,
   errors = 0,
   warnings = 0,
}: Props) {
   const hasErrors = errors > 0;
   const hasWarnings = warnings > 0;

   return (
      <div className="status-bar">
         <span className="status-bar__item">
            Ln {line}, Col {col}
         </span>

         <span className="status-bar__sep" />

         <span className="status-bar__item">{language}</span>

         {(hasErrors || hasWarnings) && (
            <>
               <span className="status-bar__sep" />
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

         <span className="status-bar__sep" />

         <span className="status-bar__item">{charCount} chars</span>
      </div>
   );
}