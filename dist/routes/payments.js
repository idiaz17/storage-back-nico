"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const notificationService_1 = require("../services/notificationService");
const puppeteer_1 = __importDefault(require("puppeteer"));
const router = (0, express_1.Router)();
// GET all payments
router.get("/", async (req, res) => {
    try {
        const payments = await prisma_1.default.payment.findMany({
            include: {
                client: { select: { id: true, name: true } },
                unit: { select: { id: true, type: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(payments);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});
// POST create a new payment
router.post("/", async (req, res) => {
    try {
        const { clientId, unitId, amount } = req.body;
        if (!clientId || !unitId || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Validate amount is positive
        if (Number(amount) <= 0) {
            return res.status(400).json({ error: "Amount must be positive" });
        }
        // Ensure client exists
        const client = await prisma_1.default.client.findUnique({ where: { id: clientId } });
        if (!client)
            return res.status(400).json({ error: "Invalid clientId" });
        // Ensure unit exists and belongs to client
        const unit = await prisma_1.default.unit.findUnique({
            where: { id: Number(unitId) }
        });
        if (!unit) {
            return res.status(400).json({ error: "Invalid unitId" });
        }
        if (unit.clientId !== clientId) {
            return res.status(400).json({ error: "Unit does not belong to client" });
        }
        const payment = await prisma_1.default.payment.create({
            data: {
                clientId,
                unitId: Number(unitId),
                amount: Number(amount),
                status: "pending",
            },
        });
        await (0, notificationService_1.createNotification)({
            clientId: payment.clientId,
            userId: req.user.id, // must match User.id type
            title: "New Payment Created",
            message: `A new payment of $${payment.amount} has been created for unit ${unit.type}.`,
            type: "info",
            relatedEntity: "payment",
            entityId: payment.id,
        });
        res.status(201).json(payment);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create payment" });
    }
});
// PATCH update payment
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paidAt } = req.body;
        const payment = await prisma_1.default.payment.findUnique({ where: { id } });
        if (!payment)
            return res.status(404).json({ error: "Payment not found" });
        const updatedPayment = await prisma_1.default.payment.update({
            where: { id },
            data: {
                status: status,
                paidAt: paidAt ? new Date(paidAt) : null,
            },
        });
        let message = "";
        let type = "info";
        if (status === "paid") {
            message = `Your payment of $${payment.amount} has been received.`;
            type = "success";
        }
        else if (status === "overdue") {
            message = `Your payment of $${payment.amount} is overdue.`;
            type = "warning";
        }
        if (message) {
            await (0, notificationService_1.createNotification)({
                clientId: payment.clientId,
                title: "Payment Updated",
                message: `A new payment of $${payment.amount} has been updated for unit ${id}.`,
                type: "info",
                relatedEntity: "payment",
                entityId: payment.id,
                userId: req.user.id, // <-- add this
            });
        }
        res.json(updatedPayment);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update payment" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Check if payment exists
        const payment = await prisma_1.default.payment.findUnique({ where: { id } });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        // Delete the payment
        await prisma_1.default.payment.delete({
            where: { id },
        });
        res.json({ success: true, message: "Payment deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete payment" });
    }
});
router.get("/:id/invoice", async (req, res) => {
    try {
        const id = req.params.id;
        const payment = await prisma_1.default.payment.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                unit: { select: { id: true, type: true, monthlyRate: true } },
            },
        });
        if (!payment)
            return res.status(404).json({ error: "Payment not found" });
        // Build HTML invoice
        const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            header { display:flex; justify-content:space-between; margin-bottom: 40px; }
            .logo { font-weight: bold; font-size: 24px; color: #e11d48; }
            h1 { font-size: 20px; margin-bottom: 10px; }
            .meta { font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; border-bottom: 1px solid #ccc; text-align: left; }
            .total { text-align: right; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <header>
            <div class="logo">STORAGE</div>
            <div class="meta">
              Invoice #: ${payment.id}<br/>
              Date: ${payment.createdAt.toISOString().split("T")[0]}
            </div>
          </header>

          <h1>Invoice</h1>
          <p>Client: <strong>${payment.client?.name ?? "—"}</strong><br/>
          Email: ${payment.client?.email ?? "—"}<br/>
          Phone: ${payment.client?.phone ?? "—"}</p>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Unit</th>
                <th>Amount (€)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Payment for storage unit rental</td>
                <td>${payment.unit?.type ?? "—"} (ID: ${payment.unit?.id ?? "—"})</td>
                <td>${payment.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total: €${payment.amount.toFixed(2)}
          </div>
        </body>
      </html>
    `;
        // Render PDF with Puppeteer
        const browser = await puppeteer_1.default.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
        });
        await browser.close();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${payment.id}.pdf`);
        res.send(pdfBuffer);
    }
    catch (err) {
        console.error("Failed to generate invoice:", err);
        res.status(500).json({ error: "Failed to generate invoice" });
    }
});
exports.default = router;
