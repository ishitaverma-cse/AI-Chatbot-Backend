import mongoose from 'mongoose'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import generateAIResponse from '../services/aiService.js'

// @desc    Send a message and receive an AI response
// @route   POST /api/conversations/:conversationId/chat
// @access  Private

const sendChatMessage = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { message } = req.body

        // Validate message
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid message',
            })
        }

        // Validate conversation ID
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid conversation ID',
            })
        }

        // Find conversation belonging to the logged-in user
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

        // Save user's message
        const userMessage = await Message.create({
            conversationId,
            userId: req.user._id,
            role: 'user',
            content: message.trim(),
        })

        // Update conversation timestamp
        conversation.updatedAt = new Date()
        await conversation.save()

        // Fetch conversation history
        const chatHistory = await Message.find({
            conversationId,
            userId: req.user._id,
        })
            .sort({ createdAt: 1 })
            .select('role content -_id')

        // Generate AI response using Gemini
        let aiResponse

        try {
            aiResponse = await generateAIResponse(chatHistory)
        } catch (error) {
            console.error('Chat AI Error:', error.message)

            return res.status(502).json({
                success: false,
                message: 'Unable to generate AI response. Please try again.',
                userMessage,
            })
        }

        // Validate AI response
        if (!aiResponse || !aiResponse.trim()) {
            return res.status(502).json({
                success: false,
                message: 'AI returned an empty response. Please try again.',
                userMessage,
            })
        }

        // Save assistant's response
        const assistantMessage = await Message.create({
            conversationId,
            userId: req.user._id,
            role: 'assistant',
            content: aiResponse.trim(),
        })

        // Return both messages
        res.status(201).json({
            success: true,
            message: 'AI response generated successfully',
            data: {
                userMessage,
                assistantMessage,
            },
        })
    } catch (error) {
        console.error('Send Chat Message Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error while processing chat message',
        })
    }
}

export { sendChatMessage }
