import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password',
            })
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
        })

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists',
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        })

        // Generate JWT
        const token = generateToken(user._id)

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        })
    } catch (error) {
        console.error('Registration Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error during registration',
        })
    }
}

// @desc    Login an existing user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            })
        }

        // Find user and explicitly include password
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        }).select('+password')

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            })
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            })
        }

        // Generate JWT
        const token = generateToken(user._id)

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        })
    } catch (error) {
        console.error('Login Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Server error during login',
        })
    }
}

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            preferences: req.user.preferences,
        },
    })
}

export { registerUser, loginUser, getMe }
