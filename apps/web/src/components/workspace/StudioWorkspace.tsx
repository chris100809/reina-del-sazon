'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  Panel,
  PanelGroup,
  PanelResizeHandle,
  PanelLayout,
} from '@/components/ui/PanelSystem';
import { Viewport3D } from '@/components/viewport/Viewport3D';
import { SceneOutliner } from '@/components/panels/SceneOutliner';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { NodeEditor } from '@/components/nodes/NodeEditor';
import { ConsolePanel } from '@/components/panels/ConsolePanel';
import { AssetBrowser } from '@/components/panels/AssetBrowser';
import { TopBar } from '@/components/ui/TopBar';
import { StatusBar } from '@/components/ui/StatusBar';
import { useStudioStore } from '@/hooks/useStudioStore';
import { cn } from '@/lib/utils';

const DEFAULT_LAYOUT: PanelLayout[] = [
  { id: 'viewport', type: 'viewport', position: { x: 0, y: 0, width: 0, height: 0 }, tabIndex: 0, visible: true, collapsed: false },
  { id: 'outliner', type: 'outliner', position: { x: 0, y: 0, width: 280, height: 0 }, tabIndex: 0, visible: true, collapsed: false },
  { id: 'properties', type: 'properties', position: { x: 0, y: 0, width: 320, height: 0 }, tabIndex: 0, visible: true, collapsed: false },
  { id: 'nodes', type: 'nodes', position: { x: 0, y: 0, width: 0, height: 300 }, tabIndex: 0, visible: true, collapsed: false },
  { id: 'console', type: 'console', position: { x: 0, y: 0, width: 0, height: 200 }, tabIndex: 1, visible: true, collapsed: false },
  { id: 'assets', type: 'assetBrowser', position: { x: 0, y: 0, width: 0, height: 300 }, tabIndex: 1, visible: true, collapsed: false },
];

export function StudioWorkspace() {
  const [layout, setLayout] = useState<PanelLayout[]>(DEFAULT_LAYOUT);
  const { activePanel, setActivePanel } = useStudioStore();
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleLayoutChange = useCallback((newLayout: PanelLayout[]) => {
    setLayout(newLayout);
  }, []);

  const getPanelProps = (panelId: string) => {
    const panelLayout = layout.find(p => p.id === panelId);
    return {
      defaultSize: panelLayout?.position.width || panelLayout?.position.height,
      minSize: panelLayout?.type === 'viewport' ? 300 : 200,
      maxSize: panelLayout?.type === 'viewport' ? '100%' : 500,
      collapsed: panelLayout?.collapsed,
      onCollapse: () => setLayout(l => l.map(p => p.id === panelId ? { ...p, collapsed: !p.collapsed } : p)),
    };
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" ref={workspaceRef}>
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal" onLayoutChange={handleLayoutChange}>
          {/* Left Sidebar - Outliner */}
          <Panel {...getPanelProps('outliner')} order={0}>
            <SceneOutliner />
          </Panel>
          <PanelResizeHandle className="bg-studio-border hover:bg-studio-cyan/30" hitAreaMargins={8} />

          {/* Center - Viewport */}
          <Panel {...getPanelProps('viewport')} order={1}>
            <Viewport3D />
          </Panel>
          <PanelResizeHandle className="bg-studio-border hover:bg-studio-cyan/30" hitAreaMargins={8} />

          {/* Right Sidebar - Properties & Node Editor */}
          <PanelGroup direction="vertical" style={{ flex: 1, minWidth: 320 }}>
            <Panel {...getPanelProps('properties')} order={0}>
              <PropertiesPanel />
            </Panel>
            <PanelResizeHandle className="bg-studio-border hover:bg-studio-cyan/30" hitAreaMargins={8} />
            
            <Panel {...getPanelProps('nodes')} order={1}>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-studio-border bg-studio-bg-elevated/50">
                  <h3 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider">
                    Shader Nodes
                  </h3>
                </div>
                <div className="flex-1">
                  <NodeEditor />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </PanelGroup>
      </div>

      {/* Bottom Panels - Console, Assets */}
      <PanelGroup direction="horizontal" className="h-[300px] border-t border-studio-border" onLayoutChange={handleLayoutChange}>
        <Panel {...getPanelProps('console')} order={0}>
          <ConsolePanel />
        </Panel>
        <PanelResizeHandle className="bg-studio-border hover:bg-studio-cyan/30" hitAreaMargins={8} />
        <Panel {...getPanelProps('assets')} order={1}>
          <AssetBrowser />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  );
}