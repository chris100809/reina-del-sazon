'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, FileImage, File3D, FileCode, FileMusic, FileVideo, Search, Grid, List, ChevronRight, ChevronDown, Upload, Download, Trash2, Copy, MoreVertical, Star, Heart, Tag, Zap, Cube, Image, Music, Video, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'material' | 'shader' | 'script' | 'audio' | 'video' | 'image' | 'folder';
  path: string;
  size?: number;
  modified?: Date;
  tags?: string[];
  favorite?: boolean;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

const mockAssets: Asset[] = [
  { id: '1', name: 'Models', type: 'folder', path: '/Models', modified: new Date() },
  { id: '2', name: 'Textures', type: 'folder', path: '/Textures', modified: new Date() },
  { id: '3', name: 'Materials', type: 'folder', path: '/Materials', modified: new Date() },
  { id: '4', name: 'Shaders', type: 'folder', path: '/Shaders', modified: new Date() },
  { id: '5', name: 'Scripts', type: 'folder', path: '/Scripts', modified: new Date() },
  { id: '6', name: 'car.fbx', type: 'model', path: '/Models/car.fbx', size: 2048576, modified: new Date('2024-01-15'), tags: ['vehicle', 'fbx'] },
  { id: '7', name: 'building.glb', type: 'model', path: '/Models/building.glb', size: 5242880, modified: new Date('2024-01-10'), tags: ['architecture', 'glb'] },
  { id: '8', name: 'metal_roughness.png', type: 'texture', path: '/Textures/metal_roughness.png', size: 1048576, modified: new Date('2024-01-12'), tags: ['pbr', 'metal'] },
  { id: '9', name: 'concrete_diffuse.jpg', type: 'texture', path: '/Textures/concrete_diffuse.jpg', size: 2097152, modified: new Date('2024-01-08'), tags: ['pbr', 'concrete'] },
  { id: '10', name: 'car_paint.mat', type: 'material', path: '/Materials/car_paint.mat', modified: new Date('2024-01-14'), tags: ['pbr', 'metallic'] },
  { id: '11', name: 'glass.mat', type: 'material', path: '/Materials/glass.mat', modified: new Date('2024-01-13'), tags: ['transmission', 'glass'] },
  { id: '12', name: 'pbr_shader.glsl', type: 'shader', path: '/Shaders/pbr_shader.glsl', size: 8192, modified: new Date('2024-01-11'), tags: ['glsl', 'pbr'] },
  { id: '13', name: 'vehicle_controller.ts', type: 'script', path: '/Scripts/vehicle_controller.ts', size: 4096, modified: new Date('2024-01-09'), tags: ['typescript', 'physics'] },
];

