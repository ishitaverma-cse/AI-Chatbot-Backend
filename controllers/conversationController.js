import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import assistantConfig from '../assistants/assistantConfig.js'

// @desc    Create a new conversation
// @route   POST /api/conversations
// @access  Private

const createConversation = async (req, res) => {
    try {
        const { botType } = req.body

        if (!botType || !Object.keys(assistantConfig).includes(botType)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid assistant type',
            })
        }

        const conversation = await Conversation.create({
            userId: req.user._id,
            botType,
        })

        res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            conversation,
        })
    } catch (error) {
        console.error('Create Conversation Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while creating conversation',
        })
    }
}


// @desc    Get all conversations of logged-in user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            userId: req.user._id,
        }).sort({ updatedAt: -1 })

        res.status(200).json({
            success: true,
            count: conversations.length,
            conversations,
        })
    } catch (error) {
        console.error('Get Conversations Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while fetching conversations',
        })
    }
}

// @desc    Get a single conversation
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        })

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            })
        }

        res.status(200).json({
            success: true,
            conversation,
        })
    } catch (error) {
        console.error('Get Conversation Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while fetching conversation',
        })
    }
}

// @desc    Delete a conversation
// @route   DELETE /api/conversations/:id
// @access  Private
const deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        })

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            })
        }

        await Message.deleteMany({
            conversationId: conversation._id,
            userId: req.user._id,
        })

        await conversation.deleteOne()

        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully',
        })
    } catch (error) {
        console.error('Delete Conversation Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while deleting conversation',
        })
    }
}

export {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation,
}
