import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  FileItem,
  GitConfig,
  GitStatus,
  ChangeItem,
  FileStatus,
} from './types';
import { useTheme } from './hooks/useTheme';
import { useCustomFonts } from './hooks/useCustomFonts';
import { useEditorSettings } from './hooks/useEditorSettings';
import { useResizable } from './hooks/useResizable';
import { useFileStorage } from './hooks/useFileStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useTabs } from './hooks/useTabs';
import { Toolbar } from './components/Toolbar';
import { FileManager } from './components/FileManager';
import { Editor } from './components/Editor';
import { TabBar } from './components/TabBar';
import { GitPanel } from './components/GitPanel';
import { ConfirmDialog } from './components/ConfirmDialog';
import { pullRepo, syncFiles } from './lib/github';
import type { SyncOperation } from './lib/github';
import './App.css';

type PendingGitAction =
  | { type: 'pull'; config: GitConfig }
  | { type: 'push'; config: GitConfig; commitMessage: string }
  | null;

const SUCCESS_TIMEOUT = 3000;

/* ---------- helper: path lengkap dari parentId chain ---------- */
function getFullPath(fileId: string, files: FileItem[]): string {
  const parts: string[] = [];
  let currentId: string | null = fileId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const f = files.find((x) => x.id === currentId);
    if (!f) break;
    parts.unshift(f.name);
    currentId = f.parentId;
  }

  return parts.join('/');
}

