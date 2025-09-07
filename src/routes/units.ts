
import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();


// GET all units
router.get("/", async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            include: {
                client: { include: { contracts: true, payment: true, notification: true } },
                contracts: true,
                Payment: true,
                user: { select: { id: true, username: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(units);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch units" });
    }
});

// GET unit by ID
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Unit id must be a number" });

    try {
        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                client: { include: { contracts: true, payment: true, notification: true } },
                contracts: true,
                Payment: true,
                user: { select: { id: true, username: true, email: true } },
            },
        });

        if (!unit) return res.status(404).json({ error: "Unit not found" });

        res.json(unit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch unit" });
    }
});

// GET unit timeline
router.get("/:id/timeline", async (req, res) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Unit id must be a number" });

    try {
        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                Payment: true,
                contracts: true,
                client: { include: { notification: true } },
            },
        });

        if (!unit) return res.status(404).json({ error: "Unit not found" });

        const timeline = [
            ...unit.Payment.map(p => ({ type: "payment", createdAt: p.createdAt, detail: `Payment of $${p.amount} (${p.status})` })),
            ...unit.contracts.map(c => ({ type: "contract", createdAt: c.createdAt, detail: `Contract: ${c.title} (${c.signed ? "signed" : "draft"})` })),
            ...(unit.client?.notification ?? []).map(n => ({ type: "notification", createdAt: n.createdAt, detail: `${n.title}: ${n.message}` })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.json({ unitId: unit.id, timeline });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
});

// POST new unit
// POST new unit
router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      type,
      status,
      clientId,
      monthlyRate,
      latitude,
      longitude,
      address_street,
      city,
      province,
      country,
      postal_code,
    } = req.body;

    const newUnit = await prisma.unit.create({
      data: {
        type,
        status,
        monthlyRate: typeof monthlyRate === "string" ? parseFloat(monthlyRate) : monthlyRate,
        latitude,
        longitude,
        address_street,
        city,
        province,
        country,
        postal_code,
        user: { connect: { id: userId } },
        ...(clientId && { client: { connect: { id: clientId } } }),
      },
    });

    res.status(201).json(newUnit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create unit" });
  }
});

// PUT update unit
router.put("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: "Unit id must be a number" });

  try {
    const {
      type,
      status,
      clientId,
      monthlyRate,
      latitude,
      longitude,
      address_street,
      city,
      province,
      country,
      postal_code,
    } = req.body;

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        type,
        status,
        monthlyRate: typeof monthlyRate === "string" ? parseFloat(monthlyRate) : monthlyRate,
        latitude,
        longitude,
        address_street,
        city,
        province,
        country,
        postal_code,
        client: clientId ? { connect: { id: clientId } } : { disconnect: true },
      },
    });

    res.json(updatedUnit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update unit" });
  }
});

// DELETE unit
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Unit id must be a number" });

    try {
        await prisma.unit.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete unit" });
    }
});



// Assign a unit to the logged-in user
// PATCH: Assign a unit to logged-in client
router.patch("/:id/assign", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const unitId = Number(req.params.id);
        const { id: userId, clientId } = req.user!;

        if (!clientId) {
            return res.status(400).json({ error: "User is not linked to a client" });
        }

        const unit = await prisma.unit.findUnique({ where: { id: unitId } });
        if (!unit) return res.status(404).json({ error: "Unit not found" });
        if (unit.status !== "available") {
            return res.status(400).json({ error: "Unit not available" });
        }

        const updatedUnit = await prisma.unit.update({
            where: { id: unitId },
            data: {
                status: "rented",
                client: { connect: { id: clientId } },
                user: { connect: { id: userId } },
            },
            include: { client: true, user: true },
        });

        res.json({ success: true, unit: updatedUnit });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to assign unit" });
    }
});


export default router;
