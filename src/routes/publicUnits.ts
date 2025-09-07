import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

/**
 * GET all available units (public)
 */
router.get("/available", async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            where: { status: "available" },
            select: {
                id: true,
                type: true,
                monthlyRate: true,
                latitude: true,
                longitude: true,
                address_street: true,
                city: true,          // Add this
                province: true,      // Add this
                country: true,       // Add this
                postal_code: true,   // Add this
                status: true,
            },
            orderBy: { monthlyRate: "asc" },
        });

        res.json({ data: units });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch available units" });
    }
});
export default router;
