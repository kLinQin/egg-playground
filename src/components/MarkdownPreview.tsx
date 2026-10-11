import { useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

type Props = {
   content: string;
   fontFamily?: string;
   fontSize?: number;
   lineHeight?: number;
};

marked.setOptions({
   gfm: true,
   breaks: true,
});

export function MarkdownPreview({
   content,
   fontFamily,
   fontSize,
   lineHeight,
}: Props) {
   const containerRef = useRef<HTMLDivElement>(null);
   const html = useMemo(() => {
      const raw = marked.parse(content, { async: false }) as string;
      return DOMPurify.sanitize(raw, {
         ADD_ATTR: ['target', 'rel'],
      });
   }, [content]);

   /* ---------- inject copy button ke setiap <pre> ---------- */
   useEffect(() => {
      const root = containerRef.current;
      if (!root) return;

      const pres = root.querySelectorAll('pre');
      pres.forEach((pre) => {
         if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

         const wrapper = document.createElement('div');
         wrapper.className = 'code-block-wrapper';
         pre.parentNode?.insertBefore(wrapper, pre);
         wrapper.appendChild(pre);

         const btn = document.createElement('button');
         btn.className = 'code-copy-btn';
         btn.type = 'button';
         btn.title = 'Copy code';
         btn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>';

         btn.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.textContent ?? '';
            try {
               await navigator.clipboard.writeText(code);
               btn.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Copied!</span>';
               btn.classList.add('code-copy-btn--copied');
               setTimeout(() => {
                  btn.innerHTML =
                     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>';
                  btn.classList.remove('code-copy-btn--copied');
               }, 2000);
            } catch {
               // ignore
            }
         });

         wrapper.appendChild(btn);
      });
   }, [html]);

   const style: React.CSSProperties = {};
   if (fontFamily) style.fontFamily = fontFamily;
   if (fontSize) style.fontSize = `${fontSize}px`;
   if (lineHeight) style.lineHeight = lineHeight;

   return (
      <div
         ref={containerRef}
         className="markdown-preview__content"
         style={style}
         dangerouslySetInnerHTML={{ __html: html }}
      />
   );
}