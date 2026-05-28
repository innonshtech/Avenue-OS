import React from 'react';
import { useChatStore } from '../store/chatStore';

export const TypingIndicator: React.FC = () => {
  const { typingUsers } = useChatStore();

  const activeTypers = Object.values(typingUsers).filter((u) => u.isTyping);

  if (activeTypers.length === 0) return null;

  const names = activeTypers.map((u) => u.userName);
  let text = '';
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = 'Several people are typing...';
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground animate-pulse font-medium bg-accent/30 rounded-full w-fit">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300" />
      </div>
      <span>{text}</span>
    </div>
  );
};
