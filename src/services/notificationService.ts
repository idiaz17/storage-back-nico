import prisma from "../lib/prisma";

interface CreateNotificationInput {
    clientId: string;
    userId: number; // <-- this must match User.id type
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    relatedEntity?: string | null;
    entityId?: string | null;
}

export async function createNotification({
    clientId,
    userId,
    title,
    message,
    type = "info",
    relatedEntity = null,
    entityId = null,
}: CreateNotificationInput) {
    return prisma.notification.create({
        data: {
            clientId, // directly assign clientId
            userId,   // directly assign userId
            title,
            message,
            type,
            relatedEntity,
            entityId,
        },
    });
}