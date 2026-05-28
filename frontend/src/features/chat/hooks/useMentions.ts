import { useState, useMemo } from 'react';
import { TEAM_MEMBERS } from '@/constants/teamMembers';

export const useMentions = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (!query) return TEAM_MEMBERS;
    return TEAM_MEMBERS.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const searchMentions = (text: string, cursorPosition: number) => {
    // Find if user is typing a mention (e.g. '@name')
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      // If there's a space, it's not a mention anymore
      if (!textAfterAt.includes(' ')) {
        setQuery(textAfterAt);
        setIsOpen(true);
        return;
      }
    }

    setIsOpen(false);
    setQuery('');
  };

  return {
    query,
    isOpen,
    setIsOpen,
    suggestions,
    searchMentions,
  };
};
