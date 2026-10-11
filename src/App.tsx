import { useEffect, useState } from 'react';
import type { FileItem, GitConfig, GitStatus } from './types';
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
import { pullRepo, pushFiles } from './lib/github';
import './App.css';

type PendingGitAction =
  | { type: 'pull'; config: GitConfig }
  | { type: 'push'; config: GitConfig; commitMessage: string }
  | null;

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

  const {
    files,
    setFiles,
    clearAll: clearFiles,
  } = useFileStorage();

  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab,
    closeAllTabs,
    pruneTabs,
  } = useTabs();

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

  /* preview state di App — supaya Toolbar bisa kontrol */
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeFile = files.find((f) => f.id === activeTabId) ?? null;

  /* reset preview saat ganti file */
  useEffect(() => {
    setPreviewOpen(false);
  }, [activeTabId]);

  /* auto-prune tabs saat files berubah */
  useEffect(() => {
    pruneTabs(files.map((f) => f.id));
  }, [files, pruneTabs]);

  /* auto-buka tab pertama kalau kosong */
  useEffect(() => {
    if (tabs.length === 0 && files.length > 0) {
      openTab(files[0].id);
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

  useKeyboardShortcuts({
    onSave: () => {
      if (!activeFile) return;
      if (!activeFile.readOnly && !activeFile.saved) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === activeFile.id
              ? { ...f, saved: true, readOnly: true }
              : f
          )
        );
      }
    },
    onClose: () => {
      if (activeTabId) closeTab(activeTabId);
    },
    onFind: () => {
      /* placeholder */
    },
  });

  const validateName = (name: string, excludeId?: string): string | null => {
    if (!name.trim()) return 'Nama tidak boleh kosong.';
    if (name.includes('/') || name.includes('\\'))
      return 'Nama tidak boleh mengandung / atau \\';
    const dup = files.some(
      (f) => f.id !== excludeId && f.name.toLowerCase() === name.toLowerCase()
    );
    if (dup) return `File "${name}" sudah ada.`;
    return null;
  };

  const handleCreate = (name: string): string | null => {
    const err = validateName(name);
    if (err) return err;
    const id = crypto.randomUUID();
    setFiles((prev) => [
      ...prev,
      { id, name, content: '', saved: false, readOnly: false },
    ]);
    openTab(id);
    return null;
  };

  const handleRename = (id: string, name: string): string | null => {
    const err = validateName(name, id);
    if (err) return err;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
    return null;
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    setFiles((prev) => prev.filter((f) => f.id !== pendingDelete.id));
    if (tabs.includes(pendingDelete.id)) {
      closeTab(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  const handleContentChange = (content: string) => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id
          ? { ...f, content, saved: false, readOnly: false }
          : f
      )
    );
  };

  const handleSave = () => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, saved: true, readOnly: true } : f
      )
    );
  };

  const handleEdit = () => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, readOnly: false } : f
      )
    );
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

  /* ---------- Pull ---------- */
  const doPull = async (config: GitConfig) => {
    setGitStatus({ state: 'busy', message: 'Pull dari GitHub...' });

    const result = await pullRepo(config);

    if (!result.ok) {
      setGitStatus({ state: 'error', message: result.message });
      return;
    }

    const newFiles: FileItem[] = result.files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      content: f.content,
      saved: true,
      readOnly: true,
    }));

    setFiles(newFiles);
    closeAllTabs();
    if (newFiles.length > 0) {
      setTimeout(() => openTab(newFiles[0].id), 0);
    }

    const skippedMsg =
      result.skipped > 0 ? ` (${result.skipped} file dilewati)` : '';
    setGitStatus({
      state: 'success',
      message: `Pull berhasil: ${result.files.length} file${skippedMsg}.`,
    });
  };

  const handlePull = (config: GitConfig) => {
    setPendingGit({ type: 'pull', config });
  };

  /* ---------- Push ---------- */
  const doPush = async (config: GitConfig, commitMessage: string) => {
    setGitStatus({ state: 'busy', message: 'Push ke GitHub...' });

    const payload = files.map((f) => ({
      path: f.name,
      content: f.content,
    }));

    const result = await pushFiles(config, payload, commitMessage);

    if (!result.ok) {
      setGitStatus({ state: 'error', message: result.message });
      return;
    }

    if (result.failed > 0) {
      setGitStatus({
        state: 'error',
        message: `Push selesai: ${result.pushed} berhasil, ${result.failed} gagal. ${result.errors[0] ?? ''}`,
      });
      return;
    }

    setFiles((prev) =>
      prev.map((f) => ({ ...f, saved: true, readOnly: true }))
    );

    setGitStatus({
      state: 'success',
      message: `Push berhasil: ${result.pushed} file.`,
    });
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
    return {
      title: 'Push ke GitHub?',
      message: `Push akan mengirim ${files.length} file ke repository ${pendingGit.config.owner}/${pendingGit.config.repo} (branch ${pendingGit.config.branch}). File di remote akan ditimpa jika sudah ada. Lanjutkan?`,
    };
  })();

  const handleClearAll = () => {
    clearFiles();
    closeAllTabs();
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
        onSaveFile={handleSave}
        onEditFile={handleEdit}
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
        settings={settings}
        onChangeSettings={updateSettings}
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
                onSelect={handleSelectFile}
                onCreate={handleCreate}
                onRename={handleRename}
                onRequestDelete={setPendingDelete}
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
              />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus file?"
        message={
          pendingDelete
            ? `File "${pendingDelete.name}" akan dihapus.`
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