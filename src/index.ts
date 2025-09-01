import express from "express";
import cors from "cors";
import clientsRouter from "./routes/clients";
import unitsRouter from "./routes/units"

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Storage Manager API running"));
app.use("/clients", clientsRouter);
app.use("/units", unitsRouter);

app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
