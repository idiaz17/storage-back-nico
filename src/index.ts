import express from "express";
import cors from "cors";
import clientsRouter from "./routes/clients";
import unitsRouter from "./routes/units";
import notificationsRouter from "./routes/notifications";
import authRouter from "./routes/auth";
import { authenticateToken } from "./middleware/auth";

const app = express();
const PORT = 4000;



app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Storage Manager API running"));

// Public routes
app.use("/auth", authRouter);

// Protected routes
app.use("/clients", authenticateToken, clientsRouter);
app.use("/units", authenticateToken, unitsRouter);
app.use("/notifications", authenticateToken, notificationsRouter); // Add this

app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
});