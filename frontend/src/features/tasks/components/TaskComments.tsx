import { useState, useRef, useEffect } from 'react';
import { 
  useComments, 
  useCreateComment, 
  useUpdateComment, 
  useDeleteComment, 
  useToggleReaction 
} from '../api/taskApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  MessageSquare, 
  Smile, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CornerDownRight, 
  Check, 
  X 
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CommentProps {
  taskId: string;
  comments: any[]; // initial comments from task, though we will fetch dynamically using useComments
}

const COMMON_EMOJIS = ['👍', '❤️', '🎉', '👀', '🚀', '🔥'];

export default function TaskComments({ taskId }: CommentProps) {
  const { data: fetchedComments = [], isLoading } = useComments(taskId);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const toggleReaction = useToggleReaction();
  
  const { user: currentUser } = useAuthStore();

  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [activeInputType, setActiveInputType] = useState<'main' | 'reply' | 'edit'>('main');
  const [cursorPos, setCursorPos] = useState(0);

  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Mentions filtration
  const filteredMembers = TEAM_MEMBERS.filter(member => 
    member.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
    member.email.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Parse text for @ mentions and handle autocomplete triggers
  const handleTextChange = (
    text: string, 
    inputType: 'main' | 'reply' | 'edit',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    if (inputType === 'main') setNewCommentText(text);
    if (inputType === 'reply') setReplyText(text);
    if (inputType === 'edit') setEditText(text);

    const textarea = ref.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    setCursorPos(selectionStart);

    // Look back to see if user is typing a mention
    const textBeforeCursor = text.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && lastAtIdx >= textBeforeCursor.search(/\s/g) + 1) {
      const searchString = textBeforeCursor.substring(lastAtIdx + 1);
      if (!searchString.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(searchString);
        setActiveInputType(inputType);
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMention = (name: string) => {
    let currentText = '';
    let setMethod: (t: string) => void = () => {};
    let ref: React.RefObject<HTMLTextAreaElement | null> = { current: null };

    if (activeInputType === 'main') {
      currentText = newCommentText;
      setMethod = setNewCommentText;
      ref = mainInputRef;
    } else if (activeInputType === 'reply') {
      currentText = replyText;
      setMethod = setReplyText;
      ref = replyInputRef;
    } else if (activeInputType === 'edit') {
      currentText = editText;
      setMethod = setEditText;
      ref = editInputRef;
    }

    const textBeforeAt = currentText.substring(0, cursorPos - mentionFilter.length - 1);
    const textAfterCursor = currentText.substring(cursorPos);
    
    // Insert @Name and add space
    const completedText = `${textBeforeAt}@${name} ${textAfterCursor}`;
    setMethod(completedText);
    setShowMentions(false);

    // Focus back on input
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        const newCursorPos = textBeforeAt.length + name.length + 2; // +1 for @, +1 for space
        ref.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handlePostComment = () => {
    if (!newCommentText.trim()) return;
    createComment.mutate({
      taskId,
      content: newCommentText.trim()
    }, {
      onSuccess: () => {
        setNewCommentText('');
      }
    });
  };

  const handlePostReply = (parentId: string) => {
    if (!replyText.trim()) return;
    createComment.mutate({
      taskId,
      content: replyText.trim(),
      parentCommentId: parentId
    }, {
      onSuccess: () => {
        setReplyText('');
        setReplyToId(null);
      }
    });
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;
    updateComment.mutate({
      id: commentId,
      taskId,
      content: editText.trim()
    }, {
      onSuccess: () => {
        setEditingId(null);
        setEditText('');
      }
    });
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate({ id: commentId, taskId });
    }
  };

  const handleReaction = (commentId: string, emoji: string) => {
    toggleReaction.mutate({ commentId, taskId, emoji });
  };

  // Styled rendering of @names
  const formatCommentText = (text: string) => {
    const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const idx = match.index;
      const name = match[1];

      if (idx > lastIndex) {
        parts.push(text.substring(lastIndex, idx));
      }

      parts.push(
        <span 
          key={idx} 
          className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-bold text-xs border border-indigo-500/20 shadow-sm"
        >
          @{name}
        </span>
      );
      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  if (isLoading) {
    return <div className="text-center py-6 text-sm text-muted-foreground">Loading discussion...</div>;
  }

  return (
    <div className="space-y-6 mt-4 relative">
      {/* Main Comment Input */}
      <div className="flex gap-3 mb-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl shadow-sm">
        <Avatar className="w-9 h-9 border border-indigo-500/20 shadow-md shrink-0">
          <AvatarImage src={currentUser?.avatar} />
          <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
            {currentUser?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow relative">
          <Textarea 
            ref={mainInputRef}
            placeholder="Write a message, use @ to mention teammates..." 
            className="min-h-[90px] text-sm resize-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl shadow-inner"
            value={newCommentText}
            onChange={(e) => handleTextChange(e.target.value, 'main', mainInputRef)}
          />

          {/* Autocomplete Dropdown */}
          {showMentions && activeInputType === 'main' && filteredMembers.length > 0 && (
            <div className="absolute z-[999] bottom-full left-0 mb-1 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase px-2 py-1 tracking-wider">Mention Team</p>
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => selectMention(member.name)}
                  className="flex items-center gap-2.5 w-full text-left px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-indigo-600/20 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <Avatar className="w-5 h-5 border border-zinc-200 dark:border-zinc-800">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-[8px]">{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{member.name}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{member.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-3">
            <Button 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={!newCommentText.trim() || createComment.isPending} 
              onClick={handlePostComment}
            >
              <Send className="w-3.5 h-3.5 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Discussion List */}
      <div className="space-y-6">
        {fetchedComments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center bg-zinc-900/10 rounded-xl border border-dashed border-zinc-800/40">
            <MessageSquare className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium">No discussion started yet.</p>
            <p className="text-xs text-zinc-500">Add a comment above to kick things off!</p>
          </div>
        ) : (
          fetchedComments.map((comment: any) => {
            const isEditing = editingId === comment.id;
            const isOwner = comment.userId === currentUser?.id;
            const canManage = isOwner || currentUser?.permissions?.includes('CREATE_TASK');

            return (
              <div key={comment.id} className="group flex gap-3.5 items-start">
                <Avatar className="w-9 h-9 border border-zinc-800 shadow shrink-0">
                  <AvatarImage src={comment.user?.avatar} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 font-semibold text-xs">
                    {comment.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-grow space-y-1">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{comment.user?.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {comment.isEdited && (
                        <span className="text-[9px] text-zinc-500 font-medium italic">(edited)</span>
                      )}
                    </div>

                    {/* Manage actions */}
                    {canManage && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                            {isOwner && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.content);
                                }}
                                className="hover:bg-zinc-900 focus:bg-zinc-900 gap-2 cursor-pointer text-xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit Comment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(comment.id)}
                              className="text-red-500 hover:bg-zinc-900 focus:bg-zinc-900 gap-2 cursor-pointer text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 p-3.5 rounded-xl text-sm leading-relaxed text-zinc-800 dark:text-zinc-300 shadow-sm">
                    {isEditing ? (
                      <div className="space-y-2 relative">
                        <Textarea 
                          ref={editInputRef}
                          value={editText}
                          onChange={(e) => handleTextChange(e.target.value, 'edit', editInputRef)}
                          className="min-h-[70px] text-sm resize-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 rounded-lg shadow-inner"
                        />

                        {/* Mentions autocomplete on edit */}
                        {showMentions && activeInputType === 'edit' && filteredMembers.length > 0 && (
                          <div className="absolute z-[999] bottom-full left-0 mb-1 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto">
                            {filteredMembers.map(member => (
                              <button
                                key={member.id}
                                onClick={() => selectMention(member.name)}
                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-indigo-600/20 rounded-lg text-xs text-zinc-700 dark:text-zinc-300"
                              >
                                <span>{member.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 rounded-lg" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 rounded-lg" onClick={() => handleSaveEdit(comment.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{formatCommentText(comment.content)}</div>
                    )}
                  </div>

                  {/* Reactions & Actions Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Reaction chips */}
                    {comment.reactions?.map((react: any) => (
                      <button
                        key={react.id || react.emoji}
                        onClick={() => handleReaction(comment.id, react.emoji)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs transition-all ${
                          react.userId === currentUser?.id 
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 font-bold' 
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <span>{react.emoji}</span>
                        {/* If grouped in UI, show count. If database flat reactions list, count emojis */}
                        <span className="text-[10px]">
                          {comment.reactions.filter((r: any) => r.emoji === react.emoji).length}
                        </span>
                      </button>
                    ))}

                    {/* Quick emoji drawer */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="flex p-1 gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-lg">
                        {COMMON_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(comment.id, emoji)}
                            className="p-1 text-base hover:bg-zinc-900 rounded transition-transform hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <span className="text-zinc-400 dark:text-zinc-700 select-none">•</span>

                    {/* Reply Toggle */}
                    <button 
                      onClick={() => {
                        setReplyToId(replyToId === comment.id ? null : comment.id);
                        setReplyText('');
                      }}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-4 mt-3 border-l border-zinc-800 space-y-4">
                      {comment.replies.map((reply: any) => {
                        const isReplyOwner = reply.userId === currentUser?.id;
                        const canManageReply = isReplyOwner || currentUser?.permissions?.includes('CREATE_TASK');

                        return (
                          <div key={reply.id} className="group/reply flex gap-3 items-start">
                            <Avatar className="w-7 h-7 border border-zinc-800 shadow shrink-0">
                              <AvatarImage src={reply.user?.avatar} />
                              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[10px]">
                                {reply.user?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-grow space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-zinc-200">{reply.user?.name}</span>
                                  <span className="text-[9px] text-zinc-500">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                
                                {canManageReply && (
                                  <button
                                    onClick={() => handleDelete(reply.id)}
                                    className="opacity-0 group-hover/reply:opacity-100 p-0.5 text-zinc-500 hover:text-red-500 rounded transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800/40 p-2.5 rounded-lg text-xs leading-relaxed text-zinc-700 dark:text-zinc-400 shadow-sm">
                                <div className="whitespace-pre-wrap">{formatCommentText(reply.content)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Input Box */}
                  {replyToId === comment.id && (
                    <div className="flex gap-2.5 mt-3 pl-4 border-l border-zinc-800 items-start relative">
                      <CornerDownRight className="w-4 h-4 text-zinc-700 mt-2.5 shrink-0" />
                      <div className="flex-grow relative">
                        <Textarea
                          ref={replyInputRef}
                          placeholder={`Reply to ${comment.user?.name}...`}
                          className="min-h-[60px] text-xs resize-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 rounded-lg shadow-inner"
                          value={replyText}
                          onChange={(e) => handleTextChange(e.target.value, 'reply', replyInputRef)}
                        />

                        {/* Mentions autocomplete on reply */}
                        {showMentions && activeInputType === 'reply' && filteredMembers.length > 0 && (
                          <div className="absolute z-[999] bottom-full left-0 mb-1 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto">
                            {filteredMembers.map(member => (
                              <button
                                key={member.id}
                                onClick={() => selectMention(member.name)}
                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-indigo-600/20 rounded-lg text-[10px] text-zinc-700 dark:text-zinc-300"
                              >
                                <span>{member.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-2">
                          <Button size="sm" variant="ghost" className="h-6 text-zinc-500 hover:text-zinc-300" onClick={() => setReplyToId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" className="h-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium" onClick={() => handlePostReply(comment.id)}>
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
