import generateAIResponse from './services/aiService.js'

const testAI = async () => {
    try {
        console.log('Connecting to Gemini...')

        const response = await generateAIResponse(
            'Reply with exactly: Aether is online!'
        )

        console.log('\nGemini connection successful!')
        console.log('AI Response:', response)
    } catch (error) {
        console.error('\nGemini test failed:', error.message)
    }
}

testAI()
