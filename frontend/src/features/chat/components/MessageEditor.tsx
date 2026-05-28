import React, { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useMentions } from '../hooks/useMentions';
import { MentionAutocomplete } from './MentionAutocomplete';
import { EmojiPicker } from './EmojiPicker';

interface MessageEditorProps {
  onSend: (content: string) => void;
  placeholder?: string;
}

export const MessageEditor: React.FC<MessageEditorProps> = ({ onSend, placeholder = 'Type a message...' }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleKeyPress } = useTypingIndicator();
  const { query, isOpen, setIsOpen, suggestions, searchMentions } = useMentions();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    handleKeyPress(); // Trigger typing indicator

    // Handle mentions autocomplete trigger
    const cursor = e.target.selectionStart;
    searchMentions(text, cursor);
  };

  const handleSelectMention = (name: string) => {
    if (!textareaRef.current) return;
    const text = content;
    const cursor = textareaRef.current.selectionStart;
    const lastAtIndex = text.slice(0, cursor).lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const before = text.slice(0, lastAtIndex);
      const after = text.slice(cursor);
      const newContent = `${before}@${name} ${after}`;
      setContent(newContent);
      setIsOpen(false);

      // Reset cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = lastAtIndex + name.length + 2;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');
    setIsOpen(false);
  };

  return (
    <div className="relative border border-zinc-800 bg-zinc-950 rounded-xl p-2 focus-within:border-indigo-600 transition-colors">
      {/* Mentions Autocomplete dropdown */}
      <MentionAutocomplete
        suggestions={suggestions}
        onSelect={handleSelectMention}
        isOpen={isOpen}
      />

      <textarea
        ref={textareaRef}
        rows={1}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white placeholder-zinc-500 border-none focus:outline-none focus:ring-0 resize-none min-h-[40px] max-h-[160px] px-2 py-1.5 scrollbar-thin"
      />

      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 px-1">
        {/* Formatting or attachments trigger */}
        <div className="flex items-center gap-1">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="flex items-center justify-center p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors focus:outline-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
