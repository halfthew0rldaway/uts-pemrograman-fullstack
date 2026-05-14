import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import { testConnection } from './config/db.js'
import { errorHandler } from './middlewares/authMiddleware.js'

import authRoutes from './routes/authRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import userRoutes from './routes/userRoutes.js'
import logRoutes from './routes/logRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// ---------------------------------------------------------------------------
// Middleware: CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3000',
      ]
      // Izinkan request tanpa origin (curl, Postman, mobile)
      if (!origin || allowed.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin ${origin} tidak diizinkan`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
)

// ---------------------------------------------------------------------------
// Middleware: Body parser & cookie
// ---------------------------------------------------------------------------
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ---------------------------------------------------------------------------
// Middleware: Session
// ---------------------------------------------------------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'pt-digital-nusantara-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 hari default
    },
  }),
)

// ---------------------------------------------------------------------------
// Static files: Serve folder uploads secara publik
// ---------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)
app.use('/api/logs', logRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PT Digital Nusantara API is running',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  })
})

// ---------------------------------------------------------------------------
// Global error handler (harus di paling bawah)
// ---------------------------------------------------------------------------
app.use(errorHandler)

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const startServer = async () => {
  await testConnection()
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`)
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()
