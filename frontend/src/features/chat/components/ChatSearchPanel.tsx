import React from 'react';
import { useChatSearch } from '../hooks/useChatSearch';
import { useChatStore } from '../store/chatStore';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ChatSearchPanelProps {
  onClose: () => void;
}

export const ChatSearchPanel: React.FC<ChatSearchPanelProps> = ({ onClose }) => {
  const { searchTerm, setSearchTerm, results, isLoading } = useChatSearch();
  const { setActiveChannelId } = useChatStore();

  const handleSelectResult = (channelId: string) => {
    setActiveChannelId(channelId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[15vh]">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search messages, channels, mentions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-500 font-medium">Searching messages...</span>
            </div>
          ) : searchTerm && results.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm font-medium">
              No messages found matching "{searchTerm}"
            </div>
          ) : !searchTerm ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500 text-xs font-medium gap-1">
              <MessageSquare className="w-8 h-8 text-zinc-600 mb-2" />
              Type a word to search across all operational and team discussions.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-1 tracking-wider">
                Matching Messages ({results.length})
              </div>
              {results.map((msg: any) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectResult(msg.channelId)}
                  className="w-full text-left flex items-start gap-3 p-3 bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800/40 hover:border-zinc-800 rounded-xl transition-all focus:outline-none group"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={msg.sender?.avatar} alt={msg.sender?.name} />
                    <AvatarFallback className="text-[10px] font-bold bg-zinc-800 text-zinc-400">
                      {msg.sender?.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white">{msg.sender?.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                          #{msg.channel?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
