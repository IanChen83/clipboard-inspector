import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Info, FileText, Image as ImageIcon, FileCode2, FileJson, File as FileIcon, X } from 'lucide-react';
import { ClipboardItemView } from './components/ClipboardItemView';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Switch } from './components/ui/switch';
import { Input } from './components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from './components/ui/tooltip';

interface ParsedItem {
  id: string;
  type: string;
  kind: string;
  data: string | Blob;
}

interface ClipboardEventData {
  id: string;
  timestamp: Date;
  source: 'paste' | 'drop';
  items: ParsedItem[];
  files: File[];
}

export default function App() {
  const [events, setEvents] = useState<ClipboardEventData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);

  const processDataTransfer = useCallback(async (
    dt: DataTransfer | null,
    source: 'paste' | 'drop'
  ) => {
    if (!dt) return;

    const newEvent: ClipboardEventData = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      source,
      items: [],
      files: Array.from(dt.files),
    };

    // Process items
    const promises = Array.from(dt.items).map(async (item) => {
      const type = item.type;
      const kind = item.kind;

      if (kind === 'string') {
        return new Promise<ParsedItem>((resolve) => {
          item.getAsString((str) => {
            resolve({
              id: Math.random().toString(36).substring(7),
              type,
              kind,
              data: str,
            });
          });
        });
      } else if (kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          return {
            id: Math.random().toString(36).substring(7),
            type,
            kind,
            data: file as Blob,
          };
        }
      }
      return null;
    });

    const processedItems = (await Promise.all(promises)).filter(Boolean) as ParsedItem[];
    newEvent.items = processedItems;

    setEvents((prev) => {
      const newEvents = isHistoryEnabled ? [newEvent, ...prev] : [newEvent];
      setActiveTab(newEvent.id);
      return newEvents;
    });
  }, [isHistoryEnabled]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    processDataTransfer(e.clipboardData, 'paste');
  }, [processDataTransfer]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processDataTransfer(e.dataTransfer, 'drop');
  }, [processDataTransfer]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleToggleHistory = (enabled: boolean) => {
    setIsHistoryEnabled(enabled);
    if (!enabled) {
      setEvents((prev) => {
        if (prev.length > 1) {
          const newEvents = [prev[0]];
          setActiveTab(newEvents[0].id);
          return newEvents;
        }
        return prev;
      });
    }
  };

  const clearEvents = () => {
    setEvents([]);
    setActiveTab('');
  };

  const removeEvent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEvents((prev) => {
      const newEvents = prev.filter(event => event.id !== id);
      if (activeTab === id) {
        setActiveTab(newEvents.length > 0 ? newEvents[0].id : '');
      }
      return newEvents;
    });
  };

  const getIconForType = (type: string) => {
    if (type.includes('json')) return <FileJson size={16} className="text-blue-500" />;
    if (type.includes('html') || type.includes('xml')) return <FileCode2 size={16} className="text-purple-500" />;
    if (type.startsWith('image/')) return <ImageIcon size={16} className="text-green-500" />;
    if (type.startsWith('text/')) return <FileText size={16} className="text-gray-500" />;
    return <Info size={16} className="text-gray-400" />;
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans flex flex-col relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <h2 className="text-4xl font-bold text-white drop-shadow-md">Drop to inspect</h2>
        </div>
      )}

      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Clipboard Inspector</h1>
          </div>
        </div>
      </header>

      <main className={`max-w-6xl mx-auto px-4 py-8 flex-1 w-full ${events.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}>
        {events.length === 0 ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center text-muted-foreground p-12">
            <p className="text-center max-w-md mb-6">
              Paste with <kbd className="px-2 py-1 bg-muted border rounded text-xs font-mono text-foreground">Ctrl+V</kbd> / <kbd className="px-2 py-1 bg-muted border rounded text-xs font-mono text-foreground">⌘V</kbd>, or drop files to inspect the contents.
            </p>
            <Input
              type="text"
              placeholder="Tap here to paste on mobile"
              className="max-w-xs text-center"
              value=""
              onChange={() => {}}
            />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 shrink-0">
              <div className="flex items-center mb-2 mt-2 gap-2">
                <div className="flex gap-2 flex-1">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">History</h3>
                  <Tooltip>
                    <TooltipTrigger style={{ lineHeight: 1 }} render={<div />}>
                      <Switch
                        checked={isHistoryEnabled}
                        onCheckedChange={handleToggleHistory}
                        aria-label="Toggle history"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isHistoryEnabled ? "History is enabled" : "History is disabled"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {events.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={clearEvents} className="h-6 w-6" />}>
                      <Trash2 size={14} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear History</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {events.map((event, index) => (
                  <button
                    key={event.id}
                    onClick={() => setActiveTab(event.id)}
                    className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                      activeTab === event.id
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-card border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">Event #{events.length - index}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">
                          {event.source}
                        </Badge>
                        <div
                          onClick={(e) => removeEvent(e, event.id)}
                          className="text-muted-foreground hover:text-destructive rounded-full p-0.5 hover:bg-muted transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex gap-2">
                      <span>{event.items.length} items</span>
                      {event.files.length > 0 && <span>• {event.files.length} files</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{ display: activeTab === event.id ? 'block' : 'none' }}
                >
                  <Card>
                    <CardContent className="p-0">
                      {event.items.length === 0 ? (
                        <div className="text-muted-foreground text-sm italic p-6">No items found in this event.</div>
                      ) : (
                        <div className="flex flex-col divide-y">
                          {event.items.map((item) => (
                            <div key={item.id} className="flex flex-col">
                              <div className="bg-muted/30 px-4 py-2 border-b flex items-center gap-3">
                                {getIconForType(item.type)}
                                <span className="font-mono text-sm font-medium">
                                  {item.type}
                                </span>
                              </div>
                              <div className="bg-card">
                                <ClipboardItemView type={item.type} data={item.data} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {event.files.length > 0 && (
                        <div className="p-6 border-t">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Files ({event.files.length})
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {event.files.map((file, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
                                <div className="p-2 bg-muted rounded text-muted-foreground">
                                  <FileIcon size={20} />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="text-sm font-medium truncate" title={file.name}>
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex gap-2">
                                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    <span>•</span>
                                    <span className="truncate">{file.type || 'unknown type'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
