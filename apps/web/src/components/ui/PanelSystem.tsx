'use client';

import { forwardRef, useImperativeHandle, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Simple custom resize handle implementation
interface ResizeHandleProps {
  className?: string;
  onDrag: (size: number) => void;
  hitAreaMargins?: number;
  direction?: 'horizontal' | 'vertical';
}

function ResizeHandle({ className, onDrag, hitAreaMargins = 4, direction = 'horizontal' }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const delta = direction === 'horizontal' ? e.clientX - startX.current : e.clientY - startY.current;
    onDrag(startSize.current + delta);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn(
        'relative z-10 flex items-center justify-center select-none',
        direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        className
      )}
      onMouseDown={(e) => {
        startSize.current = 0; // Will be set by parent
        handleMouseDown(e);
      }}
    >
      <div className={cn(
        'bg-studio-border/30 hover:bg-studio-cyan/30 transition-colors duration-150 rounded-full',
        direction === 'horizontal' ? 'w-px h-16' : 'h-px w-16'
      )} />
    </div>
  );
}

export interface PanelLayout {
  id: string;
  type: string;
  position: { x: number; y: number; width: number; height: number };
  tabIndex: number;
  visible: boolean;
  collapsed: boolean;
}

export interface PanelGroupProps {
  direction: 'horizontal' | 'vertical';
  children: React.ReactNode;
  onLayoutChange?: (layout: PanelLayout[]) => void;
  style?: React.CSSProperties;
  className?: string;
}

export interface PanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number | string;
  collapsed?: boolean;
  onCollapse?: () => void;
  order?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface PanelResizeHandleProps {
  className?: string;
  hitAreaMargins?: number;
}

const PanelGroupContext = React.createContext<{
  direction: 'horizontal' | 'vertical';
  registerPanel: (id: string, size: number) => void;
  unregisterPanel: (id: string) => void;
  updatePanelSize: (id: string, size: number) => void;
  layout: PanelLayout[];
  setLayout: (layout: PanelLayout[]) => void;
} | null>(null);

export const PanelGroup = forwardRef<HTMLDivElement, PanelGroupProps>(
  ({ direction, children, onLayoutChange, style, className, ...props }, ref) => {
    const [layout, setLayoutState] = useState<PanelLayout[]>([]);
    const panelsRef = useRef<Map<string, { size: number; minSize: number; maxSize: number | string }>>(new Map());

    const registerPanel = useCallback((id: string, size: number) => {
      panelsRef.current.set(id, { size, minSize: 100, maxSize: '100%' });
      setLayoutState(prev => {
        const existing = prev.find(p => p.id === id);
        if (existing) return prev;
        return [...prev, { id, type: '', position: { x: 0, y: 0, width: size, height: size }, tabIndex: 0, visible: true, collapsed: false }];
      });
    }, []);

    const unregisterPanel = useCallback((id: string) => {
      panelsRef.current.delete(id);
      setLayoutState(prev => prev.filter(p => p.id !== id));
    }, []);

    const updatePanelSize = useCallback((id: string, size: number) => {
      const panel = panelsRef.current.get(id);
      if (panel) {
        panel.size = size;
      }
      setLayoutState(prev => prev.map(p => p.id === id ? { ...p, position: { ...p.position, [direction === 'horizontal' ? 'width' : 'height']: size } } : p));
      onLayoutChange?.(prev => prev.map(p => p.id === id ? { ...p, position: { ...p.position, [direction === 'horizontal' ? 'width' : 'height']: size } } : p));
    }, [direction, onLayoutChange]);

    const contextValue = {
      direction,
      registerPanel,
      unregisterPanel,
      updatePanelSize,
      layout,
      setLayout: setLayoutState,
    };

    return (
      <PanelGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('flex', direction === 'horizontal' ? 'flex-row' : 'flex-col', className)}
          style={style}
          {...props}
        >
          {children}
        </div>
      </PanelGroupContext.Provider>
    );
  }
);

