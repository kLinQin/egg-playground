type Props = {
   line: number;
   col: number;
   language: string;
   lineCount: number;
   charCount: number;
};

export function EditorStatusBar({
   line,
   col,
   language,
   lineCount,
   charCount,
}: Props) {
   return (
      <div className="status-bar">
         <span className="status-bar__item">
            Ln {line}, Col {col}
         </span>

         <span className="status-bar__sep" />

         <span className="status-bar__item">{language}</span>

         <span className="status-bar__spacer" />

         <span className="status-bar__item">{lineCount} lines</span>

         <span className="status-bar__sep" />

         <span className="status-bar__item">{charCount} chars</span>
      </div>
   );
}