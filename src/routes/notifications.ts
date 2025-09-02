import { Router } from "express";
import { authenticateToken } from "../middleware/auth"; // Adjust based on your auth setup
import prisma from "../lib/prisma";

const router = Router();

// GET all notifications for a user
// GET all notifications for a user
router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                User: {  // Change from 'user' to 'User'
                    select: {
                        id: true,
                        username: true,  // Changed from 'name' to 'username'
                        email: true
                    }
                }
            }
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
        const userId = req.user.id;

        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
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
        const { userId, title, message, type, relatedEntity, entityId } = req.body;

        const newNotification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || "info",
                relatedEntity: relatedEntity || null,
                entityId: entityId || null
            }
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
        const userId = req.user.id;

        const notification = await prisma.notification.update({
            where: {
                id,
                userId // Ensure user can only mark their own notifications as read
            },
            data: {
                isRead: true
            }
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
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
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
        const userId = req.user.id;

        await prisma.notification.delete({
            where: {
                id,
                userId // Ensure user can only delete their own notifications
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

export default router;