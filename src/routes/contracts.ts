
import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";

const router = Router();
async function createNotification({
    type,
    title,
    message,
    userId, clientId,
    contractId,
}: {
    type: string;
    title: string;
    message: string;
    userId?: number; clientId: string;  // required
    contractId?: number;
}) {
    return prisma.notification.create({
        data: {
            type,
            title,
            message,
            userId,
            clientId,       // ✅ include here
            contractId,
        },
    });
}

/**
 * 📄 GET all contracts
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
 * ✍️ CREATE new contract
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { clientId, unitId, monthlyRate, startDate, endDate, title, content, draft } =
            req.body;
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
            include: {
                client: true,
                unit: true,
                user: true,
            },
        });

        await createNotification({
            type: "contract_created",
            title: "New Contract",
            message: `Contract "${newContract.title}" created for ${newContract.client.name}`,
            userId: createdBy,
            contractId: newContract.id, clientId: newContract.clientId,
        });


        res.status(201).json(newContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create contract" });
    }
});


/**
 * 🔄 UPDATE contract
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
            include: {
                client: true,
                unit: true,
                user: true,
            },
        });
        await createNotification({
            type: "contract_updated",
            title: "Contract Updated",
            message: `Contract "${updatedContract.title}" updated`,
            userId: req.user.id,
            contractId: updatedContract.id,
            clientId: updatedContract.clientId,
        });


        res.json(updatedContract);
    } catch (err: any) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Contract not found" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to update contract" });
    }
});

/**
 * 🗑 DELETE contract
 */
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await prisma.contract.delete({
            where: { id: Number(id) },
        });

        await createNotification({
            type: "contract_deleted",
            title: "Contract Deleted",
            message: `Contract #${id} deleted`,
            userId: req.user.id,
            contractId: deleted.id, clientId: deleted.clientId,
        });


        res.json({ success: true });
    } catch (err: any) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Contract not found" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to delete contract" });
    }
});

/**
 * 📑 CREATE draft contract
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
            include: {
                client: true,
                unit: true,
                user: true,
            },
        });

        await createNotification({
            type: "contract_draft",
            title: "Draft Contract Created",
            message: `Draft contract created for ${draftContract.client.name}`,
            userId: createdBy,
            contractId: draftContract.id, clientId: draftContract.clientId,
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
            include: {
                client: true,
                unit: true,
                user: true,
            },
        });

        await createNotification({
            type: "contract_finalized",
            title: "Contract Finalized",
            message: `Contract "${finalizedContract.title}" finalized`,
            userId: req.user.id,
            contractId: finalizedContract.id, clientId: finalizedContract.clientId,
        });

        res.json(finalizedContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to finalize contract" });
    }
});
/**
 * ✍️ SIGN contract (client action)
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
            include: {
                client: true,
                unit: true,
                user: true,
            },
        });

        await createNotification({
            type: "contract_signed",
            title: "Contract Signed",
            message: `Contract "${signedContract.title}" signed`,
            userId,
            contractId: signedContract.id, clientId: signedContract.clientId,
        });

        res.json(signedContract);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to sign contract" });
    }
});

export default router;
