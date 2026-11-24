import express from 'express'
import {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation
} from '../controllers/conversationController.js'

import {
    createMessage,
    getMessages,
} from '../controllers/messageController.js'

import { sendChatMessage } from '../controllers/chatController.js'

import protect from '../middleware/authMiddleware.js'

const router = express.Router()

// All conversation routes require authentication
router.use(protect)

// Create a new conversation
router.post('/', createConversation)

// Get all conversations
router.get('/', getConversations)

// Send a message and receive an AI response
router.post('/:conversationId/chat', sendChatMessage)

// Get a specific conversation
router.get('/:id', getConversationById)

// Delete a conversation
router.delete('/:id', deleteConversation)

// Create a message in a conversation
router.post('/:conversationId/messages', createMessage)

// Get all messages in a conversation
router.get('/:conversationId/messages', getMessages)

export default router
