import { useState, useEffect } from 'react';
import { useSearchChat } from '../api/chatApi';

export const useChatSearch = (channelId?: string) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data: results = [], isLoading, isError } = useSearchChat(debouncedTerm, channelId);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    isError,
  };
};
