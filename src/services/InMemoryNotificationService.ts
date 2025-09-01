// services/inMemoryNotificationService.ts

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type RelatedEntity = 'client' | 'unit' | 'user' | 'other' | null;

export interface Notification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedEntity?: RelatedEntity;
    entityId?: string | null;
    isRead: boolean;
    createdAt: string;
    updatedAt?: string;
}

let notifications: Notification[] = [];

export class InMemoryNotificationService {
    // Create a new notification
    static createNotification({
        userId,
        title,
        message,
        type = 'info',
        relatedEntity = null,
        entityId = null,
    }: {
        userId: string;
        title: string;
        message: string;
        type?: NotificationType;
        relatedEntity?: RelatedEntity;
        entityId?: string | null;
    }): Notification {
        const notification: Notification = {
            _id: String(Date.now()) + Math.random().toString(36).substring(2, 8),
            userId,
            title,
            message,
            type,
            relatedEntity,
            entityId,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        notifications.push(notification);
        return notification;
    }

    // Get last 50 notifications for a user
    static getNotificationsByUserId(userId: string): Notification[] {
        return notifications
            .filter((n) => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50);
    }

    // Count unread notifications
    static getUnreadCount(userId: string): number {
        return notifications.filter((n) => n.userId === userId && !n.isRead).length;
    }

    // Mark a single notification as read
    static markAsRead(notificationId: string, userId: string): Notification | null {
        const notification = notifications.find((n) => n._id === notificationId && n.userId === userId);
        if (notification) {
            notification.isRead = true;
            notification.updatedAt = new Date().toISOString();
            return notification;
        }
        return null;
    }

    // Mark all notifications as read
    static markAllAsRead(userId: string): void {
        notifications = notifications.map((n) =>
            n.userId === userId && !n.isRead ? { ...n, isRead: true, updatedAt: new Date().toISOString() } : n
        );
    }

    // Delete a notification
    static deleteNotification(notificationId: string, userId: string): boolean {
        const index = notifications.findIndex((n) => n._id === notificationId && n.userId === userId);
        if (index !== -1) {
            notifications.splice(index, 1);
            return true;
        }
        return false;
    }

    // Example notification methods
    static notifyNewClient(clientId: string, clientName: string, userId: string): Notification {
        return this.createNotification({
            userId,
            title: 'New Client Added',
            message: `Client "${clientName}" has been added to the system`,
            type: 'success',
            relatedEntity: 'client',
            entityId: clientId,
        });
    }

    static notifyUnitUpdate(unitId: string, unitName: string, userId: string): Notification {
        return this.createNotification({
            userId,
            title: 'Unit Updated',
            message: `Unit "${unitName}" has been updated`,
            type: 'info',
            relatedEntity: 'unit',
            entityId: unitId,
        });
    }
}
