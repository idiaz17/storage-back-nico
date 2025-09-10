"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
/**
 * GET all available units (public)
 */
router.get("/available", async (req, res) => {
    try {
        const units = await prisma_1.default.unit.findMany({
            where: { status: "available" },
            select: {
                id: true,
                type: true,
                monthlyRate: true,
                latitude: true,
                longitude: true,
                address_street: true,
                city: true, // Add this
                province: true, // Add this
                country: true, // Add this
                postal_code: true, // Add this
                status: true,
            },
            orderBy: { monthlyRate: "asc" },
        });
        res.json({ data: units });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch available units" });
    }
});
exports.default = router;
