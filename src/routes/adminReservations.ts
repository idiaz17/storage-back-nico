import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// GET /admin/reservations
router.get("/", authenticateToken, async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            orderBy: { createdAt: "desc" }, // latest first
            include: {
                unit: true, // include unit details
            },
        });

        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
