import mongoose from 'mongoose'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import generateAIResponse from '../services/aiService.js'
import checkDomainGuardrail from '../services/guardrailService.js'
import assistantConfig from '../assistants/assistantConfig.js'

// Generate a readable title from the first user message
const generateConversationTitle = (message) => {
    let title = message
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[.!?]+$/, '')

    // Remove common conversational openings
    title = title.replace(
        /^(can you|could you|please|help me|i want to|i need to)\s+/i,
        ''
    )

    // Keep the title concise
    if (title.length > 50) {
        title = title.slice(0, 50).replace(/\s+\S*$/, '')
    }

    return title.charAt(0).toUpperCase() + title.slice(1)
}

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

        // Get the selected assistant
        const assistant = assistantConfig[conversation.botType]

        if (!assistant) {
            return res.status(400).json({
                success: false,
                message: 'This is an older conversation. Please start a new chat with one of the Aether assistants.',
                legacyConversation: true,
            })
        }

        // Check domain guardrails before saving the message
        let guardrailResult

        try {
            guardrailResult = await checkDomainGuardrail(
                message.trim(),
                conversation.botType
            )
        } catch (error) {
            console.error('Guardrail Check Error:', error.message)

            return res.status(503).json({
                success: false,
                message: 'Unable to validate your message right now. Please try again.',
            })
        }

        // Validate guardrail classification
        if (
            !['in_domain', 'out_of_domain', 'unsafe'].includes(
                guardrailResult.classification
            )
        ) {
            return res.status(503).json({
                success: false,
                message: 'Unable to validate your message. Please try again.',
            })
        }

        // Handle out-of-domain requests
        if (guardrailResult.classification === 'out_of_domain') {
            const redirectAssistant = guardrailResult.redirectTo
                ? assistantConfig[guardrailResult.redirectTo]
                : null

            return res.status(200).json({
                success: true,
                handled: true,
                classification: 'out_of_domain',
                message: redirectAssistant
                    ? `This question is better suited for ${redirectAssistant.name}. Please start a new conversation with that assistant!`
                    : `I'm ${assistant.name}, and I can only help with my assigned topics. Please choose another Aether assistant for this question.`,
            })
        }

        // Handle unsafe requests
        if (guardrailResult.classification === 'unsafe') {
            return res.status(200).json({
                success: true,
                handled: true,
                classification: 'unsafe',
                message: `I’m ${assistant.name}, and I can't help with that request. I can help you with safe, relevant information within my area instead.`,
            })
        }

        // Check whether this is the first accepted user message
        const existingUserMessages = await Message.countDocuments({
            conversationId,
            userId: req.user._id,
            role: 'user',
        })

        const isFirstMessage = existingUserMessages === 0

        // Save user's message
        const userMessage = await Message.create({
            conversationId,
            userId: req.user._id,
            role: 'user',
            content: message.trim(),
        })

        // Generate a title only for the first message
        if (isFirstMessage && conversation.title === 'New Chat') {
            conversation.title = generateConversationTitle(message)
        }

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

        // Generate AI response using selected assistant
        let aiResponse

        try {
            aiResponse = await generateAIResponse(
                chatHistory,
                conversation.botType
            )
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
