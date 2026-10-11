import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import type { EditorView } from '@codemirror/view';

/**
 * Linter syntax-only: membaca Lezer tree dan menandai node yang
 * tipenya mengandung "Error" atau "Invalid".
 *
 * Tidak butuh parser tambahan — semua `@codemirror/lang-*` sudah
 * menghasilkan tree dengan node error saat syntax salah.
 */
export function syntaxLinter() {
   return linter(
      (view: EditorView): Diagnostic[] => {
         const diagnostics: Diagnostic[] = [];
         const tree = syntaxTree(view.state);

         tree.iterate({
            enter: (node) => {
               const name = node.type.name;
               if (!name) return;

               // Lezer menamai node error sebagai "⚠" atau mengandung "Error"
               const isError =
                  name === '⚠' ||
                  /error|invalid/i.test(name);

               if (!isError) return;

               // Jangan tandai node error yang sangat panjang —
               // biasanya itu hasil recovery, bukan error nyata.
               const len = node.to - node.from;
               if (len > 2000) return;

               diagnostics.push({
                  from: node.from,
                  to: node.to,
                  severity: 'error',
                  message: `Syntax error: ${name}`,
               });
            },
         });

         return diagnostics;
      },
      { delay: 300 }
   );
}

/** Kumpulan extension untuk linting + gutter. */
export function lintExtensions() {
   return [syntaxLinter(), lintGutter()];
}