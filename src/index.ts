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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));



// Public routes
app.use("/auth", authRouter);

// Protected routes
app.use("/clients", authenticateToken, clientsRouter);
app.use("/units", authenticateToken, unitsRouter);
app.use("/notifications", authenticateToken, notificationsRouter);
app.use("/contracts", authenticateToken, contractsRouter);



app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});