export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Room joining/leaving
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',
  
  // Real-time updates
  TASK_UPDATED: 'task:updated',
  BLOCKER_ADDED: 'blocker:added',
  BLOCKER_RESOLVED: 'blocker:resolved',
  STANDUP_SUBMITTED: 'standup:submitted',
  
  // Comments and reactions
  COMMENT_NEW: 'comment:new',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  REACTION_UPDATED: 'reaction:updated',
  
  // User notifications
  NOTIFICATION_NEW: 'notification:new'
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
