import prisma from "../lib/prisma";

export const createUnit = async (
    type: string,
    monthlyRate: number,
    createdBy: number,
    clientId?: string
) => {
    return prisma.unit.create({
        data: {
            type,
            monthlyRate,
            createdBy,
            clientId,
            status: "available",
        },
    });
};

export const getUnits = async () => {
    return prisma.unit.findMany({
        include: {
            client: true,
            user: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
