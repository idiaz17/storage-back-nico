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
router.put("/:id/confirm", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await prisma.reservation.findUnique({
            where: { id: Number(id) },
            include: { unit: true },
        });

        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        if (!reservation.unit) {
            return res.status(400).json({ error: "Reservation has no linked unit" });
        }

        // 1️⃣ Create new client
        const client = await prisma.client.create({
            data: {
                name: `${reservation.firstName} ${reservation.lastName}`,
                email: reservation.email,
                phone: reservation.phone,
                notes: `Created from reservation #${reservation.id}`,
            },
        });

        // 2️⃣ Assign unit to client + update status
        await prisma.unit.update({
            where: { id: reservation.unitId },
            data: {
                clientId: client.id,
                status: "reserved",
            },
        });

        // 3️⃣ Update reservation status
        const updatedReservation = await prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: "confirmed" },
        });

        // 4️⃣ Create draft contract
        const contract = await prisma.contract.create({
            data: {
                clientId: client.id,
                unitId: reservation.unitId,
                monthlyRate: reservation.unit.monthlyRate,
                startDate: reservation.entryDate,
                title: `Contract for ${reservation.firstName} ${reservation.lastName}`,
                content: `Auto-generated draft contract for reservation #${reservation.id}.`,
                draft: true,
                signed: false,
                createdBy: req.user.id,
            },
        });

        // 5️⃣ Log activity
        await prisma.activity.create({
            data: {
                userId: req.user.id,
                clientId: client.id,
                type: "reservation_confirmed",
                details: `Reservation ${reservation.id} confirmed → Client ${client.name}, Unit ${reservation.unitId}, Contract ${contract.id}.`,
            },
        });

        // 6️⃣ Create notification (for CRM admins / staff)
        await prisma.notification.create({
            data: {
                userId: req.user.id, // 🔑 admin that confirmed
                clientId: client.id,
                reservationId: reservation.id,
                contractId: contract.id,
                title: "Reservation Confirmed",
                message: `Reservation #${reservation.id} confirmed → Client ${client.name}, Contract #${contract.id} created.`,
                type: "success",
                relatedEntity: "reservation",
            },
        });

        res.json({
            message:
                "Reservation confirmed, client + contract created, unit assigned, notification sent",
            client,
            reservation: updatedReservation,
            contract,
        });
    } catch (error) {
        console.error("Error confirming reservation:", error);
        res.status(500).json({ error: "Failed to confirm reservation" });
    }
});

export default router;
