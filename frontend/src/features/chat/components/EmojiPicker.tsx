import React, { useState, useRef, useEffect } from 'react';
import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent focus:outline-none">
            <Smile className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute bottom-12 right-0 p-0 border-none shadow-2xl z-[9999] bg-zinc-950 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          <EmojiPickerReact
            theme={Theme.DARK}
            onEmojiClick={(emojiData) => {
              onEmojiSelect(emojiData.emoji);
              setIsOpen(false);
            }}
            lazyLoadEmojis={true}
            skinTonesDisabled={true}
            searchDisabled={false}
            width={320}
            height={380}
          />
        </div>
      )}
    </div>
  );
};
