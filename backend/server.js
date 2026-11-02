
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./src/config/database");

const authRoutes = require("./src/routes/auth");
const productsRoutes = require("./src/routes/products");
const ordersRoutes = require("./src/routes/orders");

const app = express();

app.use(cors());
app.use(express.json());

// ROTAS
app.use("/api/auth", authRoutes);
app.use("/api/produtos", productsRoutes);
app.use("/api/pedidos", ordersRoutes);

// ROTA INICIAL
app.get("/", (req, res) => {
    res.send("Glow Up API funcionando!");
});

// VERIFICAR STATUS DA API E DO POSTGRESQL
app.get("/api/status", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            api: "online",
            database: "connected"
        });

    } catch (error) {
        console.error("ERRO NA CONEXÃO COM POSTGRESQL:", error);

        res.status(500).json({
            api: "online",
            database: "disconnected"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Glow Up API rodando na porta ${PORT}`);
});
