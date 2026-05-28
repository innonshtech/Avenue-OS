import { Router } from 'express';
import { ChatController } from './chat.controller';
import { validateRequest } from '../../validators/validate';
import { createChannelSchema, updateChannelSchema, createDMSchema, reactionSchema } from './chat.validators';

const router = Router();

// DMs
router.post('/dm', validateRequest(createDMSchema), ChatController.createDMChannel);
router.get('/dm/:userId', ChatController.getDMHistory);

// Channels
router.post('/channels', validateRequest(createChannelSchema), ChatController.createChannel);
router.get('/channels', ChatController.getChannels);
router.put('/channels/:id', validateRequest(updateChannelSchema), ChatController.updateChannel);
router.delete('/channels/:id', ChatController.deleteChannel);

// Messages
router.get('/channels/:channelId/messages', ChatController.getMessages);
router.post('/channels/:channelId/messages', ChatController.sendMessage);
router.get('/messages/:messageId/replies', ChatController.getReplies);
router.post('/messages/:messageId/replies', ChatController.sendReply);

// Reactions
router.post('/messages/:messageId/reactions', validateRequest(reactionSchema), ChatController.addReaction);
router.delete('/messages/:messageId/reactions', validateRequest(reactionSchema), ChatController.removeReaction);

// Pinned Messages
router.post('/messages/:messageId/pin', ChatController.pinMessage);
router.delete('/messages/:messageId/pin', ChatController.unpinMessage);
router.get('/channels/:channelId/pins', ChatController.getPinnedMessages);

// Search
router.get('/search', ChatController.searchChat);

// Convert Message to Task Prefill
router.post('/messages/:messageId/convert-task', ChatController.convertMessageToTask);

export default router;
