import express from "express";
import cors from "cors";
import clientsRouter from "./routes/clients";
import unitsRouter from "./routes/units";
import notificationsRouter from "./routes/notifications";
import authRouter from "./routes/auth";
import contractsRouter from "./routes/contracts";
import paymentsRouter from "./routes/payments"
import { authenticateToken } from "./middleware/auth";
import * as dotenv from "dotenv"
import rateLimit from "express-rate-limit";
import publicReservationsRouter from "./routes/publicReservations"
import publicUnitsRouter from "./routes/publicUnits"
import adminReservationsRouter from "./routes/adminReservations"

const app = express();
const PORT = 4000;

dotenv.config();
app.use(express.json());
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100, // limit each IP to 100 requests per 15 minutes
// });
// app.use(limiter);
// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000', // React dev server
            'http://localhost:3079', // React dev server
            'http://localhost:5173', // Vite dev server
            'http://localhost:3152',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3152',
            "http://192.168.1.39:3152"
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
app.use("/payments", authenticateToken, paymentsRouter);
app.use("/admin/reservations", authenticateToken, adminReservationsRouter);

app.use("/public/reservations", publicReservationsRouter);
app.use("/public/units", publicUnitsRouter);


app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});