"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnits = exports.createUnit = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createUnit = async (type, monthlyRate, createdBy, clientId) => {
    return prisma_1.default.unit.create({
        data: {
            type,
            monthlyRate,
            createdBy,
            clientId,
            status: "available",
        },
    });
};
exports.createUnit = createUnit;
const getUnits = async () => {
    return prisma_1.default.unit.findMany({
        include: {
            client: true,
            user: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUnits = getUnits;
