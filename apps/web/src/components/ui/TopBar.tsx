'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, File, FolderOpen, Save, Download, Upload, Settings, HelpCircle, ChevronDown, Monitor, Smartphone, Box, GitBranch, Zap, Brain, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/hooks/useStudioStore';
import { useViewportStore } from '@/hooks/useViewportStore';

export function TopBar() {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [windowMenuOpen, setWindowMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [reconstructMenuOpen, setReconstructMenuOpen] = useState(false);

  const { scene, exportScene, importScene, pushHistory, undo, redo, canUndo, canRedo, activeTool, setActiveTool } = useStudioStore();
  const { shading, setShading, frameAll, frameSelected, toggleFullscreen, screenshot } = useViewportStore();

  const handleNewScene = () => {
    if (confirm('Create new scene? Unsaved changes will be lost.')) {
      pushHistory(scene);
      // Reset scene
    }
  };

  const handleSaveScene = () => {
    const data = exportScene();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.name.replace(/\s+/g, '-')}.reina.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportModel = async () => {
    const blob = await screenshot();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.name.replace(/\s+/g, '-')}-viewport.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Trigger reconstruction
        console.log('Import image:', file.name);
      }
    };
    input.click();
  };

  return (
    <div className="h-9 bg-studio-bg-elevated/80 backdrop-blur-studio border-b border-studio-border flex items-center gap-4 px-3">
      <div className="flex items-center gap-1">
        <MenuBarItem label="File" open={fileMenuOpen} onClick={() => setFileMenuOpen(!fileMenuOpen)}>
          <File className="w-4 h-4" />
        </MenuBarItem>
        <AnimatePresence>
          {fileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-9 left-3 studio-panel-elevated min-w-[200px] py-1 shadow-studio-lg z-50 animate-slide-down"
            >
              <MenuItem label="New Scene" shortcut="Ctrl+N" icon={<File />} onClick={handleNewScene} />
              <MenuItem label="Open Scene..." shortcut="Ctrl+O" icon={<FolderOpen />} onClick={() => {}} />
              <MenuItem label="Save Scene" shortcut="Ctrl+S" icon={<Save />} onClick={handleSaveScene} />
              <MenuItem label="Save Scene As..." shortcut="Ctrl+Shift+S" icon={<Save />} onClick={() => {}} />
              <MenuSeparator />
              <MenuItem label="Import Image..." shortcut="Ctrl+I" icon={<Upload />} onClick={handleImportImage} />
              <MenuItem label="Import Model..." icon={<Box />} onClick={() => {}} />
              <MenuSeparator />
              <MenuItem label="Export Model..." shortcut="Ctrl+E" icon={<Download />} onClick={handleExportModel} />
              <MenuItem label="Export Viewport Image" icon={<Monitor />} onClick={handleExportModel} />
              <MenuSeparator />
              <MenuItem label="Preferences..." shortcut="Ctrl+," icon={<Settings />} onClick={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>

        <MenuBarItem label="Edit" open={editMenuOpen} onClick={() => setEditMenuOpen(!editMenuOpen)}>
          <Zap className="w-4 h-4" />
        </MenuBarItem>
        <AnimatePresence>
          {editMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-9 left-50 studio-panel-elevated min-w-[200px] py-1 shadow-studio-lg z-50 animate-slide-down"
            >
              <MenuItem label="Undo" shortcut="Ctrl+Z" icon={<Zap />} onClick={undo} disabled={!canUndo()} />
              <MenuItem label="Redo" shortcut="Ctrl+Shift+Z" icon={<Zap />} onClick={redo} disabled={!canRedo()} />
              <MenuSeparator />
              <MenuItem label="Cut" shortcut="Ctrl+X" icon={<X />} onClick={() => {}} />
              <MenuItem label="Copy" shortcut="Ctrl+C" icon={<Box />} onClick={() => {}} />
              <MenuItem label="Paste" shortcut="Ctrl+V" icon={<Box />} onClick={() => {}} />
              <MenuItem label="Duplicate" shortcut="Ctrl+D" icon={<Layers />} onClick={() => {}} />
              <MenuItem label="Delete" shortcut="Del" icon={<X />} onClick={() => {}} />
              <MenuSeparator />
              <MenuItem label="Select All" shortcut="Ctrl+A" icon={<Box />} onClick={() => {}} />
              <MenuItem label="Deselect All" shortcut="Ctrl+Shift+A" icon={<X />} onClick={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>

        <MenuBarItem label="View" open={viewMenuOpen} onClick={() => setViewMenuOpen(!viewMenuOpen)}>
          <Monitor className="w-4 h-4" />
        </MenuBarItem>
        <AnimatePresence>
          {viewMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-9 left-90 studio-panel-elevated min-w-[200px] py-1 shadow-studio-lg z-50 animate-slide-down"
            >
              <MenuItem label="Frame All" shortcut="F" icon={<Box />} onClick={frameAll} />
              <MenuItem label="Frame Selected" shortcut="." icon={<Box />} onClick={frameSelected} />
              <MenuSeparator />
              <MenuItem label="Toggle Fullscreen" shortcut="F11" icon={<Monitor />} onClick={toggleFullscreen} />
              <MenuSeparator />
              {(['wireframe', 'solid', 'material', 'rendered'] as const).map(mode => (
                <MenuItem
                  key={mode}
                  label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  icon={null}
                  onClick={() => setShading(mode)}
                  checked={shading === mode}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <MenuBarItem label="Tools" open={toolsMenuOpen} onClick={() => setToolsMenuOpen(!toolsMenuOpen)}>
          <Brain className="w-4 h-4" />
        </MenuBarItem>
        <AnimatePresence>
          {toolsMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-9 left-130 studio-panel-elevated min-w-[220px] py-1 shadow-studio-lg z-50 animate-slide-down"
            >
              <MenuItem label="2D → 3D Reconstruction" shortcut="Ctrl+R" icon={<Brain />} onClick={() => setReconstructMenuOpen(true)} />
              <MenuSeparator />
              <MenuItem label="Physics Simulation" icon={<Zap />} onClick={() => {}} />
              <MenuItem label="Interior Generator" icon={<Box />} onClick={() => {}} />
              <MenuItem label="Predictive Enhancer" icon={<Brain />} onClick={() => {}} />
              <MenuItem label="UV Unwrapper" icon={<Layers />} onClick={() => {}} />
              <MenuSeparator />
              <MenuItem label="Measure Tool" icon={<Zap />} onClick={() => setActiveTool('measure')} />
              <MenuItem label="Annotation Tool" icon={<Brain />} onClick={() => setActiveTool('annotate')} />
            </motion.div>
          )}
        </AnimatePresence>

        <MenuBarItem label="Window" open={windowMenuOpen} onClick={() => setWindowMenuOpen(!windowMenuOpen)}>
          <Smartphone className="w-4 h-4" />
        </MenuBarItem>
        <AnimatePresence>
          {windowMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-9 left-170 studio-panel-elevated min-w-[200px] py-1 shadow-studio-lg z-50 animate-slide-down"
            >
              <MenuItem label="Reset Layout" icon={<Box />} onClick={() => {}} />
              <MenuSeparator />
              <MenuItem label="Viewport" icon={<Monitor />} onClick={() => {}} checked />
              <MenuItem label="Scene Outliner" icon={<Layers />} onClick={() => {}} checked />
              <MenuItem label="Properties" icon={<Settings />} onClick={() => {}} checked />
              <MenuItem label="Node Editor" icon={<Brain />} onClick={() => {}} checked />
              <MenuItem label="Console" icon={<Zap />} onClick={() => {}} checked />
              <MenuItem label="Asset Browser" icon={<FolderOpen />} onClick={() => {}} checked />
            </motion.div>
          )}
        </AnimatePresence>

        <MenuBarItem label="Help" open={helpMenuOpen} onClick={() => setHelpMenuOpen(!helpMenuOpen)}>
          <HelpCircle className="w-4 h-4" />
        </MenuBarItem>
        <AnimatePresence>
          {helpMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-9 right-3 studio-panel-elevated min-w-[200px] py-1 shadow-studio-lg z-50 animate-slide-down"
            >
              <MenuItem label="Documentation" icon={<HelpCircle />} onClick={() => window.open('https://github.com/chris100809/reina-del-sazon')} />
              <MenuItem label="Keyboard Shortcuts" icon={<Zap />} onClick={() => {}} />
              <MenuItem label="Report Issue" icon={<GitBranch />} onClick={() => window.open('https://github.com/chris100809/reina-del-sazon/issues')} />
              <MenuSeparator />
              <MenuItem label="About Reina del Sazón" icon={<HelpCircle />} onClick={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <SceneStats />
        <div className="w-px h-6 bg-studio-border mx-2" />
        <RenderStats />
      </div>
    </div>
  );
}

function MenuBarItem({ label, open, onClick, children }: { label: string; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
        open
          ? 'bg-studio-cyan/10 text-studio-cyan'
          : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover'
      )}
    >
      {children}
      <span>{label}</span>
      <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
    </button>
  );
}

function MenuItem({ label, shortcut, icon, onClick, disabled, checked }: { label: string; shortcut?: string; icon: React.ReactNode | null; onClick: () => void; disabled?: boolean; checked?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-studio-text',
        'hover:bg-studio-panel-hover transition-colors duration-100',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
      {checked && <span className="text-studio-cyan">✓</span>}
      {shortcut && <span className="text-studio-text-muted text-xs font-mono">{shortcut}</span>}
    </button>
  );
}

function MenuSeparator() {
  return <div className="h-px bg-studio-border my-1" />;
}

function SceneStats() {
  const { scene } = useStudioStore();
  const objectCount = scene.objects.size;
  const selectedCount = scene.selection.size;

  return (
    <div className="flex items-center gap-3 text-xs text-studio-text-muted">
      <span className="flex items-center gap-1">
        <Layers className="w-3 h-3" />
        {objectCount} objects
      </span>
      {selectedCount > 0 && (
        <span className="flex items-center gap-1 text-studio-cyan">
          <Zap className="w-3 h-3" />
          {selectedCount} selected
        </span>
      )}
    </div>
  );
}

function RenderStats() {
  const { renderStats } = useViewportStore();

  return (
    <div className="flex items-center gap-3 text-xs text-studio-text-muted font-mono">
      <span>{renderStats.fps} FPS</span>
      <span className="text-studio-border">|</span>
      <span>{renderStats.triangles.toLocaleString()} tris</span>
      <span className="text-studio-border">|</span>
      <span>{renderStats.drawCalls} draws</span>
      <span className="text-studio-border">|</span>
      <span>{(renderStats.memory / 1024 / 1024).toFixed(1)} MB</span>
    </div>
  );
}