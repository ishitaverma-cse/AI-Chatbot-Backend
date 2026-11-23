import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const protect = async (req, res, next) => {
    try {
        let token

        // Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided',
            })
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        // Find authenticated user
        const user = await User.findById(decoded.id)

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists',
            })
        }

        // Attach user to request
        req.user = user

        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired, please log in again',
            })
        }

        return res.status(401).json({
            success: false,
            message: 'Not authorized, invalid token',
        })
    }
}

export default protect
