import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Folder, 
  FileText, 
  MessageSquare, 
  AlertCircle, 
  Calendar, 
  CornerDownLeft,
  X,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';

interface SearchResultItem {
  id: string;
  title: string;
  type: 'task' | 'project' | 'comment' | 'blocker' | 'standup';
  key?: string;
  subtitle?: string;
  linkUrl: string;
}

export const GlobalSearchBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [results, setResults] = useState<any>({
    tasks: [],
    projects: [],
    comments: [],
    blockers: [],
    standups: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // CMD+K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSuggestions([]);
      setResults({ tasks: [], projects: [], comments: [], blockers: [], standups: [] });
    }
  }, [isOpen]);

  // Fetch suggestions and global search results as the user types
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setResults({ tasks: [], projects: [], comments: [], blockers: [], standups: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Fetch Suggestions
        const suggRes = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
        setSuggestions(suggRes.data);

        // Fetch Full Results
        const globalRes = await api.get(`/search/global?q=${encodeURIComponent(query)}`);
        setResults(globalRes.data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Flattened items list for keyboard navigation
  const flatItems: SearchResultItem[] = [];

  results.projects.forEach((p: any) => {
    flatItems.push({
      id: p.id,
      title: p.name,
      type: 'project',
      key: p.key,
      subtitle: p.description || '',
      linkUrl: `/dashboard/projects/${p.id}`
    });
  });

  results.tasks.forEach((t: any) => {
    flatItems.push({
      id: t.id,
      title: t.title,
      type: 'task',
      key: t.key,
      subtitle: `Status: ${t.status} | Priority: ${t.priority}`,
      linkUrl: `/dashboard/boards` // In SprintOS, opening board allows details viewing
    });
  });

  results.comments.forEach((c: any) => {
    flatItems.push({
      id: c.id,
      title: c.content.substring(0, 60) + (c.content.length > 60 ? '...' : ''),
      type: 'comment',
      subtitle: `On task: ${c.task?.title} (${c.task?.key}) by ${c.user?.name}`,
      linkUrl: `/dashboard/boards`
    });
  });

  results.blockers.forEach((b: any) => {
    flatItems.push({
      id: b.id,
      title: b.description,
      type: 'blocker',
      subtitle: `On task: ${b.task?.title} | Severity: ${b.severity}`,
      linkUrl: `/dashboard/boards`
    });
  });

  results.standups.forEach((s: any) => {
    flatItems.push({
      id: s.id,
      title: `Standup - ${new Date(s.date).toLocaleDateString()}`,
      type: 'standup',
      subtitle: `Today: ${s.today.substring(0, 60)}... by ${s.user?.name}`,
      linkUrl: `/dashboard/standups`
    });
  });

  // Handle Keyboard Navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = flatItems[activeIndex];
      if (selectedItem) {
        handleNavigate(selectedItem);
      }
    }
  };

  const handleNavigate = (item: SearchResultItem) => {
    setIsOpen(false);
    navigate(item.linkUrl);
  };

  // Close when clicking outside modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'project': return <Folder className="w-4 h-4 text-emerald-500" />;
      case 'task': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'blocker': return <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'standup': return <Calendar className="w-4 h-4 text-amber-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Trigger Input in Header */}
      <div className="flex-1 max-w-lg cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="relative flex items-center bg-muted/40 border border-border/40 hover:border-border/80 rounded-xl px-3 py-2 w-full transition-all">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground select-none flex-grow">
            Search projects, tasks, blockers...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 bg-muted border border-border px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-mono">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Glassmorphism Modal overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-center pt-24 px-4 overflow-y-auto"
          onClick={handleOverlayClick}
        >
          <div 
            ref={modalRef}
            className="bg-zinc-950/95 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[500px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
            onKeyDown={handleKeyDown}
          >
            {/* Input box */}
            <div className="flex items-center border-b border-zinc-800/80 px-4 py-3 shrink-0">
              <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Type to search SprintOS..."
                className="bg-transparent text-white placeholder:text-zinc-500 text-base outline-none border-none w-full"
              />
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-zinc-500 animate-spin mr-2 shrink-0" />
              ) : query ? (
                <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300 mr-2 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              ) : null}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold px-2 py-1 bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {query && flatItems.length === 0 && !isLoading && (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No results found matching "<span className="text-zinc-300 font-semibold">{query}</span>"
                </div>
              )}

              {!query && (
                <div className="p-4 text-zinc-500 text-xs">
                  <p className="font-semibold text-zinc-400 mb-2">Search Shortcuts</p>
                  <ul className="space-y-1">
                    <li>Use <kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 font-mono text-[10px]">Ctrl+K</kbd> to open/close search anywhere</li>
                    <li>Use <kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 font-mono text-[10px]">↑</kbd> <kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 font-mono text-[10px]">↓</kbd> keys to navigate search items</li>
                    <li>Press <kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 font-mono text-[10px]">Enter</kbd> to open selected element</li>
                  </ul>
                </div>
              )}

              {flatItems.length > 0 && (
                <div className="space-y-4">
                  {/* Suggestions quick chips */}
                  {suggestions.length > 0 && (
                    <div className="px-2 pt-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((sug: any) => (
                          <button
                            key={sug.id}
                            onClick={() => navigate(sug.type === 'project' ? `/dashboard/projects/${sug.id}` : `/dashboard/boards`)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-xs text-zinc-300 rounded-full border border-zinc-800 transition-all"
                          >
                            {sug.key && <span className="font-mono text-[10px] text-indigo-400 font-bold">{sug.key}</span>}
                            <span>{sug.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main results list */}
                  <div className="space-y-0.5">
                    <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Search Results</p>
                    {flatItems.map((item, idx) => {
                      const isActive = idx === activeIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNavigate(item)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-indigo-600 text-white shadow-lg scale-[1.01]' 
                              : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-500 text-white' : 'bg-zinc-900 border border-zinc-800'}`}>
                              {getItemIcon(item.type)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {item.key && (
                                  <span className={`font-mono text-xs font-bold ${isActive ? 'text-indigo-200' : 'text-indigo-400'}`}>
                                    {item.key}
                                  </span>
                                )}
                                <span className="font-semibold text-sm truncate">{item.title}</span>
                              </div>
                              {item.subtitle && (
                                <p className={`text-xs truncate ${isActive ? 'text-indigo-200' : 'text-zinc-500'}`}>
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-200">
                              <span>Open</span>
                              <CornerDownLeft className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
