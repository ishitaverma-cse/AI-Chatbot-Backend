import genAI from '../config/gemini.js'

// Generate an AI response using conversation history
const generateAIResponse = async (chatHistory) => {
    try {
        const response = await genAI.models.generateContent({
            model: process.env.GEMINI_MODEL,

            contents: chatHistory.map((message) => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [
                    {
                        text: message.content,
                    },
                ],
            })),

            config: {
                systemInstruction:
                    'You are Aether, a helpful, friendly and intelligent AI assistant. Provide clear, accurate and conversational responses. Adapt your explanations to the user’s needs.',
            },
        })

        return response.text
    } catch (error) {
        console.error('Gemini API Error:', error.message)
        throw new Error('Unable to generate AI response')
    }
}

export default generateAIResponse
