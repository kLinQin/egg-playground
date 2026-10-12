import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FileItem,
  GitConfig,
  GitStatus,
  ChangeItem,
  FileStatus,
  FileSource,
} from './types';
import { useTheme } from './hooks/useTheme';
import { useCustomFonts } from './hooks/useCustomFonts';
import { useEditorSettings } from './hooks/useEditorSettings';
import { useResizable } from './hooks/useResizable';
import { useFileStorage } from './hooks/useFileStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useTabs } from './hooks/useTabs';
import { useFileSystem } from './hooks/useFileSystem';
import { Toolbar } from './components/Toolbar';
import { FileManager } from './components/FileManager';
import { Editor } from './components/Editor';
import { TabBar } from './components/TabBar';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LocalPanel } from './components/LocalPanel';
import { pullRepo, syncFiles } from './lib/github';
import type { SyncOperation } from './lib/github';
import './App.css';

const GitPanel = lazy(() =>
  import('./components/GitPanel').then((m) => ({ default: m.GitPanel }))
);

type PendingGitAction =
  | { type: 'pull'; config: GitConfig }
  | { type: 'push'; config: GitConfig; commitMessage: string }
  | null;

type PendingSourceChange = FileSource | null;

const SUCCESS_TIMEOUT = 3000;

const MAX_FILE_SIZE = 500 * 1024;
const MAX_FILE_COUNT = 2000;

const TEXT_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'json', 'md', 'markdown',
  'py', 'rs', 'sql', 'xml',
  'txt', 'yml', 'yaml', 'toml', 'ini', 'env',
  'sh', 'bash', 'zsh',
  'go', 'java', 'kt', 'swift', 'rb', 'php', 'c', 'h', 'cpp', 'hpp', 'cs',
  'vue', 'svelte',
  'gitignore', 'editorconfig',
];

function isTextFile(name: string): boolean {
  const lower = name.toLowerCase();
  const basename = lower.split('/').pop() ?? '';
  if (
    basename === '.gitignore' ||
    basename === '.editorconfig' ||
    basename === 'license' ||
    basename === 'readme'
  ) {
    return true;
  }
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return false;
  const ext = lower.slice(dot + 1);
  return TEXT_EXTENSIONS.includes(ext);
}

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

