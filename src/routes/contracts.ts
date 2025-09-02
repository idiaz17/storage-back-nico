import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET all contracts
router.get("/", async (req, res) => {
    try {
        const contracts = await prisma.contract.findMany({
            include: {
                client: true,
                unit: true,
                user: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(contracts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch contracts" });
    }
});

// CREATE new contract
router.post("/", async (req, res) => {
    try {
        const {
            clientId,
            unitId,
            monthlyRate,
            startDate,
            endDate,
            title,
            content,
            draft,
            createdBy,
        } = req.body;

        const newContract = await prisma.contract.create({
            data: {
                clientId,
                unitId,
                monthlyRate,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                title,
                content,
                draft: draft ?? true,
                createdBy,
            },
        });

        res.status(201).json(newContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create contract" });
    }
});

// UPDATE contract
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, draft, endDate } = req.body;

        const updatedContract = await prisma.contract.update({
            where: { id: Number(id) },
            data: {
                title,
                content,
                draft,
                endDate: endDate ? new Date(endDate) : null,
            },
        });

        res.json(updatedContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update contract" });
    }
});

// DELETE contract
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.contract.delete({
            where: { id: Number(id) },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete contract" });
    }
});

export default router;
