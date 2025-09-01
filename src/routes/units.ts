// routes/units.ts
import { Router } from "express";

const router = Router();

// Mock DB for now
let units = [
    { id: "1", type: "2x2", status: "available", clientId: null, monthlyRate: 100 },
    { id: "2", type: "3x3", status: "rented", clientId: null, monthlyRate: 120 },
    { id: "3", type: "4x4", status: "maintenance", clientId: null, monthlyRate: 140 },
];

router.get("/", (req, res) => {
    res.json(units);
});

router.post("/", (req, res) => {
    const { type, status, clientId, monthlyRate } = req.body;
    const newUnit = { id: Date.now().toString(), type, status, clientId, monthlyRate };
    units.push(newUnit);
    res.status(201).json(newUnit);
});

router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { type, status, clientId } = req.body;
    units = units.map((u) =>
        u.id === id ? { ...u, type, status, clientId } : u
    );
    res.json(units.find((u) => u.id === id));
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;
    units = units.filter((u) => u.id !== id);
    res.json({ success: true });
});

export default router;