PanelGroup.displayName = 'PanelGroup';

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ children, defaultSize = 200, minSize = 100, maxSize = '100%', collapsed = false, onCollapse, order = 0, className, style, ...props }, ref) => {
    const context = React.useContext(PanelGroupContext);
    const direction = context?.direction || 'horizontal';
    const panelIdRef = useRef(`panel-${Math.random().toString(36).substr(2, 9)}`);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const [size, setSize] = useState(defaultSize);

    useImperativeHandle(ref, () => ({
      collapse: () => setIsCollapsed(true),
      expand: () => setIsCollapsed(false),
      toggle: () => setIsCollapsed(c => !c),
      getSize: () => size,
    }));

    useEffect(() => {
      if (context) {
        context.registerPanel(panelIdRef.current, size);
        return () => context.unregisterPanel(panelIdRef.current);
      }
    }, [context]);

    const handleResize = useCallback((newSize: number) => {
      const clampedSize = Math.max(minSize, Math.min(typeof maxSize === 'number' ? maxSize : Infinity, newSize));
      setSize(clampedSize);
      context?.updatePanelSize(panelIdRef.current, clampedSize);
    }, [context, minSize, maxSize]);

    if (isCollapsed) {
      return (
        <div
          className={cn('flex-shrink-0', direction === 'horizontal' ? 'w-8' : 'h-8', className)}
          style={{ ...style, width: direction === 'horizontal' ? 32 : undefined, height: direction === 'vertical' ? 32 : undefined }}
          onClick={() => { setIsCollapsed(false); onCollapse?.(); }}
        >
          <div className="w-full h-full flex items-center justify-center bg-studio-panel-hover border border-studio-border">
            <ResizeHandle
              direction={direction}
              className={cn('bg-studio-border/50 hover:bg-studio-cyan/50 transition-colors', direction === 'horizontal' ? 'w-1 h-full' : 'h-1 w-full')}
              onDrag={handleResize}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col overflow-hidden bg-studio-panel/50 backdrop-blur-sm border border-studio-border',
          direction === 'horizontal' ? 'flex-1 min-w-0' : 'flex-1 min-h-0',
          className
        )}
        style={{
          ...style,
          flexBasis: `${size}px`,
          minWidth: direction === 'horizontal' ? `${minSize}px` : undefined,
          maxWidth: direction === 'horizontal' && typeof maxSize === 'number' ? `${maxSize}px` : undefined,
          minHeight: direction === 'vertical' ? `${minSize}px` : undefined,
          maxHeight: direction === 'vertical' && typeof maxSize === 'number' ? `${maxSize}px` : undefined,
        }}
        {...props}
      >
        <ResizeHandle
          direction={direction}
          className={cn('flex-shrink-0 z-10', direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize')}
          onDrag={handleResize}
          hitAreaMargins={8}
        >
          <div className="w-full h-full bg-transparent hover:bg-studio-cyan/10 transition-colors" />
        </ResizeHandle>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }
);

Panel.displayName = 'Panel';

function getDirection(): 'horizontal' | 'vertical' {
  const context = React.useContext(PanelGroupContext);
  return context?.direction || 'horizontal';
}

export const PanelResizeHandle = forwardRef<HTMLDivElement, PanelResizeHandleProps>(
  ({ className, hitAreaMargins = 4, ...props }, ref) => {
    const direction = getDirection();
    return (
      <ResizeHandle
        ref={ref}
        direction={direction}
        className={cn(
          'relative z-10 flex items-center justify-center select-none',
          direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
          className
        )}
        hitAreaMargins={hitAreaMargins}
        {...props}
      >
        <div className={cn(
          'bg-studio-border/30 hover:bg-studio-cyan/30 transition-colors duration-150 rounded-full',
          direction === 'horizontal' ? 'w-px h-16' : 'h-px w-16'
        )} />
      </ResizeHandle>
    );
  }
);

PanelResizeHandle.displayName = 'PanelResizeHandle';