
const db = require("../config/database");

async function createOrder(req, res) {
    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        const clienteId = req.cliente.id;
        const { itens } = req.body;

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({
                message: "Seu carrinho está vazio."
            });
        }

        const produtosAgrupados = new Map();

        for (const item of itens) {
            const produtoId = Number(item.produto_id);
            const quantidade = Number(item.quantidade);

            if (
                !Number.isInteger(produtoId) ||
                produtoId <= 0 ||
                !Number.isInteger(quantidade) ||
                quantidade <= 0
            ) {
                return res.status(400).json({
                    message: "Produto ou quantidade inválidos."
                });
            }

            produtosAgrupados.set(
                produtoId,
                (produtosAgrupados.get(produtoId) || 0) + quantidade
            );
        }

        await connection.beginTransaction();
        transactionStarted = true;

        let total = 0;
        const itensPedido = [];

        for (const [produtoId, quantidade] of produtosAgrupados) {
            const [produtos] = await connection.query(
                `SELECT id, nome, preco, estoque
                 FROM produtos
                 WHERE id = ?
                 FOR UPDATE`,
                [produtoId]
            );

            if (produtos.length === 0) {
                throw new Error(`Produto ${produtoId} não encontrado.`);
            }

            const produto = produtos[0];

            if (produto.estoque < quantidade) {
                throw new Error(
                    `Estoque insuficiente para ${produto.nome}.`
                );
            }

            const preco = Number(produto.preco);
            total += preco * quantidade;

            itensPedido.push({
                produto_id: produto.id,
                quantidade,
                preco_unitario: preco
            });
        }

        const [pedido] = await connection.query(
            `INSERT INTO pedidos (cliente_id, total, status)
             VALUES (?, ?, ?)`,
            [clienteId, total, "Pendente"]
        );

        const pedidoId = pedido.insertId;

        for (const item of itensPedido) {
            await connection.query(
                `INSERT INTO itens_pedido
                 (pedido_id, produto_id, quantidade, preco_unitario)
                 VALUES (?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.produto_id,
                    item.quantidade,
                    item.preco_unitario
                ]
            );

            await connection.query(
                `UPDATE produtos
                 SET estoque = estoque - ?
                 WHERE id = ?`,
                [item.quantidade, item.produto_id]
            );
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: "Pedido realizado com sucesso!",
            pedido: {
                id: pedidoId,
                cliente_id: clienteId,
                total: Number(total.toFixed(2)),
                status: "Pendente"
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error("Erro ao criar pedido:", error);

        return res.status(500).json({
            message: error.message || "Não foi possível realizar o pedido."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function getMyOrders(req, res) {
    try {
        const clienteId = req.cliente.id;

        const [pedidos] = await db.query(
            `SELECT
                p.id,
                p.total,
                p.status,
                p.criado_em,
                ip.produto_id,
                pr.nome AS produto_nome,
                pr.imagem AS produto_imagem,
                ip.quantidade,
                ip.preco_unitario
             FROM pedidos p
             LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
             LEFT JOIN produtos pr ON pr.id = ip.produto_id
             WHERE p.cliente_id = ?
             ORDER BY p.criado_em DESC`,
            [clienteId]
        );

        const pedidosOrganizados = {};

        for (const item of pedidos) {
            if (!pedidosOrganizados[item.id]) {
                pedidosOrganizados[item.id] = {
                    id: item.id,
                    total: Number(item.total),
                    status: item.status,
                    criado_em: item.criado_em,
                    itens: []
                };
            }

            if (item.produto_id) {
                pedidosOrganizados[item.id].itens.push({
                    produto_id: item.produto_id,
                    nome: item.produto_nome,
                    imagem: item.produto_imagem,
                    quantidade: item.quantidade,
                    preco_unitario: Number(item.preco_unitario)
                });
            }
        }

        return res.json(Object.values(pedidosOrganizados));

    } catch (error) {
        console.error("Erro ao consultar pedidos:", error);

        return res.status(500).json({
            message: "Não foi possível consultar seus pedidos."
        });
    }
}

// ADMIN: CONSULTAR TODOS OS PEDIDOS
async function getAllOrders(req, res) {
    try {
        const [pedidos] = await db.query(
            `SELECT
                p.id,
                p.total,
                p.status,
                p.criado_em,
                c.id AS cliente_id,
                c.nome AS cliente_nome,
                c.email AS cliente_email,
                ip.produto_id,
                pr.nome AS produto_nome,
                pr.imagem AS produto_imagem,
                ip.quantidade,
                ip.preco_unitario
             FROM pedidos p
             INNER JOIN clientes c ON c.id = p.cliente_id
             LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
             LEFT JOIN produtos pr ON pr.id = ip.produto_id
             ORDER BY p.criado_em DESC`
        );

        const pedidosOrganizados = {};

        for (const item of pedidos) {
            if (!pedidosOrganizados[item.id]) {
                pedidosOrganizados[item.id] = {
                    id: item.id,
                    total: Number(item.total),
                    status: item.status,
                    criado_em: item.criado_em,
                    cliente: {
                        id: item.cliente_id,
                        nome: item.cliente_nome,
                        email: item.cliente_email
                    },
                    itens: []
                };
            }

            if (item.produto_id) {
                pedidosOrganizados[item.id].itens.push({
                    produto_id: item.produto_id,
                    nome: item.produto_nome,
                    imagem: item.produto_imagem,
                    quantidade: item.quantidade,
                    preco_unitario: Number(item.preco_unitario)
                });
            }
        }

        return res.json(Object.values(pedidosOrganizados));

    } catch (error) {
        console.error("Erro ao consultar todos os pedidos:", error);

        return res.status(500).json({
            message: "Não foi possível consultar os pedidos."
        });
    }
}

// ADMIN: ATUALIZAR STATUS DO PEDIDO
async function updateOrderStatus(req, res) {
    try {
        const pedidoId = Number(req.params.id);
        const { status } = req.body;

        const statusPermitidos = [
            "Pendente",
            "Em processamento",
            "Enviado",
            "Entregue"
        ];

        if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
            return res.status(400).json({
                message: "ID do pedido inválido."
            });
        }

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                message: "Status inválido."
            });
        }

        const [resultado] = await db.query(
            `UPDATE pedidos
             SET status = ?
             WHERE id = ?`,
            [status, pedidoId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                message: "Pedido não encontrado."
            });
        }

        return res.json({
            message: "Status do pedido atualizado com sucesso!",
            pedido: {
                id: pedidoId,
                status
            }
        });

    } catch (error) {
        console.error("Erro ao atualizar status:", error);

        return res.status(500).json({
            message: "Não foi possível atualizar o status do pedido."
        });
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
};