function hasUnsavedChanges(files: FileItem[]): boolean {
  return files.some(
    (f) =>
      f.kind === 'file' &&
      !f.deleted &&
      (f.isNew || f.content !== f.savedContent)
  );
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

  const {
    files,
    setFiles,
    flushToStorage,
    clearAll: clearFiles,
  } = useFileStorage();

  const {
    supported: fsSupported,
    folderName: diskFolderName,
    entries: diskEntries,
    pickFolder,
    releaseFolder,
    readFile: fsReadFile,
    writeFile: fsWriteFile,
    deleteFile: fsDeleteFile,
    createFolder: fsCreateFolder,
    refreshEntries: fsRefresh,
  } = useFileSystem();

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

  const [source, setSource] = useState<FileSource>('local');
  const [pendingSource, setPendingSource] = useState<PendingSourceChange>(null);
  const [diskLoading, setDiskLoading] = useState(false);
  const [diskError, setDiskError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [hasPulled, setHasPulled] = useState(false);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [editorResetKey, setEditorResetKey] = useState(0);
  const isDiscardingRef = useRef(false);

  const sourceSnapshotRef = useRef<Partial<Record<FileSource, FileItem[]>>>({});

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
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

  const changes: ChangeItem[] = useMemo(() => {
    const list: ChangeItem[] = [];

    for (const file of files) {
      if (file.kind === 'folder') continue;

      const isPending = pendingIds.has(file.id);

      if (file.deleted) {
        if (file.lastSyncedPath || isPending) {
          list.push({
            file,
            status: 'deleted' as FileStatus,
            staged: stagedIds.has(file.id),
            deletePath: file.lastSyncedPath ?? undefined,
          });
        }
        continue;
      }

      if (file.isNew) {
        list.push({
          file,
          status: 'added' as FileStatus,
          staged: stagedIds.has(file.id),
        });
        continue;
      }

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

      if (file.content !== file.savedContent || isPending) {
        list.push({
          file,
          status: 'modified' as FileStatus,
          staged: stagedIds.has(file.id),
        });
      }
    }

    return list;
  }, [files, stagedIds, pendingIds]);

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
    sourceSnapshotRef.current[source] = files;
  }, [files, source]);

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

  useEffect(() => {
    setPendingIds((prev) => {
      const validIds = new Set(files.map((f) => f.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [files]);

  useEffect(() => {
    if (tabs.length === 0 && files.length > 0) {
      const firstFile = files.find((f) => f.kind === 'file' && !f.deleted);
      if (firstFile) openTab(firstFile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (source !== 'disk') return;
    if (!fsSupported) return;
    if (diskEntries.length === 0) return;

    let cancelled = false;

    (async () => {
      setDiskLoading(true);
      setDiskError(null);

      const textEntries = diskEntries.filter(
        (e) => e.kind === 'file' && isTextFile(e.path)
      );

      if (textEntries.length > MAX_FILE_COUNT) {
        setDiskError(
          `Folder terlalu besar (${textEntries.length} file). Maks ${MAX_FILE_COUNT}.`
        );
        setDiskLoading(false);
        return;
      }

      const folderMap = new Map<string, string>();
      const newFiles: FileItem[] = [];

      for (const entry of diskEntries) {
        if (entry.kind !== 'folder') continue;
        const id = crypto.randomUUID();
        folderMap.set(entry.path, id);

        const parts = entry.path.split('/');
        parts.pop();
        const parentPath = parts.join('/');
        const parentId = parentPath ? folderMap.get(parentPath) ?? null : null;

        newFiles.push({
          id,
          name: entry.name,
          kind: 'folder',
          parentId,
          content: '',
          savedContent: '',
          isNew: false,
          expanded: false,
          lastSyncedPath: entry.path,
          languageOverride: null,
        });
      }

      for (const entry of textEntries) {
        if (cancelled) return;

        try {
          const content = await fsReadFile(entry.path);
          if (content.length > MAX_FILE_SIZE) continue;

          const parts = entry.path.split('/');
          parts.pop();
          const parentPath = parts.join('/');
          const parentId = parentPath
            ? folderMap.get(parentPath) ?? null
            : null;

          newFiles.push({
            id: crypto.randomUUID(),
            name: entry.name,
            kind: 'file',
            parentId,
            content,
            savedContent: content,
            isNew: false,
            lastSyncedPath: entry.path,
            languageOverride: null,
          });
        } catch {
          /* skip file yang gagal dibaca */
        }
      }

      if (cancelled) return;

      setFiles(newFiles);
      setDiskLoading(false);

      const first = newFiles.find((f) => f.kind === 'file');
      if (first) {
        setTimeout(() => openTab(first.id), 0);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, diskEntries]);

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

    setStagedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!activeFile || activeFile.kind !== 'file') return;

    if (source === 'github') return;

    try {
      if (source === 'disk') {
        const path = activeFile.lastSyncedPath;
        if (!path) {
          setGitStatus({
            state: 'error',
            message: 'File belum punya path di disk.',
          });
          return;
        }
        await fsWriteFile(path, activeFile.content);
      }

      setFiles((prev) => {
        const next = prev.map((f) =>
          f.id === activeFile.id
            ? {
              ...f,
              savedContent: f.content,
              isNew: false,
            }
            : f
        );

        if (source === 'local') {
          try {
            localStorage.setItem('webden-files', JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }

        return next;
      });

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(activeFile.id);
        return next;
      });

      flashSuccess('Tersimpan — tunggu Save All untuk bersihkan dari Changes.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan file.';
      setGitStatus({ state: 'error', message });
    }
  };

  useKeyboardShortcuts({
    onSave: () => {
      void handleSave();
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

  const handleCreateFolder = (
    name: string,
    parentId: string | null
  ): string | null => {
    const err = validateName(name, parentId);
    if (err) return err;
    const id = crypto.randomUUID();

    if (source === 'disk') {
      const parentFile = parentId
        ? files.find((f) => f.id === parentId)
        : null;
      const parentPath = parentFile?.lastSyncedPath ?? '';
      const path = parentPath ? `${parentPath}/${name}` : name;

      void fsCreateFolder(path).catch(() => {
        setGitStatus({
          state: 'error',
          message: `Gagal buat folder "${name}" di disk.`,
        });
      });
    }

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

    if (source === 'disk' && file.lastSyncedPath) {
      const parts = file.lastSyncedPath.split('/');
      parts.pop();
      const parentPath = parts.join('/');
      const newPath = parentPath ? `${parentPath}/${name}` : name;

      void (async () => {
        try {
          if (file.kind === 'file') {
            await fsWriteFile(newPath, file.content);
            await fsDeleteFile(file.lastSyncedPath!);
          } else {
            await fsCreateFolder(newPath);
            await fsDeleteFile(file.lastSyncedPath!);
          }
          await fsRefresh();
        } catch {
          setGitStatus({
            state: 'error',
            message: `Gagal rename "${file.name}" di disk.`,
          });
        }
      })();
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
    return null;
  };

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

    if (source === 'disk') {
      const pathsToDelete: string[] = [];
      for (const id of idsToDelete) {
        const f = files.find((x) => x.id === id);
        if (f && f.lastSyncedPath) pathsToDelete.push(f.lastSyncedPath);
      }

      void (async () => {
        for (const p of pathsToDelete) {
          try {
            await fsDeleteFile(p);
          } catch {
            /* ignore */
          }
        }
        await fsRefresh();
      })();
    }

    setFiles((prev) => {
      const next: FileItem[] = [];
      for (const f of prev) {
        if (!idsToDelete.has(f.id)) {
          next.push(f);
          continue;
        }
        if (source === 'disk' || !f.lastSyncedPath) continue;
        next.push({ ...f, deleted: true });
      }

      if (source === 'local') {
        try {
          localStorage.setItem('webden-files', JSON.stringify(next));
        } catch {
          /* ignore */
        }
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

    setPendingIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToDelete) next.delete(id);
      return next;
    });

    setPendingDelete(null);
  };

  const handleContentChange = (content: string) => {
    if (!activeFile) return;

    /* abaikan onChange yang ter-emit saat discard (sync controlled value) */
    if (isDiscardingRef.current) return;

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== activeFile.id) return f;

        if (f.preEditContent === undefined) {
          return { ...f, content, preEditContent: f.savedContent };
        }

        return { ...f, content };
      })
    );

    setPendingIds((prev) => {
      if (!prev.has(activeFile.id)) return prev;
      const next = new Set(prev);
      next.delete(activeFile.id);
      return next;
    });
  };

  /* ---------- ganti bahasa override ---------- */
  const handleLanguageOverrideChange = (id: string | null) => {
    if (!activeFile || activeFile.kind !== 'file') return;

    setFiles((prev) => {
      const next = prev.map((f) =>
        f.id === activeFile.id ? { ...f, languageOverride: id } : f
      );

      if (source === 'local') {
        try {
          localStorage.setItem('webden-files', JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }

      return next;
    });
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

  const handleStageAll = () => {
    setStagedIds(new Set(changes.map((c) => c.file.id)));
  };

  const handleUnstageAll = () => {
    setStagedIds(new Set());
  };

  const handleDiscard = (fileId: string) => {
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
      setPendingIds((prev) => {
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
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      return;
    }

    /* ---------- tentukan nilai revert ---------- */
    const revertTo =
      file.preEditContent !== undefined
        ? file.preEditContent
        : file.savedContent;

    /* ---------- tulis ulang ke disk / localStorage ---------- */
    if (source === 'disk' && file.lastSyncedPath) {
      void fsWriteFile(file.lastSyncedPath, revertTo).catch(() => {
        /* ignore */
      });
    }

    /* ---------- guard onChange selama sync value ---------- */
    isDiscardingRef.current = true;

    setFiles((prev) => {
      const next = prev.map((f) =>
        f.id === fileId
          ? {
            ...f,
            content: revertTo,
            savedContent: revertTo,
            preEditContent: undefined,
          }
          : f
      );

      if (source === 'local') {
        try {
          localStorage.setItem('webden-files', JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }

      return next;
    });

    setStagedIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });

    if (fileId === activeTabId) {
      setEditorResetKey((k) => k + 1);
    }

    /* clear flag setelah remount selesai */
    setTimeout(() => {
      isDiscardingRef.current = false;
    }, 0);
  };

  const handleDiscardAll = () => {
    /* ---------- kumpulkan file yang perlu ditulis ulang ke disk ---------- */
    if (source === 'disk') {
      for (const f of files) {
        if (f.kind !== 'file' || f.deleted || !f.lastSyncedPath) continue;
        if (f.preEditContent === undefined && f.content === f.savedContent)
          continue;

        const revertTo =
          f.preEditContent !== undefined ? f.preEditContent : f.savedContent;
        void fsWriteFile(f.lastSyncedPath, revertTo).catch(() => {
          /* ignore */
        });
      }
    }

    isDiscardingRef.current = true;

    setFiles((prev) => {
      const next: FileItem[] = [];
      for (const f of prev) {
        if (f.deleted) {
          next.push({ ...f, deleted: false });
          continue;
        }
        if (f.kind === 'file' && f.isNew && !f.lastSyncedPath) continue;

        if (f.kind === 'file' && f.preEditContent !== undefined) {
          next.push({
            ...f,
            content: f.preEditContent,
            savedContent: f.preEditContent,
            preEditContent: undefined,
          });
          continue;
        }
        if (f.kind === 'file' && f.content !== f.savedContent) {
          next.push({
            ...f,
            content: f.savedContent,
            savedContent: f.savedContent,
          });
          continue;
        }
        next.push(f);
      }

      if (source === 'local') {
        try {
          localStorage.setItem('webden-files', JSON.stringify(next));
        } catch {
          /* ignore */
        }
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
    setPendingIds(new Set());

    setEditorResetKey((k) => k + 1);

    setTimeout(() => {
      isDiscardingRef.current = false;
    }, 0);
  };

  const handleSaveAll = async () => {
    if (saving) return;

    const unsaved = changes.filter(
      (c) => c.status !== 'renamed' || c.deletePath
    );

    if (unsaved.length === 0) {
      setGitStatus({
        state: 'error',
        message: 'Tidak ada file yang perlu disimpan.',
      });
      return;
    }

    setSaving(true);

    try {
      if (source === 'disk') {
        for (const c of unsaved) {
          if (c.status === 'deleted') {
            if (c.deletePath) {
              try {
                await fsDeleteFile(c.deletePath);
              } catch {
                /* ignore */
              }
            }
            continue;
          }

          const path = c.file.lastSyncedPath || getFullPath(c.file.id, files);
          try {
            await fsWriteFile(path, c.file.content);
          } catch {
            /* ignore */
          }
        }
      }

      const unsavedIds = new Set(unsaved.map((c) => c.file.id));

      setFiles((prev) => {
        const next: FileItem[] = [];
        for (const f of prev) {
          const change = unsaved.find((c) => c.file.id === f.id);
          if (change && change.status === 'deleted') continue;

          if (unsavedIds.has(f.id)) {
            next.push({
              ...f,
              savedContent: f.content,
              isNew: false,
              preEditContent: undefined,
            });
            continue;
          }
          next.push(f);
        }

        if (source === 'local') {
          try {
            localStorage.setItem('webden-files', JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }

        return next;
      });

      if (source === 'disk') {
        await fsRefresh();
      }

      setStagedIds(new Set());
      setPendingIds(new Set());

      flashSuccess(`${unsaved.length} file tersimpan.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan file.';
      setGitStatus({ state: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllLocal = () => {
    if (source !== 'local') return;

    clearFiles();
    closeAllTabs();
    setStagedIds(new Set());
    setPendingIds(new Set());
    setGitStatus({ state: 'idle' });
    setPreviewOpen(false);

    flashSuccess('Semua file local dihapus.');
  };

  const handleSaveToDisk = async () => {
    if (!fsSupported) return;

    const filesToSave = files.filter((f) => !f.deleted);
    if (filesToSave.length === 0) return;

    const ok = await pickFolder();
    if (!ok) return;

    setSaving(true);

    try {
      const folders = filesToSave.filter((f) => f.kind === 'folder');
      for (const folder of folders) {
        const path = getFullPath(folder.id, files);
        if (!path) continue;
        try {
          await fsCreateFolder(path);
        } catch {
          /* ignore */
        }
      }

      const textFiles = filesToSave.filter((f) => f.kind === 'file');
      let written = 0;

      for (const file of textFiles) {
        const path = getFullPath(file.id, files);
        if (!path) continue;
        try {
          await fsWriteFile(path, file.content);
          written++;
        } catch {
          /* ignore */
        }
      }

      await releaseFolder();

      flashSuccess(`${written} file disimpan ke folder.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan ke disk.';
      setGitStatus({ state: 'error', message });
    } finally {
      setSaving(false);
    }
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

  const applySourceChange = async (next: FileSource) => {
    if (source === 'disk' && next !== 'disk') {
      await releaseFolder();
    }

    if (source === 'local' && next !== 'local') {
      flushToStorage();
    }

    if (next === 'disk') {
      if (!fsSupported) return;

      if (!diskFolderName) {
        const ok = await pickFolder();
        if (!ok) return;
      } else {
        await fsRefresh();
      }
    }

    closeAllTabs();
    setStagedIds(new Set());
    setPendingIds(new Set());
    setGitStatus({ state: 'idle' });
    setPreviewOpen(false);

    setSource(next);

    if (next === 'local') {
      const snapshot = sourceSnapshotRef.current.local;
      if (snapshot && snapshot.length > 0) {
        setFiles(snapshot);
      } else {
        try {
          const raw = localStorage.getItem('webden-files');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setFiles(parsed);
            }
          }
        } catch {
          /* ignore */
        }
      }
    } else if (next === 'github') {
      const snapshot = sourceSnapshotRef.current.github;
      if (snapshot && snapshot.length > 0) {
        setFiles(snapshot);
        setHasPulled(true);

        const firstFile = snapshot.find(
          (f) => f.kind === 'file' && !f.deleted
        );
        if (firstFile) {
          setTimeout(() => openTab(firstFile.id), 0);
        }
      } else {
        setFiles([]);
        setHasPulled(false);
      }
    } else if (next === 'disk') {
      setFiles([]);
    }
  };

  const handleChangeSource = async (next: FileSource) => {
    if (next === source) return;

    if (hasUnsavedChanges(files)) {
      setPendingSource(next);
      return;
    }

    await applySourceChange(next);
  };

  const handleConfirmSourceChange = async (mode: 'save' | 'discard') => {
    if (!pendingSource) return;
    const next = pendingSource;
    setPendingSource(null);

    if (mode === 'save') {
      if (source === 'disk') {
        const dirty = files.filter(
          (f) =>
            f.kind === 'file' &&
            f.lastSyncedPath &&
            f.content !== f.savedContent
        );
        for (const f of dirty) {
          try {
            await fsWriteFile(f.lastSyncedPath!, f.content);
          } catch {
            /* ignore */
          }
        }
      }

      const updatedFiles = files.map((f) => ({
        ...f,
        savedContent: f.content,
        isNew: false,
        preEditContent: undefined,
      }));
      setFiles(updatedFiles);

      if (source === 'local') {
        try {
          localStorage.setItem(
            'webden-files',
            JSON.stringify(updatedFiles)
          );
        } catch {
          /* ignore */
        }
      }
    }

    await applySourceChange(next);
  };

  const handleCancelSourceChange = () => {
    setPendingSource(null);
  };

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
    setPendingIds(new Set());
    closeAllTabs();
    setSource('github');
    setHasPulled(true);

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

    const result = await syncFiles(config, operations, commitMessage);

    if (!result.ok) {
      setGitStatus({ state: 'error', message: result.message });
      return;
    }

    setFiles((prev) => {
      const next: FileItem[] = [];
      for (const f of prev) {
        if (deleteIds.has(f.id)) continue;

        if (upsertIds.has(f.id)) {
          next.push({
            ...f,
            savedContent: f.content,
            isNew: false,
            lastSyncedPath: getFullPath(f.id, files),
            preEditContent: undefined,
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
    setPendingIds(new Set());
    setGitStatus({ state: 'idle' });
  };

  const closeDrawers = () => {
    if (isMobile) {
      setFilesOpen(false);
      setGitOpen(false);
    }
  };

  const showBackdrop = isMobile && (filesOpen || gitOpen);

  const sourceDialogContent = (() => {
    if (!pendingSource) return { title: '', message: '' };
    const labels: Record<FileSource, string> = {
      local: 'Local',
      disk: 'Folder',
      github: 'GitHub',
    };
    return {
      title: `Pindah ke mode ${labels[pendingSource]}?`,
      message:
        'Ada perubahan yang belum disimpan. Simpan dulu sebelum pindah mode, atau buang perubahan?',
    };
  })();

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
        source={source}
        onChangeSource={handleChangeSource}
        fsSupported={fsSupported}
        folderName={diskFolderName}
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
            previewOpen={previewOpen}
            onTogglePreview={() => setPreviewOpen((v) => !v)}
            onSave={() => void handleSave()}
          />

          {diskLoading ? (
            <div className="editor-placeholder">Memuat file dari folder…</div>
          ) : diskError ? (
            <div className="editor-placeholder">{diskError}</div>
          ) : activeFile ? (
            <Editor
              file={activeFile}
              fontFamily={activeFont.family}
              theme={theme}
              settings={settings}
              previewOpen={previewOpen}
              onChange={handleContentChange}
              onLanguageOverrideChange={handleLanguageOverrideChange}
              resetKey={editorResetKey}
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
              {source === 'github' ? (
                <Suspense
                  fallback={
                    <div className="editor-placeholder">Memuat Git panel…</div>
                  }
                >
                  <GitPanel
                    status={gitStatus}
                    onPull={handlePull}
                    onPush={handlePush}
                    onClearAll={handleClearAll}
                    changes={changes}
                    onStage={handleStage}
                    onUnstage={handleUnstage}
                    onRestore={handleDiscard}
                    onStageAll={handleStageAll}
                    onUnstageAll={handleUnstageAll}
                    onRestoreAll={handleDiscardAll}
                    canSaveToDisk={hasPulled && fsSupported}
                    onSaveToDisk={() => void handleSaveToDisk()}
                  />
                </Suspense>
              ) : (
                <LocalPanel
                  source={source}
                  folderName={diskFolderName}
                  changes={changes}
                  pendingIds={pendingIds}
                  onDiscard={handleDiscard}
                  onDiscardAll={handleDiscardAll}
                  onSaveAll={() => void handleSaveAll()}
                  onClearAll={handleClearAllLocal}
                  saving={saving}
                />
              )}
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

      <ConfirmDialog
        open={!!pendingSource}
        title={sourceDialogContent.title}
        message={sourceDialogContent.message}
        cancelLabel="Batal"
        thirdLabel="Buang & Lanjut"
        confirmLabel="Simpan & Lanjut"
        onCancel={handleCancelSourceChange}
        onThird={() => handleConfirmSourceChange('discard')}
        onConfirm={() => handleConfirmSourceChange('save')}
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