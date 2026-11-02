
const db = require("../config/database");

// LISTAR PRODUTOS
async function getProducts(req, res) {
    try {
        console.log("Buscando produtos no PostgreSQL...");

        const result = await db.query(
            "SELECT * FROM produtos ORDER BY id DESC"
        );

        console.log("Produtos encontrados:", result.rows.length);

        res.json(result.rows);

    } catch (error) {
        console.error("ERRO AO BUSCAR PRODUTOS:", error);

        res.status(500).json({
            message: "Erro ao buscar produtos."
        });
    }
}

// CADASTRAR PRODUTO
async function createProduct(req, res) {
    try {
        const {
            nome,
            descricao,
            categoria,
            preco,
            imagem,
            estoque
        } = req.body;

        if (!nome || !categoria || preco === undefined ||
            estoque === undefined || !imagem) {
            return res.status(400).json({
                message: "Preencha todos os campos obrigatórios."
            });
        }

        const precoNumerico = Number(preco);
        const estoqueNumerico = Number(estoque);

        if (
            !Number.isFinite(precoNumerico) ||
            precoNumerico <= 0 ||
            !Number.isInteger(estoqueNumerico) ||
            estoqueNumerico < 0
        ) {
            return res.status(400).json({
                message: "Preço ou estoque inválido."
            });
        }

        const result = await db.query(
            `INSERT INTO produtos
            (nome, descricao, categoria, preco, imagem, estoque)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [
                nome.trim(),
                descricao || "",
                categoria,
                precoNumerico,
                imagem,
                estoqueNumerico
            ]
        );

        res.status(201).json({
            message: "Produto cadastrado com sucesso!",
            id: result.rows[0].id
        });

    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);

        res.status(500).json({
            message: "Erro ao cadastrar produto."
        });
    }
}

// EDITAR PRODUTO
async function updateProduct(req, res) {
    try {
        const id = Number(req.params.id);

        const {
            nome,
            descricao,
            categoria,
            preco,
            imagem,
            estoque
        } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID de produto inválido."
            });
        }

        if (!nome || !categoria || preco === undefined ||
            estoque === undefined || !imagem) {
            return res.status(400).json({
                message: "Preencha todos os campos obrigatórios."
            });
        }

        const precoNumerico = Number(preco);
        const estoqueNumerico = Number(estoque);

        if (
            !Number.isFinite(precoNumerico) ||
            precoNumerico <= 0 ||
            !Number.isInteger(estoqueNumerico) ||
            estoqueNumerico < 0
        ) {
            return res.status(400).json({
                message: "Preço ou estoque inválido."
            });
        }

        const result = await db.query(
            `UPDATE produtos
            SET nome = $1,
                descricao = $2,
                categoria = $3,
                preco = $4,
                imagem = $5,
                estoque = $6
            WHERE id = $7`,
            [
                nome.trim(),
                descricao || "",
                categoria,
                precoNumerico,
                imagem,
                estoqueNumerico,
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Produto não encontrado."
            });
        }

        res.json({
            message: "Produto atualizado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao atualizar produto:", error);

        res.status(500).json({
            message: "Erro ao atualizar produto."
        });
    }
}

// EXCLUIR PRODUTO
async function deleteProduct(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID de produto inválido."
            });
        }

        const result = await db.query(
            "DELETE FROM produtos WHERE id = $1",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Produto não encontrado."
            });
        }

        res.json({
            message: "Produto excluído com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao excluir produto:", error);

        res.status(500).json({
            message: "Não foi possível excluir o produto. Ele pode estar vinculado a pedidos."
        });
    }
}

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