function App() {
  const { theme, setTheme } = useTheme();
  const { settings, update: updateSettings } = useEditorSettings();
  const {
    fonts,
    activeFont,
    setActiveId: setActiveFontId,
    addFontFromFile,
    removeFont,
    error: fontError,
    clearError: clearFontError,
  } = useCustomFonts();

  const { files, setFiles, clearAll: clearFiles } = useFileStorage();

  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab,
    closeAllTabs,
    pruneTabs,
  } = useTabs(files);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    updateSettings(
      'editorTheme',
      next === 'dark' ? 'vscodeDark' : 'githubLight'
    );
  };

  useEffect(() => {
    document.body.style.fontFamily = activeFont.family;
  }, [activeFont.family]);

  const filesCol = useResizable({
    initial: 220,
    min: 150,
    max: 500,
    storageKey: 'webden-files-col-width',
  });
  const gitCol = useResizable({
    initial: 280,
    min: 150,
    max: 500,
    reverse: true,
    storageKey: 'webden-git-col-width',
  });

  const [filesOpen, setFilesOpen] = useState(true);
  const [gitOpen, setGitOpen] = useState(false);
  const [gitStatus, setGitStatus] = useState<GitStatus>({ state: 'idle' });
  const [pendingDelete, setPendingDelete] = useState<FileItem | null>(null);
  const [pendingGit, setPendingGit] = useState<PendingGitAction>(null);
  const [pendingFontDelete, setPendingFontDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [stagedIds, setStagedIds] = useState<Set<string>>(new Set());

  const successTimerRef = useRef<number | null>(null);

  const flashSuccess = (message: string) => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
    }
    setGitStatus({ state: 'success', message });
    successTimerRef.current = window.setTimeout(() => {
      setGitStatus({ state: 'idle' });
      successTimerRef.current = null;
    }, SUCCESS_TIMEOUT);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const activeFile = files.find((f) => f.id === activeTabId) ?? null;

  /* ---------- changes — kecualikan folder & file yang dihapus (tombstone) ---------- */
  const changes: ChangeItem[] = useMemo(() => {
    const list: ChangeItem[] = [];

    for (const file of files) {
      /* folder tidak muncul di changes */
      if (file.kind === 'folder') continue;

      /* file yang di-tombstone (deleted) → tampil sebagai 'deleted' kalau
         pernah di-push. Kalau belum pernah → skip (tidak muncul di changes) */
      if (file.deleted) {
        if (file.lastSyncedPath) {
          list.push({
            file,
            status: 'deleted' as FileStatus,
            staged: stagedIds.has(file.id),
            deletePath: file.lastSyncedPath,
          });
        }
        continue;
      }

      /* file baru — belum pernah di-push */
      if (file.isNew) {
        list.push({
          file,
          status: 'added' as FileStatus,
          staged: stagedIds.has(file.id),
        });
        continue;
      }

      /* file lama — cek apakah path berubah (rename/move) */
      const currentPath = getFullPath(file.id, files);
      if (file.lastSyncedPath && file.lastSyncedPath !== currentPath) {
        list.push({
          file,
          status: 'renamed' as FileStatus,
          staged: stagedIds.has(file.id),
          deletePath: file.lastSyncedPath,
        });
        continue;
      }

      /* file lama — cek apakah konten berubah */
      if (file.content !== file.savedContent) {
        list.push({
          file,
          status: 'modified' as FileStatus,
          staged: stagedIds.has(file.id),
        });
      }
    }

    return list;
  }, [files, stagedIds]);

  const stagedChanges = useMemo(
    () => changes.filter((c) => c.staged),
    [changes]
  );

  useEffect(() => {
    setPreviewOpen(false);
  }, [activeTabId]);

  useEffect(() => {
    pruneTabs(files.map((f) => f.id));
  }, [files, pruneTabs]);

  useEffect(() => {
    setStagedIds((prev) => {
      const validIds = new Set(files.map((f) => f.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [files]);

  /* auto-buka tab pertama — hanya kalau file (bukan folder) */
  useEffect(() => {
    if (tabs.length === 0 && files.length > 0) {
      const firstFile = files.find((f) => f.kind === 'file' && !f.deleted);
      if (firstFile) openTab(firstFile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFiles = () => {
    setFilesOpen((v) => {
      const next = !v;
      if (isMobile && next) setGitOpen(false);
      return next;
    });
  };

  const handleToggleGit = () => {
    setGitOpen((v) => {
      const next = !v;
      if (isMobile && next) setFilesOpen(false);
      return next;
    });
  };

  const handleSelectFile = (id: string) => {
    openTab(id);
    if (isMobile) setFilesOpen(false);
  };

  const handleToggleFolder = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id && f.kind === 'folder'
          ? { ...f, expanded: !f.expanded }
          : f
      )
    );
  };

  /* ---------- move file/folder ke folder lain ---------- */
  const handleMove = (id: string, newParentId: string | null) => {
    const movingFile = files.find((f) => f.id === id);
    if (!movingFile) return;

    const conflict = files.some(
      (f) =>
        f.id !== id &&
        f.parentId === newParentId &&
        f.name.toLowerCase() === movingFile.name.toLowerCase() &&
        !f.deleted
    );
    if (conflict) return;

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, parentId: newParentId } : f))
    );

    /* hapus dari staged — path berubah */
    setStagedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  useKeyboardShortcuts({
    onSave: () => {
      /* no-op */
    },
    onClose: () => {
      if (activeTabId) closeTab(activeTabId);
    },
    onFind: () => {
      /* placeholder */
    },
  });

  const validateName = (
    name: string,
    parentId: string | null,
    excludeId?: string
  ): string | null => {
    if (!name.trim()) return 'Nama tidak boleh kosong.';
    if (name.includes('/') || name.includes('\\'))
      return 'Nama tidak boleh mengandung / atau \\';
    const dup = files.some(
      (f) =>
        f.id !== excludeId &&
        f.parentId === parentId &&
        f.name.toLowerCase() === name.toLowerCase() &&
        !f.deleted
    );
    if (dup) return `"${name}" sudah ada di folder ini.`;
    return null;
  };

  /* ---------- create file ---------- */
  const handleCreate = (
    name: string,
    parentId: string | null
  ): string | null => {
    const err = validateName(name, parentId);
    if (err) return err;
    const id = crypto.randomUUID();
    setFiles((prev) => [
      ...prev,
      {
        id,
        name,
        kind: 'file',
        parentId,
        content: '',
        savedContent: '',
        isNew: true,
        lastSyncedPath: null,
      },
    ]);
    openTab(id);
    return null;
  };

  /* ---------- create folder ---------- */
  const handleCreateFolder = (
    name: string,
    parentId: string | null
  ): string | null => {
    const err = validateName(name, parentId);
    if (err) return err;
    const id = crypto.randomUUID();
    setFiles((prev) => [
      ...prev,
      {
        id,
        name,
        kind: 'folder',
        parentId,
        content: '',
        savedContent: '',
        isNew: true,
        expanded: true,
        lastSyncedPath: null,
      },
    ]);
    return null;
  };

  const handleRename = (id: string, name: string): string | null => {
    const file = files.find((f) => f.id === id);
    if (!file) return 'File tidak ditemukan.';
    const err = validateName(name, file.parentId, id);
    if (err) return err;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
    return null;
  };

  /* ---------- delete: tombstone, bukan hapus langsung ---------- */
  const handleConfirmDelete = () => {
    if (!pendingDelete) return;

    const idsToDelete = new Set<string>();
    const collect = (id: string) => {
      idsToDelete.add(id);
      for (const f of files) {
        if (f.parentId === id) collect(f.id);
      }
    };
    collect(pendingDelete.id);

    setFiles((prev) => {
      const next: FileItem[] = [];
      for (const f of prev) {
        if (!idsToDelete.has(f.id)) {
          next.push(f);
          continue;
        }
        /* file yang belum pernah di-push → hapus permanen */
        if (!f.lastSyncedPath) continue;
        /* file yang sudah pernah di-push → tombstone */
        next.push({ ...f, deleted: true });
      }
      return next;
    });

    for (const id of idsToDelete) {
      const file = files.find((f) => f.id === id);
      if (file && !file.lastSyncedPath && tabs.includes(id)) {
        closeTab(id);
      }
    }

    setStagedIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToDelete) next.delete(id);
      return next;
    });

    setPendingDelete(null);
  };

  const handleContentChange = (content: string) => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, content } : f
      )
    );
  };

  const handleStage = (fileId: string) => {
    setStagedIds((prev) => {
      const next = new Set(prev);
      next.add(fileId);
      return next;
    });
  };

  const handleUnstage = (fileId: string) => {
    setStagedIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  };

  /* ---------- restore: undo perubahan ---------- */
  const handleRestore = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (file.deleted) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, deleted: false } : f
        )
      );
      setStagedIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      return;
    }

    if (file.isNew && !file.lastSyncedPath) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (tabs.includes(fileId)) closeTab(fileId);
      setStagedIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      return;
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
            ...f,
            content: f.savedContent,
          }
          : f
      )
    );
    setStagedIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  };

  const handleStageAll = () => {
    setStagedIds(new Set(changes.map((c) => c.file.id)));
  };

  const handleUnstageAll = () => {
    setStagedIds(new Set());
  };

  const handleRestoreAll = () => {
    setFiles((prev) => {
      const next: FileItem[] = [];
      for (const f of prev) {
        if (f.deleted) {
          next.push({ ...f, deleted: false });
          continue;
        }
        if (f.kind === 'file' && f.isNew && !f.lastSyncedPath) continue;
        if (f.kind === 'file' && f.content !== f.savedContent) {
          next.push({ ...f, content: f.savedContent });
          continue;
        }
        next.push(f);
      }
      return next;
    });

    for (const f of files) {
      if (
        f.kind === 'file' &&
        f.isNew &&
        !f.lastSyncedPath &&
        tabs.includes(f.id)
      ) {
        closeTab(f.id);
      }
    }

    setStagedIds(new Set());
  };

  const handleRequestRemoveFont = (id: string) => {
    const font = fonts.find((f) => f.id === id);
    if (!font) return;
    setPendingFontDelete({ id: font.id, label: font.label });
  };

  const handleConfirmRemoveFont = () => {
    if (!pendingFontDelete) return;
    removeFont(pendingFontDelete.id);
    setPendingFontDelete(null);
  };

  /* ---------- Pull — set lastSyncedPath ---------- */
  const doPull = async (config: GitConfig) => {
    setGitStatus({ state: 'busy', message: 'Pull dari GitHub...' });

    const result = await pullRepo(config);

    if (!result.ok) {
      setGitStatus({ state: 'error', message: result.message });
      return;
    }

    const newFiles: FileItem[] = [];
    const folderMap = new Map<string, string>();

    for (const item of result.files) {
      const parts = item.name.split('/').filter(Boolean);
      const fileName = parts.pop();
      if (!fileName) continue;

      let parentId: string | null = null;
      let currentPath = '';

      for (const folderName of parts) {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        const existing = folderMap.get(currentPath);
        if (existing) {
          parentId = existing;
          continue;
        }

        const folderId = crypto.randomUUID();
        newFiles.push({
          id: folderId,
          name: folderName,
          kind: 'folder',
          parentId,
          content: '',
          savedContent: '',
          isNew: false,
          expanded: true,
          lastSyncedPath: currentPath,
        });
        folderMap.set(currentPath, folderId);
        parentId = folderId;
      }

      newFiles.push({
        id: crypto.randomUUID(),
        name: fileName,
        kind: 'file',
        parentId,
        content: item.content,
        savedContent: item.content,
        isNew: false,
        lastSyncedPath: item.name,
      });
    }

    setFiles(newFiles);
    setStagedIds(new Set());
    closeAllTabs();

    const firstFile = newFiles.find((f) => f.kind === 'file');
    if (firstFile) {
      setTimeout(() => openTab(firstFile.id), 0);
    }

    const skippedMsg =
      result.skipped > 0 ? ` (${result.skipped} file dilewati)` : '';
    flashSuccess(
      `Pull berhasil: ${result.files.length} file${skippedMsg}.`
    );
  };

  const handlePull = (config: GitConfig) => {
    setPendingGit({ type: 'pull', config });
  };

  /* ---------- Push — syncFiles (1 commit, upsert + delete) ---------- */
  const doPush = async (config: GitConfig, commitMessage: string) => {
    const staged = changes.filter((c) => c.staged);

    if (staged.length === 0) {
      setGitStatus({
        state: 'error',
        message: 'Tidak ada file yang di-stage.',
      });
      return;
    }

    setGitStatus({ state: 'busy', message: 'Push ke GitHub...' });

    /* ---------- 1. Bangun operasi ---------- */
    const operations: SyncOperation[] = [];
    const upsertIds = new Set<string>();
    const deleteIds = new Set<string>();

    for (const c of staged) {
      if (c.status === 'deleted') {
        if (c.deletePath) {
          operations.push({ type: 'delete', path: c.deletePath });
        }
        deleteIds.add(c.file.id);
        continue;
      }

      const currentPath = getFullPath(c.file.id, files);
      operations.push({
        type: 'upsert',
        path: currentPath,
        content: c.file.content,
      });
      upsertIds.add(c.file.id);

      if (c.status === 'renamed' && c.deletePath) {
        operations.push({ type: 'delete', path: c.deletePath });
      }
    }

    /* ---------- 2. Sync (1 commit) ---------- */
    const result = await syncFiles(config, operations, commitMessage);

    if (!result.ok) {
      setGitStatus({ state: 'error', message: result.message });
      return;
    }

    /* ---------- 3. Update state ---------- */
    setFiles((prev) => {
      const next: FileItem[] = [];
      for (const f of prev) {
        /* file yang dihapus (tombstone) → buang dari array */
        if (deleteIds.has(f.id)) continue;

        /* file yang di-upsert → set lastSyncedPath */
        if (upsertIds.has(f.id)) {
          next.push({
            ...f,
            savedContent: f.content,
            isNew: false,
            lastSyncedPath: getFullPath(f.id, files),
          });
          continue;
        }
        next.push(f);
      }
      return next;
    });

    setStagedIds(new Set());

    const deleteMsg = result.deleted > 0 ? ` · ${result.deleted} dihapus` : '';
    flashSuccess(
      `Push berhasil: ${result.upserted} file${deleteMsg} (${result.commitSha.slice(0, 7)}).`
    );
  };

  const handlePush = (config: GitConfig, commitMessage: string) => {
    setPendingGit({ type: 'push', config, commitMessage });
  };

  const handleConfirmGit = () => {
    if (!pendingGit) return;
    if (pendingGit.type === 'pull') {
      doPull(pendingGit.config);
    } else {
      doPush(pendingGit.config, pendingGit.commitMessage);
    }
    setPendingGit(null);
  };

  const gitDialogContent = (() => {
    if (!pendingGit) return { title: '', message: '' };
    if (pendingGit.type === 'pull') {
      return {
        title: 'Pull dari GitHub?',
        message:
          'Pull akan MENGGANTI semua file lokal dengan file dari repository. File lokal yang tidak ada di repository akan hilang. Lanjutkan?',
      };
    }
    const staged = changes.filter((c) => c.staged);
    const adds = staged.filter((c) => c.status === 'added').length;
    const mods = staged.filter((c) => c.status === 'modified').length;
    const renames = staged.filter((c) => c.status === 'renamed').length;
    const deletes = staged.filter((c) => c.status === 'deleted').length;

    const parts: string[] = [];
    if (adds > 0) parts.push(`${adds} baru`);
    if (mods > 0) parts.push(`${mods} diubah`);
    if (renames > 0) parts.push(`${renames} dipindah`);
    if (deletes > 0) parts.push(`${deletes} dihapus`);

    return {
      title: 'Push ke GitHub?',
      message: `Push akan mengirim: ${parts.join(', ')} ke repository ${pendingGit.config.owner}/${pendingGit.config.repo} (branch ${pendingGit.config.branch}). Lanjutkan?`,
    };
  })();

  const handleClearAll = () => {
    clearFiles();
    closeAllTabs();
    setStagedIds(new Set());
    setGitStatus({ state: 'idle' });
  };

  const closeDrawers = () => {
    if (isMobile) {
      setFilesOpen(false);
      setGitOpen(false);
    }
  };

  const showBackdrop = isMobile && (filesOpen || gitOpen);

  return (
    <div className="app">
      <Toolbar
        theme={theme}
        onToggleTheme={toggleTheme}
        fonts={fonts}
        activeFontId={activeFont.id}
        onSelectFont={setActiveFontId}
        onUploadFont={addFontFromFile}
        onRemoveFont={handleRequestRemoveFont}
        onToggleGit={handleToggleGit}
        gitOpen={gitOpen}
        onToggleFiles={handleToggleFiles}
        filesOpen={filesOpen}
        file={activeFile}
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
      />

      <div className="app__body">
        {showBackdrop && (
          <div
            className="drawer-backdrop"
            onClick={closeDrawers}
            aria-hidden="true"
          />
        )}

        {filesOpen && (
          <>
            <div
              className={`app__col app__col--files ${isMobile ? 'app__col--drawer app__col--drawer-left' : ''
                }`}
              style={
                isMobile
                  ? undefined
                  : { width: filesCol.width, flexShrink: 0 }
              }
            >
              <FileManager
                files={files}
                activeId={activeTabId}
                changesCount={changes.length}
                stagedCount={stagedChanges.length}
                onSelect={handleSelectFile}
                onToggleFolder={handleToggleFolder}
                onCreate={handleCreate}
                onCreateFolder={handleCreateFolder}
                onRename={handleRename}
                onRequestDelete={setPendingDelete}
                onMove={handleMove}
              />
            </div>
            {!isMobile && (
              <div
                className="resize-handle"
                onMouseDown={filesCol.onMouseDown}
              />
            )}
          </>
        )}

        <main className="main">
          <TabBar
            files={files}
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={setActiveTab}
            onClose={closeTab}
            settings={settings}
            onChangeSettings={updateSettings}
          />

          {activeFile ? (
            <Editor
              file={activeFile}
              fontFamily={activeFont.family}
              theme={theme}
              settings={settings}
              previewOpen={previewOpen}
              onChange={handleContentChange}
            />
          ) : (
            <div className="editor-placeholder">Pilih atau buat file</div>
          )}
        </main>

        {gitOpen && (
          <>
            {!isMobile && (
              <div
                className="resize-handle"
                onMouseDown={gitCol.onMouseDown}
              />
            )}
            <div
              className={`app__col app__col--git ${isMobile ? 'app__col--drawer app__col--drawer-right' : ''
                }`}
              style={
                isMobile
                  ? undefined
                  : { width: gitCol.width, flexShrink: 0 }
              }
            >
              <GitPanel
                status={gitStatus}
                onClose={() => setGitOpen(false)}
                onPull={handlePull}
                onPush={handlePush}
                onClearAll={handleClearAll}
                changes={changes}
                onStage={handleStage}
                onUnstage={handleUnstage}
                onRestore={handleRestore}
                onStageAll={handleStageAll}
                onUnstageAll={handleUnstageAll}
                onRestoreAll={handleRestoreAll}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.kind === 'folder' ? 'Hapus folder?' : 'Hapus file?'}
        message={
          pendingDelete
            ? `"${pendingDelete.name}"${pendingDelete.kind === 'folder' ? ' dan semua isinya' : ''
            } akan dihapus.`
            : ''
        }
        confirmLabel="Hapus"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={!!pendingGit}
        title={gitDialogContent.title}
        message={gitDialogContent.message}
        confirmLabel={pendingGit?.type === 'pull' ? 'Pull' : 'Push'}
        danger={pendingGit?.type === 'pull'}
        onConfirm={handleConfirmGit}
        onCancel={() => setPendingGit(null)}
      />

      <ConfirmDialog
        open={!!pendingFontDelete}
        title="Hapus font?"
        message={
          pendingFontDelete
            ? `Font "${pendingFontDelete.label}" akan dihapus dari daftar. Lanjutkan?`
            : ''
        }
        confirmLabel="Hapus"
        danger
        onConfirm={handleConfirmRemoveFont}
        onCancel={() => setPendingFontDelete(null)}
      />

      {fontError && (
        <div className="toast toast--error" onClick={clearFontError}>
          {fontError} (klik untuk tutup)
        </div>
      )}
    </div>
  );
}

export default App;