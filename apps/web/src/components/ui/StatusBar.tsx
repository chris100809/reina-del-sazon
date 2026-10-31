'use client';

import { useStudioStore } from '@/hooks/useStudioStore';
import { useViewportStore } from '@/hooks/useViewportStore';
import { Wifi, Cpu, MemoryStick, HardDrive, Globe, Zap, Box, Layers, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatusBar() {
  const { scene } = useStudioStore();
  const { renderStats, gizmo, shading } = useViewportStore();

  return (
    <div className="h-6 bg-studio-bg-elevated/80 backdrop-blur-studio border-t border-studio-border flex items-center gap-4 px-3 text-xs text-studio-text-muted">
      <div className="flex items-center gap-3">
        <StatusItem label="Ready" icon={<Zap className="w-3 h-3 text-studio-emerald" />} />
        <StatusItem label={`Objects: ${scene.objects.size}`} icon={<Box className="w-3 h-3" />} />
        <StatusItem label={`Selected: ${scene.selection.size}`} icon={<Layers className="w-3 h-3" />} />
        <StatusItem label={shading.charAt(0).toUpperCase() + shading.slice(1)} icon={<Zap className="w-3 h-3" />} />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <StatusItem label={`${renderStats.fps} FPS`} icon={<Cpu className="w-3 h-3" />} />
        <StatusItem label={`${renderStats.triangles.toLocaleString()} tris`} icon={<Box className="w-3 h-3" />} />
        <StatusItem label={`${renderStats.drawCalls} draws`} icon={<GitBranch className="w-3 h-3" />} />
        <StatusItem label={`${(renderStats.memory / 1024 / 1024).toFixed(1)} MB`} icon={<MemoryStick className="w-3 h-3" />} />
      </div>

      <div className="flex items-center gap-2 px-2 py-1 rounded bg-studio-bg border border-studio-border">
        <span className="text-studio-text-muted">Gizmo:</span>
        <span className="text-studio-cyan capitalize">{gizmo.mode}</span>
        <span className="text-studio-border mx-1">|</span>
        <span className="text-studio-text-muted">{gizmo.space}</span>
        {gizmo.snap && (
          <>
            <span className="text-studio-border mx-1">|</span>
            <span className="text-studio-amber">Snap: {gizmo.snapIncrement}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-2 py-1 rounded bg-studio-bg border border-studio-border">
        <span className="text-studio-text-muted">Units:</span>
        <span className="text-studio-text">{scene.units}</span>
        <span className="text-studio-border mx-1">|</span>
        <span className="text-studio-text-muted">Up:</span>
        <span className="text-studio-text">{scene.upAxis}</span>
      </div>
    </div>
  );
}

function StatusItem({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span>{label}</span>
    </div>
  );
}