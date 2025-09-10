"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
let _id = 0;
const uid = () => String(++_id);
// export const db = {
//     clients: [] as Client[],
//     units: [
//         { id: uid(), label: "A-101", size: "10m²", status: "available" },
//         { id: uid(), label: "A-102", size: "6m²", status: "maintenance" },
//         { id: uid(), label: "B-201", size: "12m²", status: "rented" },
//     ] as Unit[],
//     contracts: [] as Contract[],
//     payments: [] as Payment[],
// };
// // seed clients
// if (db.clients.length === 0) {
//     db.clients.push(
//         { id: uid(), name: "Alice Johnson", email: "alice@example.com", phone: "+34 600 000 001", createdAt: new Date().toISOString() },
//         { id: uid(), name: "Bob Pérez", email: "bob@example.com", phone: "+34 600 000 002", createdAt: new Date().toISOString() }
//     );
// }
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL if needed for production (e.g., on Heroku)
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
exports.default = pool;
