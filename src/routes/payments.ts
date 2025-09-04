import { Router } from "express";
import prisma from "../lib/prisma";
import { createNotification } from "../services/notificationService";

const router = Router();

// GET all payments
router.get("/", async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                client: { select: { id: true, name: true } },
                unit: { select: { id: true, type: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

// POST create a new payment
router.post("/", async (req, res) => {
    try {
        const { clientId, unitId, amount } = req.body;

        if (!clientId || !unitId || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate amount is positive
        if (Number(amount) <= 0) {
            return res.status(400).json({ error: "Amount must be positive" });
        }

        // Ensure client exists
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) return res.status(400).json({ error: "Invalid clientId" });

        // Ensure unit exists and belongs to client
        const unit = await prisma.unit.findUnique({
            where: { id: Number(unitId) }
        });

        if (!unit) {
            return res.status(400).json({ error: "Invalid unitId" });
        }

        if (unit.clientId !== clientId) {
            return res.status(400).json({ error: "Unit does not belong to client" });
        }

        const payment = await prisma.payment.create({
            data: {
                clientId,
                unitId: Number(unitId),
                amount: Number(amount),
                status: "pending",
            },
        });

        await createNotification({
            clientId: payment.clientId,
            userId: req.user.id, // must match User.id type
            title: "New Payment Created",
            message: `A new payment of $${payment.amount} has been created for unit ${unit.type}.`,
            type: "info",
            relatedEntity: "payment",
            entityId: payment.id,
        });


        res.status(201).json(payment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create payment" });
    }
});

// PATCH update payment
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paidAt } = req.body;

        const payment = await prisma.payment.findUnique({ where: { id } });
        if (!payment) return res.status(404).json({ error: "Payment not found" });

        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: status as "pending" | "paid" | "overdue",
                paidAt: paidAt ? new Date(paidAt) : null,
            },
        });

        let message = "";
        let type: "info" | "success" | "warning" = "info";

        if (status === "paid") {
            message = `Your payment of $${payment.amount} has been received.`;
            type = "success";
        } else if (status === "overdue") {
            message = `Your payment of $${payment.amount} is overdue.`;
            type = "warning";
        }

        if (message) {
            await createNotification({
                clientId: payment.clientId,
                title: "Payment Updated",
                message: `A new payment of $${payment.amount} has been updated for unit ${id}.`,
                type: "info",
                relatedEntity: "payment",
                entityId: payment.id,
                userId: req.user.id, // <-- add this
            });
        }

        res.json(updatedPayment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update payment" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if payment exists
        const payment = await prisma.payment.findUnique({ where: { id } });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Delete the payment
        await prisma.payment.delete({
            where: { id },
        });

        res.json({ success: true, message: "Payment deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete payment" });
    }
});
export default router;
