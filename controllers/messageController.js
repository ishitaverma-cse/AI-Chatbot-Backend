import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'

// @desc    Save a new message
// @route   POST /api/conversations/:conversationId/messages
// @access  Private
const createMessage = async (req, res) => {
    try {
        const { role, content } = req.body
        const { conversationId } = req.params

        // Validate required fields
        if (!role || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide role and content',
            })
        }

        // Validate message role
        if (!['user', 'assistant'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message role',
            })
        }

        // Check if conversation belongs to logged-in user
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: req.user._id,
        })

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            })
        }

        // Create message
        const message = await Message.create({
            conversationId,
            userId: req.user._id,
            role,
            content,
        })

        // Update conversation activity
        conversation.updatedAt = new Date()
        await conversation.save()

        res.status(201).json({
            success: true,
            message: 'Message saved successfully',
            data: message,
        })
    } catch (error) {
        console.error('Create Message Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while saving message',
        })
    }
}

// @desc    Get all messages in a conversation
// @route   GET /api/conversations/:conversationId/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params

        // Verify conversation ownership
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: req.user._id,
        })

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            })
        }

        // Fetch messages in chronological order
        const messages = await Message.find({
            conversationId,
            userId: req.user._id,
        }).sort({ createdAt: 1 })

        res.status(200).json({
            success: true,
            count: messages.length,
            messages,
        })
    } catch (error) {
        console.error('Get Messages Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while fetching messages',
        })
    }
}

export { createMessage, getMessages }
