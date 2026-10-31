'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy, Filter, Terminal, Bug, Info, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Download, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string;
  data?: any;
  collapsed?: boolean;
}

export function ConsolePanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel[]>(['debug', 'info', 'warn', 'error', 'success']);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((level: LogLevel, message: string, source?: string, data?: any) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      source,
      data,
    };
    setLogs(prev => [...prev.slice(-999), entry]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const copyLogs = useCallback(() => {
    const text = logs.map(l => `[${l.timestamp.toISOString()}] [${l.level.toUpperCase()}] ${l.source ? `[${l.source}] ` : ''}${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  }, [logs]);

  const downloadLogs = useCallback(() => {
    const text = logs.map(l => JSON.stringify(l)).join('\n');
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reina-console-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const filteredLogs = logs.filter(log => 
    filter.includes(log.level) &&
    (log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
     log.source?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoScroll]);

  const levelColors: Record<LogLevel, string> = {
    debug: '#6B7280',
    info: '#00F0FF',
    warn: '#FFB800',
    error: '#FF3366',
    success: '#00FF88',
  };

  const levelIcons: Record<LogLevel, React.ReactNode> = {
    debug: <Bug className="w-3 h-3" />,
    info: <Info className="w-3 h-3" />,
    warn: <AlertTriangle className="w-3 h-3" />,
    error: <AlertCircle className="w-3 h-3" />,
    success: <Sparkles className="w-3 h-3" />,
  };

  return (
    <div className="flex flex-col h-full studio-panel-elevated">
      <div className="flex items-center gap-2 p-2 border-b border-studio-border">
        <h2 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider flex-1">Console</h2>
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-studio-text-muted" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="studio-input pl-8 pr-8 text-xs py-1 w-48"
            />
          </div>
          <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="Filter Levels" onClick={() => {}}>
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="Clear Console" onClick={clearLogs}>
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="Copy Logs" onClick={copyLogs}>
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-studio-border transition-colors" title="Download Logs" onClick={downloadLogs}>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-1 border-b border-studio-border bg-studio-bg/50">
        {(['debug', 'info', 'warn', 'error', 'success'] as LogLevel[]).map(level => (
          <label key={level} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.includes(level)}
              onChange={e => setFilter(prev => e.target.checked ? [...prev, level] : prev.filter(f => f !== level))}
              className="w-4 h-4 accent-studio-cyan rounded border-studio-border bg-studio-bg"
            />
            <span className="text-xs" style={{ color: levelColors[level] }}>{levelIcons[level]}</span>
            <span className="text-xs capitalize">{level}</span>
          </label>
        ))}
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.target.checked)}
            className="w-4 h-4 accent-studio-cyan rounded border-studio-border bg-studio-bg"
          />
          Auto-scroll
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-2" ref={containerRef}>
        <AnimatePresence>
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="group"
            >
              <LogEntry
                log={log}
                levelColors={levelColors}
                levelIcons={levelIcons}
                collapsedGroups={collapsedGroups}
                setCollapsedGroups={setCollapsedGroups}
              />
            </motion.div>
          ))}
          <div ref={logEndRef} />
        </AnimatePresence>
      </div>

      <div className="p-2 border-t border-studio-border bg-studio-bg/50">
        <CommandInput onSubmit={handleCommand} />
      </div>
    </div>
  );
}

function LogEntry({ log, levelColors, levelIcons, collapsedGroups, setCollapsedGroups }: { log: LogEntry; levelColors: any; levelIcons: any; collapsedGroups: Set<string>; setCollapsedGroups: React.Dispatch<React.SetStateAction<Set<string>>> }) {
  const hasData = log.data !== undefined;
  const isCollapsed = collapsedGroups.has(log.id);

  return (
    <div className="flex flex-col gap-1" style={{ borderLeft: `2px solid ${levelColors[log.level]}` }}>
      <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-studio-panel-hover rounded-r-md">
        <span className="text-xs text-studio-text-muted font-mono w-20 shrink-0">
          {log.timestamp.toLocaleTimeString()}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
        </span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${levelColors[log.level]}20`, color: levelColors[log.level] }}>
          {log.level.toUpperCase()}
        </span>
        {log.source && (
          <span className="text-xs text-studio-text-muted px-1.5 py-0.5 rounded bg-studio-bg">[{log.source}]</span>
        )}
        <span className="flex-1 text-xs text-studio-text break-all">{log.message}</span>
        {hasData && (
          <button
            onClick={() => setCollapsedGroups(prev => {
              const next = new Set(prev);
              if (next.has(log.id)) next.delete(log.id);
              else next.add(log.id);
              return next;
            })}
            className="p-1 rounded hover:bg-studio-border transition-colors"
          >
            <ChevronDown className={cn('w-3 h-3 transition-transform', isCollapsed && 'rotate-180')} style={{ color: levelColors[log.level] }} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {hasData && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-10 pr-2 pb-2 text-xs text-studio-text-muted font-mono bg-studio-bg/50 rounded-r-md border-r-2"
            style={{ borderColor: levelColors[log.level] }}
          >
            <pre>{JSON.stringify(log.data, null, 2)}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommandInput({ onSubmit }: { onSubmit: (cmd: string) => void }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        onSubmit(input.trim());
        setHistory(prev => [input.trim(), ...prev.slice(0, 99)]);
        setInput('');
        setHistoryIndex(-1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        setHistoryIndex(prev => prev + 1);
        setInput(history[historyIndex + 1]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        setHistoryIndex(prev => prev - 1);
        setInput(history[historyIndex - 1]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-studio-cyan text-xs font-mono">></span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 studio-input bg-studio-bg text-studio-text text-xs"
        placeholder="Enter command... (help for commands)"
        autoFocus
      />
    </div>
  );
}

function handleCommand(cmd: string) {
  const [command, ...args] = cmd.split(' ');
  console.log('Command:', command, args);
}

const updateObject = (id: string, updates: any) => {};