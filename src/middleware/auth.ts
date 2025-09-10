// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import prisma from '../lib/prisma'; // Import your Prisma client

// interface DecodedToken {
//     id: number;
//     role: string; // e.g. "admin" | "client"
// }

// export const authMiddleware = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) return res.status(401).json({ error: "No token provided" });

//         const token = authHeader.split(" ")[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

//         if (!decoded?.id) return res.status(401).json({ error: "Invalid token" });

//         // Fetch user from DB
//         const user = await prisma.user.findUnique({
//             where: { id: decoded.id },
//             include: { client: true }, // 👈 make sure your Prisma schema has `client` relation
//         });

//         if (!user) return res.status(404).json({ error: "User not found" });

//         // Attach enriched user info to request
//         req.user = {
//             id: user.id,
//             role: user.role,
//             clientId: user.client?.id!, // 👈 automatically add clientId if exists
//         };

//         next();
//     } catch (err) {
//         console.error("Auth error:", err);
//         res.status(401).json({ error: "Unauthorized" });
//     }
// };

// export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//     if (!token) {
//         return res.status(401).json({ message: 'Access token required' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

//         // Verify user still exists in database
//         const user = await prisma.user.findUnique({
//             where: { id: decoded.userId },
//             select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 role: true
//             }
//         });

//         if (!user) {
//             return res.status(403).json({ message: 'User no longer exists' });
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         return res.status(403).json({ message: 'Invalid or expired token' });
//     }
// };

// export const requireRole = (roles: string[]) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         if (!req.user || !roles.includes(req.user.role)) {
//             return res.status(403).json({ message: 'Insufficient permissions' });
//         }
//         next();
//     };
// };

// // Optional: Admin-only middleware
// export const requireAdmin = requireRole(['admin']);

// // Optional: User or Admin middleware
// export const requireUserOrAdmin = requireRole(['user', 'admin']);

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

interface DecodedToken {
    id: number;
    role: string;
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "No token provided" });

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

        if (!decoded?.id) return res.status(401).json({ error: "Invalid token" });

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { client: true },
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        req.user = {
            id: user.id,
            role: user.role,
            clientId: Number(user.client?.id!),
            username: user.username,
            email: user.email,
        };

        next();
    } catch (err) {
        console.error("Auth error:", err);
        res.status(401).json({ error: "Unauthorized" });
    }
};

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as { id: number };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(403).json({ message: "User no longer exists" });
        }

        req.user = {
            id: user.id,
            role: user.role,
            username: user.username,
            email: user.email,
        };

        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    };
};

export const requireAdmin = requireRole(["admin"]);
export const requireUserOrAdmin = requireRole(["user", "admin"]);
