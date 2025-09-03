import prisma from "../lib/prisma";

interface CreateNotificationInput {
    clientId: string;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    relatedEntity?: string | null;
    entityId?: string | null;
}

export const createNotification = async ({
    clientId,
    title,
    message,
    type = "info",
    relatedEntity = null,
    entityId = null,
}: CreateNotificationInput) => {
    // Ensure client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        throw new Error("Invalid clientId");
    }

    // Create notification
    return prisma.notification.create({
        data: {
            clientId,
            title,
            message,
            type,
            relatedEntity,
            entityId,
        },
    });
};
