import { Router } from "express";
import { authenticateToken } from "../middleware/auth"; // your auth middleware
import prisma from "../lib/prisma";

const router = Router();

// GET all notifications for a client
router.get("/", authenticateToken, async (req, res) => {
    try {
        const clientId = req.user.clientId; // logged-in client UUID

        const notifications = await prisma.notification.findMany({
            where: { clientId },
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// GET unread notifications count
router.get("/unread-count", authenticateToken, async (req, res) => {
    try {
        const clientId = req.user.clientId;

        const count = await prisma.notification.count({
            where: {
                clientId,
                isRead: false,
            },
        });

        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch unread count" });
    }
});

// POST create new notification
router.post("/", async (req, res) => {
    try {
        const { clientId, title, message, type, relatedEntity, entityId } = req.body;

        if (!clientId || !title || !message) {
            return res.status(400).json({ error: "clientId, title, and message are required" });
        }

        const newNotification = await prisma.notification.create({
            data: {
                clientId, // string UUID of client
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

// PUT mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.clientId;

        const notification = await prisma.notification.updateMany({
            where: { id, clientId },
            data: { isRead: true },
        });

        res.json(notification);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// PUT mark all notifications as read
router.put("/mark-all-read", authenticateToken, async (req, res) => {
    try {
        const clientId = req.user.clientId;

        await prisma.notification.updateMany({
            where: {
                clientId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
});

// DELETE notification
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.clientId;

        await prisma.notification.deleteMany({
            where: { id, clientId },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

export default router;
