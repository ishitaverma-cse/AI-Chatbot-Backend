import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        title: {
            type: String,
            trim: true,
            default: 'New Chat',
            maxlength: 100,
        },

        botType: {
            type: String,
            enum: [
                'fitness',
                'health',
                'career',
                'entertainment',
                'diet',
                'books',
            ],
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

const Conversation = mongoose.model(
    'Conversation',
    conversationSchema
)

export default Conversation
