"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth"); // Add authentication
const router = (0, express_1.Router)();
// GET all contracts
router.get("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const { draft, clientId, unitId } = req.query;
        const whereClause = {};
        if (draft !== undefined) {
            whereClause.draft = draft === 'true';
        }
        if (clientId) {
            whereClause.clientId = clientId;
        }
        if (unitId) {
            whereClause.unitId = parseInt(unitId);
        }
        const contracts = await prisma_1.default.contract.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contracts" });
    }
});
// GET single contract by ID
router.get("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await prisma_1.default.contract.findUnique({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contract" });
    }
});
// CREATE new contract
router.post("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId, unitId, monthlyRate, startDate, endDate, title, content, draft, } = req.body;
        // Get user ID from authentication
        const createdBy = req.user.id;
        // Check if unit exists and is available
        const unit = await prisma_1.default.unit.findUnique({
            where: { id: unitId },
        });
        if (!unit) {
            return res.status(404).json({ error: "Unit not found" });
        }
        if (unit.status !== 'available') {
            return res.status(400).json({ error: "Unit is not available" });
        }
        const newContract = await prisma_1.default.contract.create({
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
        await prisma_1.default.unit.update({
            where: { id: unitId },
            data: { status: 'rented' }
        });
        res.status(201).json(newContract);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create contract" });
    }
});
// UPDATE contract
router.put("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, draft, endDate, monthlyRate } = req.body;
        const updatedContract = await prisma_1.default.contract.update({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update contract" });
    }
});
// DELETE contract
router.delete("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // First get the contract to get the unitId
        const contract = await prisma_1.default.contract.findUnique({
            where: { id: Number(id) }
        });
        if (!contract) {
            return res.status(404).json({ error: "Contract not found" });
        }
        await prisma_1.default.contract.delete({
            where: { id: Number(id) },
        });
        // Update unit status back to available
        await prisma_1.default.unit.update({
            where: { id: contract.unitId },
            data: { status: 'available' }
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete contract" });
    }
});
// GET contracts by client ID
router.get("/client/:clientId", auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.params;
        const contracts = await prisma_1.default.contract.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch client contracts" });
    }
});
// GET contracts statistics
router.get("/stats/overview", auth_1.authenticateToken, async (req, res) => {
    try {
        const totalContracts = await prisma_1.default.contract.count();
        const activeContracts = await prisma_1.default.contract.count({
            where: { draft: false }
        });
        const draftContracts = await prisma_1.default.contract.count({
            where: { draft: true }
        });
        res.json({
            total: totalContracts,
            active: activeContracts,
            drafts: draftContracts
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch contract statistics" });
    }
});
exports.default = router;
