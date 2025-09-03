import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET all clients
router.get('/', async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            include: {
                contracts: true,
                units: true
            }
        })
        res.json(clients)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' })
    }
})

// GET single client by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                contracts: true,
                units: true
            }
        })

        if (!client) {
            return res.status(404).json({ error: 'Client not found' })
        }

        res.json(client)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' })
    }
})

// POST new client
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body
        const client = await prisma.client.create({
            data: {
                name,
                email,
                phone,
                notes
            }
        })
        res.status(201).json(client)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create client' })
    }
})

// PUT update client
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, notes, hasPaid, hasKeys } = req.body;

        const client = await prisma.client.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                notes,
                hasPaid,
                hasKeys
            }
        });

        res.json(client);
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2025") {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(500).json({ error: "Failed to update client" });
    }
});

// DELETE client
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.client.delete({
            where: { id }
        })

        res.status(204).send()
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(500).json({ error: 'Failed to delete client' })
    }
})

export default router;