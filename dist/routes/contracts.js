"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const puppeteer_1 = __importDefault(require("puppeteer"));
const router = (0, express_1.Router)();
async function createNotification({ type, title, message, userId, clientId, contractId, }) {
    return prisma_1.default.notification.create({
        data: {
            type,
            title,
            message,
            userId,
            clientId, // ✅ include here
            contractId,
        },
    });
}
/**
 * 📄 GET all contracts
 */
router.get("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const contracts = await prisma_1.default.contract.findMany({
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                unit: { select: { id: true, type: true, status: true, monthlyRate: true } },
                user: { select: { id: true, username: true, email: true } },
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
/**
 * ✍️ CREATE new contract
 */
router.post("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId, unitId, monthlyRate, startDate, endDate, title, content, draft } = req.body;
        const createdBy = req.user.id;
        const newContract = await prisma_1.default.contract.create({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create contract" });
    }
});
/**
 * 🔄 UPDATE contract
 */
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
    }
    catch (err) {
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
router.delete("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await prisma_1.default.contract.delete({
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
    }
    catch (err) {
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
router.post("/draft/:clientId", auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.params;
        const { unitId, monthlyRate, startDate, endDate } = req.body;
        const createdBy = req.user.id;
        const draftContract = await prisma_1.default.contract.create({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create draft contract" });
    }
});
/**
 * ✅ FINALIZE contract (admin action)
 */
router.patch("/:id/finalize", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const finalizedContract = await prisma_1.default.contract.update({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to finalize contract" });
    }
});
/**
 * ✍️ SIGN contract (client action)
 */
router.patch("/:id/sign", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const signedContract = await prisma_1.default.contract.update({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to sign contract" });
    }
});
// ...other imports at top of file
// make sure authenticateToken is already imported
// GET /contracts/:id/pdf
router.get("/:id/pdf", auth_1.authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id || isNaN(id))
            return res.status(400).json({ error: "Contract id must be a number" });
        const contract = await prisma_1.default.contract.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                unit: { select: { id: true, type: true, monthlyRate: true, address_street: true, city: true, province: true, country: true, postal_code: true } },
                user: { select: { id: true, username: true, email: true } },
            },
        });
        if (!contract)
            return res.status(404).json({ error: "Contract not found" });
        // Build HTML for PDF. Customize styles and content as needed.
        const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Contract #${contract.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #111827; padding: 40px; }
            header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; }
            .logo { font-weight:700; color:#e11d48; font-size:20px; }
            h1 { font-size:20px; margin:0 0 8px 0; }
            .meta { font-size:12px; color:#6b7280; }
            .section { margin-top:20px; }
            .section h2 { font-size:14px; margin-bottom:8px; }
            table { width:100%; border-collapse: collapse; }
            td, th { padding:8px 6px; vertical-align:top; }
            .two-col { display:flex; gap:20px; }
            .col { flex:1; }
            .signature { margin-top:40px; display:flex; justify-content:space-between; gap:20px; }
            .sig-block { width:45%; border-top:1px solid #e5e7eb; padding-top:8px; text-align:center; color:#374151; }
          </style>
        </head>
        <body>
          <header>
            <div class="logo">STORAGE</div>
            <div class="meta">
              Contract #: ${contract.id}<br/>
              Created: ${contract.createdAt.toISOString().split("T")[0]}
            </div>
          </header>

          <h1>${contract.title}</h1>
          <p class="meta">Client: <strong>${contract.client?.name ?? "—"}</strong> &middot; Email: ${contract.client?.email ?? "—"} &middot; Phone: ${contract.client?.phone ?? "—"}</p>

          <div class="section">
            <h2>Unit details</h2>
            <table>
              <tr>
                <th style="text-align:left">Unit ID</th>
                <td>${contract.unit?.id ?? "—"}</td>
                <th style="text-align:left">Type</th>
                <td>${contract.unit?.type ?? "—"}</td>
              </tr>
              <tr>
                <th style="text-align:left">Monthly rate</th>
                <td>${contract.monthlyRate ?? contract.unit?.monthlyRate ?? "—"} €</td>
                <th style="text-align:left">Address</th>
                <td>${[contract.unit?.address_street, contract.unit?.city, contract.unit?.province, contract.unit?.country, contract.unit?.postal_code].filter(Boolean).join(", ") || "—"}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>Contract period</h2>
            <p>Start date: <strong>${contract.startDate.toISOString().split("T")[0]}</strong></p>
            <p>End date: <strong>${contract.endDate ? contract.endDate.toISOString().split("T")[0] : "—"}</strong></p>
          </div>

          <div class="section">
            <h2>Content</h2>
            <div style="white-space:pre-wrap; line-height:1.45;">${escapeHtml(contract.content || "")}</div>
          </div>

          <div class="signature">
            <div class="sig-block">
              Client signature<br/><br/>${contract.client?.name ?? "Client"}
            </div>

            <div class="sig-block">
              Provider signature<br/><br/>${contract.user?.username ?? "Provider"}
            </div>
          </div>

        </body>
      </html>
    `;
        // Launch puppeteer, render HTML to PDF buffer
        const browser = await puppeteer_1.default.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
        });
        await browser.close();
        // Send PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=contract-${contract.id}.pdf`);
        res.send(pdfBuffer);
    }
    catch (err) {
        console.error("Failed to generate PDF:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});
// Helper to escape HTML (very minimal)
function escapeHtml(unsafe) {
    return (unsafe || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
/**
 * 📑 CREATE full contract (skip draft)
 */
router.post("/full/:clientId", auth_1.authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.params;
        const { unitId, monthlyRate, startDate, endDate } = req.body;
        const createdBy = req.user.id;
        // Fetch client + unit so we can build contract content
        const client = await prisma_1.default.client.findUnique({ where: { id: clientId } });
        const unit = await prisma_1.default.unit.findUnique({ where: { id: Number(unitId) } });
        if (!client || !unit) {
            return res.status(404).json({ error: "Client or Unit not found" });
        }
        // Example template for full contract content
        const contractContent = `
      Rental Agreement
      -------------------------
      This contract is between ${client.name} (Client) and STORAGE (Provider).
      
      Unit: ${unit.type} (ID: ${unit.id})
      Monthly Rate: €${monthlyRate ?? unit.monthlyRate}
      Rental Period: ${startDate} to ${endDate || "Open-ended"}

      The client agrees to the terms and conditions for renting the storage unit.
    `;
        const fullContract = await prisma_1.default.contract.create({
            data: {
                clientId,
                unitId: Number(unitId),
                monthlyRate,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                title: `Contract with ${client.name}`,
                content: contractContent.trim(),
                draft: false, // 👈 not a draft
                createdBy,
            },
            include: {
                client: true,
                unit: true,
                user: true,
            },
        });
        await createNotification({
            type: "contract_created_full",
            title: "Full Contract Created",
            message: `Contract "${fullContract.title}" created for ${client.name}`,
            userId: createdBy,
            contractId: fullContract.id,
            clientId: fullContract.clientId,
        });
        res.status(201).json(fullContract);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create full contract" });
    }
});
exports.default = router;
