import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        feedback: {
            type: String,
            enum: ['helpful', 'not_helpful', null],
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

const Message = mongoose.model('Message', messageSchema)

export default Message
