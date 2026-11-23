import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import conversationRoutes from './routes/conversationRoutes.js'

dotenv.config()
const app = express()

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Authentication Routes
app.use('/api/auth', authRoutes)
app.use('/api/conversations', conversationRoutes)

// Test Route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Aether Backend is running successfully! 🚀',
    })
})

// Start Server
const PORT = process.env.PORT || 5000

const startServer = async () => {
    await connectDB()

    app.listen(PORT, () => {
        console.log(`Aether server running on port ${PORT}`)
    })
}

startServer()
