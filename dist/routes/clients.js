"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const authorizeRole_1 = require("../middleware/authorizeRole");
const router = (0, express_1.Router)();
/**
 * GET all clients (with related entities)
 * CRM-style: show full picture (contracts, units, payments, activities)
 */
router.get("/", async (req, res) => {
    try {
        const clients = await prisma_1.default.client.findMany({
            include: {
                contracts: true,
                units: true,
                payment: true,
                notification: true,
            },
        });
        res.json(clients);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});
/**
 * GET single client with a "CRM dashboard view"
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const client = await prisma_1.default.client.findUnique({
            where: { id },
            include: {
                contracts: true,
                units: true,
                payment: true,
                notification: true,
            },
        });
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        res.json(client);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch client" });
    }
});
/**
 * POST new client
 * CRM-style: log an activity when client is created
 */
router.post("/", async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;
        const client = await prisma_1.default.client.create({
            data: { name, email, phone, notes },
        });
        // Log CRM activity
        await prisma_1.default.activity.create({
            data: {
                userId: req.user.id,
                clientId: client.id,
                type: "client_created",
                details: `Client ${client.name} was added.`,
            },
        });
        res.status(201).json(client);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create client" });
    }
});
/**
 * PUT update client
 * CRM-style: track changes in activity log
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, notes, hasPaid, hasKeys } = req.body;
        const client = await prisma_1.default.client.update({
            where: { id },
            data: { name, email, phone, notes, hasPaid, hasKeys },
        });
        await prisma_1.default.activity.create({
            data: {
                userId: req.user.id,
                clientId: client.id,
                type: "client_updated",
                details: `Client ${client.name} was updated.`,
            },
        });
        res.json(client);
    }
    catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(500).json({ error: "Failed to update client" });
    }
});
/**
 * DELETE client
 * CRM-style: log the removal in activity
 */
router.delete("/:id", (0, authorizeRole_1.authorizeRole)(["ADMIN"]), async (req, res) => {
    try {
        const { id } = req.params;
        const client = await prisma_1.default.client.delete({ where: { id } });
        await prisma_1.default.activity.create({
            data: {
                userId: req.user.id,
                clientId: client.id,
                type: "client_deleted",
                details: `Client ${client.name} was deleted.`,
            },
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(500).json({ error: "Failed to delete client" });
    }
});
exports.default = router;
