import { Router, Request, Response } from "express";
import { InMemoryNotificationService } from "../services/InMemoryNotificationService";

// Extend Express Request type to include 'user'
declare module "express-serve-static-core" {
    interface Request {
        user: {
            id: string;
            // add other properties if needed
        };
    }
}

const router = Router();

// Get all notifications for user
router.get("/", (req: Request, res: Response) => {
    try {
        const notifications = InMemoryNotificationService.getNotificationsByUserId(
            req.user.id
        );
        res.json(notifications);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message });
    }
});

// Get unread notifications count
router.get("/unread-count", (req: Request, res: Response) => {
    try {
        const count = InMemoryNotificationService.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message });
    }
});

// Mark notification as read
router.patch("/:id/read", (req: Request, res: Response) => {
    try {
        const notification = InMemoryNotificationService.markAsRead(
            req.params.id,
            req.user.id
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json(notification);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message });
    }
});

// Mark all notifications as read
router.patch("/mark-all-read", (req: Request, res: Response) => {
    try {
        InMemoryNotificationService.markAllAsRead(req.user.id);
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message });
    }
});

// Delete notification
router.delete("/:id", (req: Request, res: Response) => {
    try {
        const deleted = InMemoryNotificationService.deleteNotification(
            req.params.id,
            req.user.id
        );
        if (!deleted) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json({ message: "Notification deleted" });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message });
    }
});

export default router;
