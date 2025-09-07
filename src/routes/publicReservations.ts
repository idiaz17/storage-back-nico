import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// POST /public/reservations
router.post("/", async (req, res) => {
    try {
        const {
            unitId,
            location,
            type,        // "particular" | "profesional"
            size,        // "1-2m2" | "3-4m2" | etc.
            entryDate,
            goodsValue,  // "<5000" | "5000-10000" | ">10000"
            postalCode,
            firstName,
            lastName,
            email,
            phone,
        } = req.body;

        // ✅ Validate input
        if (
            !unitId ||
            !location || !type || !size || !entryDate || !goodsValue ||
            !postalCode || !firstName || !lastName || !email || !phone
        ) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // ✅ Check if unit exists and is available
        const unit = await prisma.unit.findUnique({ where: { id: Number(unitId) } });
        if (!unit) return res.status(404).json({ message: "Unit not found" });
        if (unit.status !== "available") {
            return res.status(400).json({ message: "Unit is not available" });
        }

        // ✅ Create reservation in DB
        // const reservation = await prisma.reservation.create({
        //     data: {
        //         unitId: Number(unitId),
        //         location,
        //         type,
        //         size,
        //         entryDate: new Date(entryDate),
        //         goodsValue,
        //         postalCode,
        //         firstName,
        //         lastName,
        //         email,
        //         phone,
        //         status: "pending",
        //     },
        // });
        const reservation = await prisma.reservation.create({
    data: {
        unitId: Number(unitId),
        location,
        type,
        size,
        entryDate: new Date(entryDate),
        goodsValue,
        postalCode,
        firstName,
        lastName,
        email,
        phone,
        status: "pending",
    },
});


        // ✅ Mark unit as reserved (so it disappears from /public/units/available)
        await prisma.unit.update({
            where: { id: Number(unitId) },
            data: { status: "reserved" }, // 👈 Or create a "reserved" enum if you prefer
        });
const admins = await prisma.user.findMany({ where: { role: "admin" } });

const notifications = admins.map((admin) => ({
  title: `New reservation from ${firstName} ${lastName}`,
  message: `Reservation for unit #${unitId} (${type}, ${size}) on ${new Date(entryDate).toLocaleDateString()}`,
  type: "reservation",
  userId: admin.id,
  relatedEntity: "reservation",
  reservationId: reservation.id, // ✅ correct FK now
}));



await prisma.notification.createMany({
    data: notifications,
});
        return res.status(201).json({
            message: "Reservation submitted successfully",
            reservation,
        });
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
