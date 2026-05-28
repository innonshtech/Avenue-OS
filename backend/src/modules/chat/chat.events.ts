export const CHAT_EVENTS = {
  MESSAGE_NEW: 'chat:message:new',
  MESSAGE_EDIT: 'chat:message:edit',
  MESSAGE_DELETE: 'chat:message:delete',
  TYPING_STATUS: 'chat:typing',
  READ_RECEIPT: 'chat:read',
  REACTION_ADD: 'chat:reaction:add',
  REACTION_REMOVE: 'chat:reaction:remove',
  PIN_TOGGLE: 'chat:pin:toggle',
  MENTION: 'chat:mention',
  PRESENCE_UPDATE: 'presence:update',
  ROOM_JOIN: 'chat:room:join',
  ROOM_LEAVE: 'chat:room:leave',
} as const;

export type ChatEvent = typeof CHAT_EVENTS[keyof typeof CHAT_EVENTS];
