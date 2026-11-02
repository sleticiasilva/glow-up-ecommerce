const express = require("express");
const router = express.Router();

const {
    authMiddleware,
    adminMiddleware
} = require("../middlewares/authMiddleware");

const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productsController");

// Listar produtos (público)
router.get("/", getProducts);

// Rotas administrativas
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    createProduct
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    deleteProduct
);

module.exports = router;