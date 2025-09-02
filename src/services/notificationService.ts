import prisma from "../lib/prisma";

export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: "info" | "warning" | "success" | "error";
    relatedEntity?: "client" | "unit" | "system" | null;
    entityId?: string | null;
}

export const createNotification = async (params: CreateNotificationParams) => {
    return prisma.notification.create({
        data: {
            userId: params.userId,
            title: params.title,
            message: params.message,
            type: params.type || "info",
            relatedEntity: params.relatedEntity || null,
            entityId: params.entityId || null
        }
    });
};

export const getUserNotifications = async (userId: string) => {
    return prisma.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
};

export const getUnreadCount = async (userId: string) => {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false
        }
    });
};

export const markAsRead = async (id: string, userId: string) => {
    return prisma.notification.update({
        where: {
            id,
            userId
        },
        data: {
            isRead: true
        }
    });
};

export const markAllAsRead = async (userId: string) => {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false
        },
        data: {
            isRead: true
        }
    });
};

export const deleteNotification = async (id: string, userId: string) => {
    return prisma.notification.delete({
        where: {
            id,
            userId
        }
    });
};