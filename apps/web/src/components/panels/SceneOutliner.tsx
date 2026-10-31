'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, EyeOff, MousePointer, Lock, Unlock, Plus, Minus, FolderOpen, FolderClosed, Cube, Camera, Lightbulb, MoreVertical, ChevronRight, ChevronDown, Copy, Trash2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/hooks/useStudioStore';

export function SceneOutliner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { scene, selectObject, selectObjects, clearSelection, deleteObject, duplicateObject, addObject } = useStudioStore();

  const rootObjects = useMemo(() => {
    return scene.rootObjectIds
      .map(id => scene.objects.get(id))
      .filter(Boolean) as SceneObject[];
  }, [scene.rootObjectIds, scene.objects]);

  const filteredObjects = useMemo(() => {
    if (!searchQuery) return rootObjects;
    const query = searchQuery.toLowerCase();
    const matches = new Set<string>();

    const checkObject = (obj: SceneObject): boolean => {
      const nameMatch = obj.name.toLowerCase().includes(query);
      const childrenMatch = obj.childrenIds.some(id => {
        const child = scene.objects.get(id);
        return child ? checkObject(child) : false;
      });
      if (nameMatch || childrenMatch) {
        matches.add(obj.id);
        return true;
      }
      return false;
    };

    rootObjects.forEach(checkObject);
    return rootObjects.filter(obj => matches.has(obj.id));
  }, [rootObjects, searchQuery, scene.objects]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) => expandedIds.has(id);
  const isSelected = (id: string) => scene.selection.has(id);
  const isLocked = (id: string) => scene.objects.get(id)?.locked;
  const isVisible = (id: string) => scene.objects.get(id)?.visible;

  const getIcon = (type: SceneObject['type']) => {
    switch (type) {
      case 'mesh': return <Cube className="w-4 h-4" />;
      case 'camera': return <Camera className="w-4 h-4" />;
      case 'light': return <Lightbulb className="w-4 h-4" />;
      case 'group': return <FolderOpen className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const renderObject = (obj: SceneObject, depth = 0) => {
    const hasChildren = obj.childrenIds.length > 0;
    const expanded = isExpanded(obj.id);
    const selected = isSelected(obj.id);
    const locked = isLocked(obj.id);
    const visible = isVisible(obj.id);

    return (
      <div key={obj.id}>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors duration-100',
            'hover:bg-studio-panel-hover',
            selected && 'bg-studio-cyan/10 text-studio-cyan',
            !selected && 'text-studio-text'
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={(e) => {
            e.stopPropagation();
            if (e.shiftKey) {
              selectObject(obj.id, true);
            } else if (e.ctrlKey || e.metaKey) {
              selectObject(obj.id, true);
            } else {
              selectObject(obj.id);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpand(obj.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            selectObject(obj.id);
            // Show context menu
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(obj.id); }}
              className="p-0.5 rounded hover:bg-studio-border transition-colors"
            >
              <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <button
            onClick={(e) => { e.stopPropagation(); }}
            className={cn('p-0.5 rounded hover:bg-studio-border transition-colors', !visible && 'opacity-50')}
            title={visible ? 'Hide' : 'Show'}
          >
            {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); }}
            className={cn('p-0.5 rounded hover:bg-studio-border transition-colors', locked && 'text-studio-amber')}
            title={locked ? 'Unlock' : 'Lock'}
          >
            {locked ? <Lock className="w-3 h-3" /> : <MousePointer className="w-3 h-3 opacity-50" />}
          </button>

          {getIcon(obj.type)}

          <span className="flex-1 truncate text-sm">{obj.name}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }} className="p-1 rounded hover:bg-studio-border transition-colors" title="Duplicate">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }} className="p-1 rounded hover:bg-studio-border hover:text-studio-error transition-colors" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); }} className="p-1 rounded hover:bg-studio-border transition-colors" title="More">
              <MoreVertical className="w-3 h-3" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {obj.childrenIds.map(childId => {
                const child = scene.objects.get(childId);
                return child ? renderObject(child, depth + 1) : null;
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full studio-panel-elevated">
      <div className="flex items-center gap-2 p-2 border-b border-studio-border">
        <h2 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider flex-1">Scene Outliner</h2>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-studio-text-muted" />
          <input
            type="text"
            placeholder="Search objects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="studio-input pl-8 text-xs py-1.5"
          />
        </div>
        <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="Add Object">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {filteredObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-studio-text-muted gap-2">
            <Cube className="w-12 h-12 opacity-30" />
            <span className="text-sm">No objects in scene</span>
            <button className="studio-button-primary text-xs px-3 py-1" onClick={() => addObject({ id: 'cube-1', name: 'Cube', type: 'mesh', transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } }, visible: true, selectable: true, locked: false, parentId: null, childrenIds: [], geometryId: null, materialIds: [], physicsBodyId: null, customProperties: {} })}>
              Add Cube
            </button>
          </div>
        ) : (
          filteredObjects.map(obj => renderObject(obj))
        )}
      </div>
    </div>
  );
}

interface SceneObject {
  id: string;
  name: string;
  type: 'mesh' | 'camera' | 'light' | 'empty' | 'group' | 'armature' | 'curve' | 'surface' | 'metaball' | 'font' | 'volume';
  transform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number; w: number }; scale: { x: number; y: number; z: number } };
  visible: boolean;
  selectable: boolean;
  locked: boolean;
  parentId: string | null;
  childrenIds: string[];
  geometryId: string | null;
  materialIds: string[];
  physicsBodyId: string | null;
  customProperties: Record<string, unknown>;
}