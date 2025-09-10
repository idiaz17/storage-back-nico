"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const clients_1 = __importDefault(require("./routes/clients"));
const units_1 = __importDefault(require("./routes/units"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const auth_1 = __importDefault(require("./routes/auth"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const payments_1 = __importDefault(require("./routes/payments"));
const auth_2 = require("./middleware/auth");
const dotenv = __importStar(require("dotenv"));
const publicReservations_1 = __importDefault(require("./routes/publicReservations"));
const publicUnits_1 = __importDefault(require("./routes/publicUnits"));
const adminReservations_1 = __importDefault(require("./routes/adminReservations"));
const app = (0, express_1.default)();
const PORT = 4000;
dotenv.config();
app.use(express_1.default.json());
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100, // limit each IP to 100 requests per 15 minutes
// });
// app.use(limiter);
// Enhanced CORS configuration
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
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
        }
        else {
            console.log('Blocked by CORS:', origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
// Public routes
app.use("/auth", auth_1.default);
// Protected routes
app.use("/clients", auth_2.authenticateToken, clients_1.default);
app.use("/units", auth_2.authenticateToken, units_1.default);
app.use("/notifications", auth_2.authenticateToken, notifications_1.default);
app.use("/contracts", auth_2.authenticateToken, contracts_1.default);
app.use("/payments", auth_2.authenticateToken, payments_1.default);
app.use("/admin/reservations", auth_2.authenticateToken, adminReservations_1.default);
app.use("/public/reservations", publicReservations_1.default);
app.use("/public/units", publicUnits_1.default);
app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});
