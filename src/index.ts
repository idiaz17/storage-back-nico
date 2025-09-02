import express from "express";
import cors from "cors";
import clientsRouter from "./routes/clients";
import unitsRouter from "./routes/units";
import notificationsRouter from "./routes/notifications";
import authRouter from "./routes/auth";
import contractsRouter from "./routes/contracts";
import { authenticateToken } from "./middleware/auth";
import * as dotenv from "dotenv"

const app = express();
const PORT = 4000;

dotenv.config();
app.use(express.json());

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000', // React dev server
            'http://localhost:5173', // Vite dev server
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            // Add your production domains here later
        ];

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests
// app.options('*', cors());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Basic health check
// app.get("/", (req, res) => res.send("Storage Manager API running"));
// app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

// Public routes
app.use("/auth", authRouter);

// Protected routes
app.use("/clients", authenticateToken, clientsRouter);
app.use("/units", authenticateToken, unitsRouter);
app.use("/notifications", authenticateToken, notificationsRouter);
app.use("/contracts", authenticateToken, contractsRouter);

// Global error handler
// app.use((err: any, req: any, res: any, next: any) => {
//     if (err.message === 'Not allowed by CORS') {
//         return res.status(403).json({
//             message: 'CORS error: Request not allowed from this origin'
//         });
//     }

//     console.error('Error:', err);
//     res.status(500).json({ message: 'Internal server error' });
// });

// // 404 handler
// app.use('*', (req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});