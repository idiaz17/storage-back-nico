import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * ✅ GET all contracts
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        const contracts = await prisma.contract.findMany({
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                unit: { select: { id: true, type: true, status: true, monthlyRate: true } },
                user: { select: { id: true, username: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(contracts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contracts" });
    }
});

/**
 * ✅ CREATE new contract
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { clientId, unitId, monthlyRate, startDate, endDate, title, content, draft } = req.body;
        const createdBy = req.user.id;

        const newContract = await prisma.contract.create({
            data: {
                clientId,
                unitId: Number(unitId),
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

/**
 * ✅ UPDATE contract
 */
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, draft, endDate, monthlyRate } = req.body;

        const updatedContract = await prisma.contract.update({
            where: { id: Number(id) },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(monthlyRate && { monthlyRate }),
                ...(draft !== undefined && { draft }),
                ...(endDate && { endDate: new Date(endDate) }),
            },
        });

        res.json(updatedContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update contract" });
    }
});

/**
 * ✅ DELETE contract
 */
router.delete("/:id", authenticateToken, async (req, res) => {
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

/**
 * ✅ CREATE draft contract
 */
router.post("/draft/:clientId", authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.params;
        const { unitId, monthlyRate, startDate, endDate } = req.body;
        const createdBy = req.user.id;

        const draftContract = await prisma.contract.create({
            data: {
                clientId,
                unitId: Number(unitId),
                monthlyRate,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                title: "Draft Contract",
                content: "",
                draft: true,
                createdBy,
            },
        });

        res.status(201).json(draftContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create draft contract" });
    }
});

/**
 * ✅ FINALIZE contract (admin action)
 */
router.patch("/:id/finalize", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const finalizedContract = await prisma.contract.update({
            where: { id: Number(id) },
            data: { draft: false },
        });

        res.json(finalizedContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to finalize contract" });
    }
});

/**
 * ✅ SIGN contract (client action)
 */
router.patch("/:id/sign", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const signedContract = await prisma.contract.update({
            where: { id: Number(id) },
            data: {
                signed: true,
                signedAt: new Date(),
                signedBy: userId,
            },
        });

        res.json(signedContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to sign contract" });
    }
});

export default router;
