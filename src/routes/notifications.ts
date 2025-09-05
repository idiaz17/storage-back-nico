
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();

/**
 * 📥 GET notifications (with pagination + filters)
 * - Admins/staff can see all
 * - Clients only see their own
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, type, unread } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (req.user.role === "client") {
            where.clientId = req.user.clientId;
        }
        if (type) {
            where.type = String(type);
        }
        if (unread === "true") {
            where.isRead = false;
        }

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    client: {
                        select: { id: true, name: true, email: true },
                    },
                    user: {
                        select: { id: true, username: true, email: true },
                    },
                },
            }),
            prisma.notification.count({ where }),
        ]);

        res.json({
            data: notifications,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

/**
 * 🔢 GET unread count
 */
router.get("/unread-count", authenticateToken, async (req, res) => {
    try {
        const where: any = {};
        if (req.user.role === "client") {
            where.clientId = req.user.clientId;
        }
        where.isRead = false;

        const count = await prisma.notification.count({ where });
        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch unread count" });
    }
});

/**
 * ➕ Create notification (manual, usually system will auto-create)
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { clientId, title, message, type, relatedEntity, entityId } = req.body;

        if (!title || !message) {
            return res
                .status(400)
                .json({ error: "title and message are required" });
        }

        const newNotification = await prisma.notification.create({
            data: {
                clientId: clientId ?? req.user.clientId,
                userId: req.user.id,
                title,
                message,
                type: type || "info",
                relatedEntity: relatedEntity || null,
                entityId: entityId || null,
            },
        });

        res.status(201).json(newNotification);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create notification" });
    }
});

/**
 * ✅ Mark single as read
 */
router.put("/:id/read", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const where: any = { id };
        if (req.user.role === "client") {
            where.clientId = req.user.clientId;
        }

        const notification = await prisma.notification.updateMany({
            where,
            data: { isRead: true },
        });

        res.json(notification);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

/**
 * ✅ Mark all as read
 */
router.put("/mark-all-read", authenticateToken, async (req, res) => {
    try {
        const where: any = { isRead: false };
        if (req.user.role === "client") {
            where.clientId = req.user.clientId;
        }

        await prisma.notification.updateMany({
            where,
            data: { isRead: true },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
});

/**
 * 🗑 Delete notification
 */
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const where: any = { id };
        if (req.user.role === "client") {
            where.clientId = req.user.clientId;
        }

        await prisma.notification.deleteMany({ where });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});


// GET /notifications/stream - SSE
router.get("/stream", authenticateToken, async (req, res) => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const clientId = req.user.clientId;

        // Send a heartbeat every 30s to keep connection alive
        const heartbeat = setInterval(() => {
            res.write(`event: heartbeat\ndata: {}\n\n`);
        }, 30000);

        // Simple example: poll database every 5s for new notifications
        let lastTimestamp = new Date();

        const interval = setInterval(async () => {
            const newNotifications = await prisma.notification.findMany({
                where: {
                    clientId,
                    createdAt: { gt: lastTimestamp },
                },
                include: { client: true, user: true },
                orderBy: { createdAt: "desc" },
            });

            if (newNotifications.length > 0) {
                newNotifications.forEach((n) => {
                    res.write(`data: ${JSON.stringify(n)}\n\n`);
                });
                lastTimestamp = new Date();
            }
        }, 5000);

        // Cleanup when client disconnects
        req.on("close", () => {
            clearInterval(interval);
            clearInterval(heartbeat);
            res.end();
        });
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

export default router;
