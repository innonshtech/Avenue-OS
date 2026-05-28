import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MentionAutocompleteProps {
  suggestions: any[];
  onSelect: (userName: string) => void;
  isOpen: boolean;
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({ suggestions, onSelect, isOpen }) => {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-14 left-4 w-60 max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-[9999] p-1.5 space-y-1 scrollbar-thin">
      <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 tracking-wider">
        Mention Team Member
      </div>
      {suggestions.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => onSelect(member.name)}
          className="flex items-center gap-2.5 w-full px-2 py-1.5 text-left text-sm rounded hover:bg-indigo-600/20 hover:text-white transition-all text-zinc-300 focus:outline-none"
        >
          <Avatar className="w-5.5 h-5.5">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="text-[9px] font-bold bg-zinc-800 text-zinc-400">
              {member.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs truncate leading-tight text-white">{member.name}</div>
            <div className="text-[9px] text-zinc-500 truncate leading-none mt-0.5">{member.role}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
