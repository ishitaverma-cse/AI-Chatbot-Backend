import genAI from '../config/gemini.js'
import assistantConfig from '../assistants/assistantConfig.js'

// Generate an AI response using conversation history and assistant instructions
const generateAIResponse = async (chatHistory, botType) => {
    try {
        const assistant = assistantConfig[botType]

        if (!assistant) {
            throw new Error('Invalid assistant type')
        }

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
                systemInstruction: assistant.systemInstruction,
            },
        })

        return response.text
    } catch (error) {
        console.error('Gemini API Error:', error.message)
        throw new Error('Unable to generate AI response')
    }
}

export default generateAIResponse
