const express = require("express");
const router = express.Router();

const {
    authMiddleware,
    adminMiddleware
} = require("../middlewares/authMiddleware");

const ordersController = require("../controllers/ordersController");

// Rotas dos clientes
router.post("/", authMiddleware, ordersController.createOrder);
router.get("/meus", authMiddleware, ordersController.getMyOrders);

// Rotas administrativas
router.get(
    "/admin/todos",
    authMiddleware,
    adminMiddleware,
    ordersController.getAllOrders
);

router.patch(
    "/admin/:id/status",
    authMiddleware,
    adminMiddleware,
    ordersController.updateOrderStatus
);

module.exports = router;