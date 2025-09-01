import { Router } from "express";
import { db } from "../db";
import { Client } from "../types";

const router = Router();

// GET all clients
router.get("/", (req, res) => {
    res.json([...db.clients].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
});

// POST new client
router.post("/", (req, res) => {
    const { name, email, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const client: Client = {
        id: String(Date.now()),
        name,
        email,
        phone,
        notes, hasPaid: false,
        hasKeys: false,
        createdAt: new Date().toISOString(),
    };
    db.clients.push(client);
    res.status(201).json(client);
});

// PUT update client
router.put("/:id", (req, res) => {
    const client = db.clients.find((c) => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: "Not found" });

    Object.assign(client, req.body);
    res.json(client);
});

// DELETE client
router.delete("/:id", (req, res) => {
    const idx = db.clients.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    db.clients.splice(idx, 1);
    res.status(204).send();
});

export default router;
