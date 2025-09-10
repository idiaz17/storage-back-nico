"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma")); // Import your Prisma client
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ error: "No token provided" });
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded?.id)
            return res.status(401).json({ error: "Invalid token" });
        // Fetch user from DB
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            include: { client: true }, // 👈 make sure your Prisma schema has `client` relation
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        // Attach enriched user info to request
        req.user = {
            id: user.id,
            role: user.role,
            clientId: user.client?.id, // 👈 automatically add clientId if exists
        };
        next();
    }
    catch (err) {
        console.error("Auth error:", err);
        res.status(401).json({ error: "Unauthorized" });
    }
};
exports.authMiddleware = authMiddleware;
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Verify user still exists in database
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true
            }
        });
        if (!user) {
            return res.status(403).json({ message: 'User no longer exists' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Optional: Admin-only middleware
exports.requireAdmin = (0, exports.requireRole)(['admin']);
// Optional: User or Admin middleware
exports.requireUserOrAdmin = (0, exports.requireRole)(['user', 'admin']);
