import { Router } from "express";
import prisma from "../lib/prisma"; // make sure this points to your Prisma client instance

const router = Router();

// GET all units
router.get("/", async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            include: {
                client: true,
                user: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(units);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch units" });
    }
});

// POST new unit - get user ID from auth instead of request body
router.post("/", async (req, res) => {
    try {
        // Get user ID from authentication (adjust based on your auth setup)
        const userId = req.user?.id; // This depends on your authentication middleware

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { type, status, clientId, monthlyRate, latitude, longitude, address_street } = req.body;

        // Convert monthlyRate to number
        const monthlyRateNumber = typeof monthlyRate === 'string'
            ? parseFloat(monthlyRate)
            : monthlyRate;

        const newUnit = await prisma.unit.create({
            data: {
                type,
                status,
                monthlyRate: monthlyRateNumber,
                latitude,
                longitude, address_street,
                user: {
                    connect: { id: userId } // Use authenticated user ID
                },
                // Only connect client if provided
                ...(clientId && {
                    client: {
                        connect: { id: clientId }
                    }
                })
            },
        });

        res.status(201).json(newUnit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create unit" });
    }
});

// PUT update unit
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { type, status, clientId, monthlyRate, latitude, longitude, address_street } = req.body;

        const updatedUnit = await prisma.unit.update({
            where: { id: Number(id) },
            data: {
                type,
                status,
                latitude,
                longitude, address_street,
                monthlyRate: typeof monthlyRate === 'string'
                    ? parseFloat(monthlyRate)
                    : monthlyRate,
                // Only update client if provided, otherwise disconnect
                client: clientId
                    ? { connect: { id: clientId } }
                    : { disconnect: true }
            },
        });

        res.json(updatedUnit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update unit" });
    }
});
// DELETE unit
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.unit.delete({
            where: { id: Number(id) },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete unit" });
    }
});

export default router;
