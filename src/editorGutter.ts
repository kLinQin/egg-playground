import { EditorView, gutter, GutterMarker } from '@codemirror/view';
import { StateField, StateEffect, type Extension } from '@codemirror/state';

/** Tipe baris: added (baris baru) atau modified (baris diubah). */
export type LineChange = {
   /** nomor baris (1-based) */
   line: number;
   type: 'added' | 'modified';
};

/** Effect untuk set daftar perubahan dari luar. */
export const setLineChanges = StateEffect.define<LineChange[]>();

/** StateField menyimpan daftar perubahan. */
const lineChangesField = StateField.define<LineChange[]>({
   create: () => [],
   update(value, tr) {
      for (const e of tr.effects) {
         if (e.is(setLineChanges)) return e.value;
      }
      // kalau dokumen berubah tapi effect tidak dikirim → kosongkan
      // (akan di-set ulang oleh useEffect di Editor.tsx)
      return value;
   },
});

/* ---------- marker ---------- */
class ChangeMarker extends GutterMarker {
   type: 'added' | 'modified';

   constructor(type: 'added' | 'modified') {
      super();
      this.type = type;
   }

   eq(other: ChangeMarker) {
      return this.type === other.type;
   }

   toDOM() {
      const el = document.createElement('div');
      el.className = `cm-change-marker cm-change-marker--${this.type}`;
      return el;
   }
}

const addedMarker = new ChangeMarker('added');
const modifiedMarker = new ChangeMarker('modified');

/** Gutter yang menampilkan marker perubahan per baris. */
function changeGutter() {
   return gutter({
      class: 'cm-change-gutter',
      lineMarker(view, line) {
         const changes = view.state.field(lineChangesField, false);
         if (!changes || changes.length === 0) return null;

         const lineNo = view.state.doc.lineAt(line.from).number;
         const change = changes.find((c) => c.line === lineNo);
         if (!change) return null;

         return change.type === 'added' ? addedMarker : modifiedMarker;
      },
      initialSpacer: () => new ChangeMarker('added'),
   });
}

/** Extension lengkap: field + gutter. */
export function lineChangeGutter(): Extension {
   return [lineChangesField, changeGutter()];
}

/** Helper untuk set perubahan dari React. */
export function applyLineChanges(view: EditorView, changes: LineChange[]) {
   view.dispatch({ effects: setLineChanges.of(changes) });
}