export function AssetBrowser() {
  const [currentPath, setCurrentPath] = useState('/');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'size' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentAssets = useMemo(() => {
    let assets = mockAssets.filter(a => {
      const parentPath = a.path.substring(0, a.path.lastIndexOf('/')) || '/';
      return parentPath === currentPath;
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      assets = assets.filter(a => a.name.toLowerCase().includes(query) || a.tags?.some(t => t.toLowerCase().includes(query)));
    }

    assets.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === undefined || bVal === undefined) return 0;
      const cmp = aVal > bVal ? 1 : -1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return assets;
  }, [currentPath, searchQuery, sortBy, sortOrder]);

  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'Root', path: '/' }];
    let current = '';
    parts.forEach(part => {
      current += `/${part}`;
      crumbs.push({ name: part, path: current });
    });
    return crumbs;
  }, [currentPath]);

  const navigate = (path: string) => setCurrentPath(path);
  const navigateUp = () => {
    if (currentPath !== '/') {
      const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
      setCurrentPath(parent);
    }
  };

  const getIcon = (type: Asset['type']) => {
    switch (type) {
      case 'folder': return <FolderOpen className="w-5 h-5 text-studio-amber" />;
      case 'model': return <Cube className="w-5 h-5 text-studio-cyan" />;
      case 'texture':
      case 'image': return <Image className="w-5 h-5 text-studio-emerald" />;
      case 'material': return <Zap className="w-5 h-5 text-studio-magenta" />;
      case 'shader': return <Code className="w-5 h-5 text-studio-amber" />;
      case 'script': return <Code className="w-5 h-5 text-studio-cyan" />;
      case 'audio': return <Music className="w-5 h-5 text-studio-emerald" />;
      case 'video': return <Video className="w-5 h-5 text-studio-magenta" />;
      default: return <FileImage className="w-5 h-5" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full studio-panel-elevated">
      <div className="flex items-center gap-2 p-2 border-b border-studio-border">
        <h2 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider flex-1">Assets</h2>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="Upload" onClick={() => {}}>
            <Upload className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="New Folder" onClick={() => {}}>
            <FolderOpen className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-studio-border mx-1" />
          <button className={cn('p-1.5 rounded hover:bg-studio-border transition-colors', viewMode === 'grid' && 'bg-studio-cyan/10 text-studio-cyan')} onClick={() => setViewMode('grid')}>
            <Grid className="w-4 h-4" />
          </button>
          <button className={cn('p-1.5 rounded hover:bg-studio-border transition-colors', viewMode === 'list' && 'bg-studio-cyan/10 text-studio-cyan')} onClick={() => setViewMode('list')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-1 border-b border-studio-border bg-studio-bg/50">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button className="p-1 rounded hover:bg-studio-border transition-colors" onClick={navigateUp} title="Up">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1 text-xs">
              {i > 0 && <ChevronRight className="w-3 h-3 text-studio-text-muted" />}
              <button
                onClick={() => navigate(crumb.path)}
                className={cn('px-1.5 py-0.5 rounded hover:bg-studio-panel-hover transition-colors', i === breadcrumbs.length - 1 && 'text-studio-cyan font-medium')}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-studio-text-muted" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="studio-input pl-8 text-xs py-1 w-48"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-fill gap-2">
            {currentAssets.map(asset => (
              <AssetGridItem
                key={asset.id}
                asset={asset}
                selected={selectedAssets.has(asset.id)}
                onClick={(e) => handleSelect(asset.id, e)}
                onDoubleClick={() => handleDoubleClick(asset)}
                onContextMenu={(e) => handleContextMenu(asset, e)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {currentAssets.map(asset => (
              <AssetListItem
                key={asset.id}
                asset={asset}
                selected={selectedAssets.has(asset.id)}
                onClick={(e) => handleSelect(asset.id, e)}
                onDoubleClick={() => handleDoubleClick(asset)}
                onContextMenu={(e) => handleContextMenu(asset, e)}
              />
            ))}
          </div>
        )}

        {currentAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-studio-text-muted gap-2">
            <FolderOpen className="w-12 h-12 opacity-30" />
            <span className="text-sm">This folder is empty</span>
            <button className="studio-button-primary text-xs px-3 py-1" onClick={() => {}}>Import Assets</button>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-studio-border bg-studio-bg/50 flex items-center justify-between text-xs text-studio-text-muted">
        <span>{currentAssets.length} items</span>
        <span>{selectedAssets.size} selected</span>
      </div>
    </div>
  );
}

function AssetGridItem({ asset, selected, onClick, onDoubleClick, onContextMenu }: { asset: Asset; selected: boolean; onClick: (e: React.MouseEvent) => void; onDoubleClick: () => void; onContextMenu: (e: React.MouseEvent) => void }) {
  const getIcon = (type: Asset['type']) => {
    switch (type) {
      case 'folder': return <FolderOpen className="w-10 h-10 text-studio-amber" />;
      case 'model': return <Cube className="w-10 h-10 text-studio-cyan" />;
      case 'texture':
      case 'image': return <Image className="w-10 h-10 text-studio-emerald" />;
      case 'material': return <Zap className="w-10 h-10 text-studio-magenta" />;
      case 'shader': return <Code className="w-10 h-10 text-studio-amber" />;
      case 'script': return <Code className="w-10 h-10 text-studio-cyan" />;
      case 'audio': return <Music className="w-10 h-10 text-studio-emerald" />;
      case 'video': return <Video className="w-10 h-10 text-studio-magenta" />;
      default: return <FileImage className="w-10 h-10" />;
    }
  };

  return (
    <div
      className={cn(
        'relative p-2 rounded-lg border-2 transition-all duration-150 cursor-pointer',
        'hover:bg-studio-panel-hover hover:border-studio-border-active',
        selected && 'bg-studio-cyan/10 border-studio-cyan'
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-20 h-20 flex items-center justify-center rounded-lg bg-studio-bg-elevated/50 border border-studio-border/50">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover rounded" />
          ) : (
            getIcon(asset.type)
          )}
        </div>
        <div className="text-center w-full">
          <span className="text-xs font-medium text-studio-text truncate block">{asset.name}</span>
          <span className="text-xs text-studio-text-muted capitalize">{asset.type}</span>
        </div>
      </div>
      {asset.favorite && <Star className="absolute top-1 right-1 w-3 h-3 text-studio-amber fill-current" />}
      {selected && <div className="absolute inset-0 border-2 border-studio-cyan/50 rounded-lg pointer-events-none" />}
    </div>
  );
}

function AssetListItem({ asset, selected, onClick, onDoubleClick, onContextMenu }: { asset: Asset; selected: boolean; onClick: (e: React.MouseEvent) => void; onDoubleClick: () => void; onContextMenu: (e: React.MouseEvent) => void }) {
  const getIcon = (type: Asset['type']) => {
    switch (type) {
      case 'folder': return <FolderOpen className="w-4 h-4 text-studio-amber" />;
      case 'model': return <Cube className="w-4 h-4 text-studio-cyan" />;
      case 'texture':
      case 'image': return <Image className="w-4 h-4 text-studio-emerald" />;
      case 'material': return <Zap className="w-4 h-4 text-studio-magenta" />;
      case 'shader': return <Code className="w-4 h-4 text-studio-amber" />;
      case 'script': return <Code className="w-4 h-4 text-studio-cyan" />;
      case 'audio': return <Music className="w-4 h-4 text-studio-emerald" />;
      case 'video': return <Video className="w-4 h-4 text-studio-magenta" />;
      default: return <FileImage className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors duration-100 cursor-pointer',
        'hover:bg-studio-panel-hover',
        selected && 'bg-studio-cyan/10'
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded bg-studio-bg-elevated/50 border border-studio-border/50">
        {getIcon(asset.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-studio-text truncate">{asset.name}</span>
          {asset.favorite && <Star className="w-3 h-3 text-studio-amber fill-current" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-studio-text-muted">
          <span className="capitalize">{asset.type}</span>
          {asset.size && <span>• {formatSize(asset.size)}</span>}
          {asset.modified && <span>• {asset.modified.toLocaleDateString()}</span>}
        </div>
      </div>
      {asset.tags && asset.tags.length > 0 && (
        <div className="flex items-center gap-1">
          {asset.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-studio-border rounded text-studio-text-muted">{tag}</span>
          ))}
          {asset.tags.length > 3 && <span className="px-1.5 py-0.5 text-[10px] text-studio-text-muted">+{asset.tags.length - 3}</span>}
        </div>
      )}
    </div>
  );
}

function handleSelect(id: string, e: React.MouseEvent) {
  if (e.ctrlKey || e.metaKey) {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  } else if (e.shiftKey) {
    // Range select
  } else {
    setSelectedAssets(new Set([id]));
  }
}

function handleDoubleClick(asset: Asset) {
  if (asset.type === 'folder') {
    setCurrentPath(asset.path);
  }
}

function handleContextMenu(asset: Asset, e: React.MouseEvent) {
  e.preventDefault();
  // Show context menu
}

const setSelectedAssets = (fn: any) => {};
const setCurrentPath = (path: string) => {};