"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function createNotification({ clientId, userId, title, message, type = "info", relatedEntity = null, entityId = null, }) {
    return prisma_1.default.notification.create({
        data: {
            clientId, // directly assign clientId
            userId, // directly assign userId
            title,
            message,
            type,
            relatedEntity,
            entityId,
        },
    });
}
