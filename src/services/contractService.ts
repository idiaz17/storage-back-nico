import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth"; // Add authentication

const router = Router();

// GET all contracts
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { draft, clientId, unitId } = req.query;

        const whereClause: any = {};

        if (draft !== undefined) {
            whereClause.draft = draft === 'true';
        }
        if (clientId) {
            whereClause.clientId = clientId as string;
        }
        if (unitId) {
            whereClause.unitId = parseInt(unitId as string);
        }

        const contracts = await prisma.contract.findMany({
            where: whereClause,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                unit: {
                    select: {
                        id: true,
                        type: true,
                        status: true,
                        monthlyRate: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(contracts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contracts" });
    }
});

// GET single contract by ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const contract = await prisma.contract.findUnique({
            where: { id: Number(id) },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        notes: true
                    }
                },
                unit: {
                    select: {
                        id: true,
                        type: true,
                        status: true,
                        monthlyRate: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
            },
        });

        if (!contract) {
            return res.status(404).json({ error: "Contract not found" });
        }

        res.json(contract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contract" });
    }
});

// CREATE new contract
router.post("/", authenticateToken, async (req, res) => {
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
        } = req.body;

        // Get user ID from authentication
        const createdBy = req.user.id;

        // Check if unit exists and is available
        const unit = await prisma.unit.findUnique({
            where: { id: unitId },
        });

        if (!unit) {
            return res.status(404).json({ error: "Unit not found" });
        }

        if (unit.status !== 'available') {
            return res.status(400).json({ error: "Unit is not available" });
        }

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

        // Update unit status to rented
        await prisma.unit.update({
            where: { id: unitId },
            data: { status: 'rented' }
        });

        res.status(201).json(newContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create contract" });
    }
});

// UPDATE contract
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

// DELETE contract
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First get the contract to get the unitId
        const contract = await prisma.contract.findUnique({
            where: { id: Number(id) }
        });

        if (!contract) {
            return res.status(404).json({ error: "Contract not found" });
        }

        await prisma.contract.delete({
            where: { id: Number(id) },
        });

        // Update unit status back to available
        await prisma.unit.update({
            where: { id: contract.unitId },
            data: { status: 'available' }
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete contract" });
    }
});

// GET contracts by client ID
router.get("/client/:clientId", authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.params;

        const contracts = await prisma.contract.findMany({
            where: { clientId },
            include: {
                unit: {
                    select: {
                        id: true,
                        type: true,
                        status: true
                    }
                },
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(contracts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch client contracts" });
    }
});

// GET contracts statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
    try {
        const totalContracts = await prisma.contract.count();
        const activeContracts = await prisma.contract.count({
            where: { draft: false }
        });
        const draftContracts = await prisma.contract.count({
            where: { draft: true }
        });

        res.json({
            total: totalContracts,
            active: activeContracts,
            drafts: draftContracts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contract statistics" });
    }
});


export default router;