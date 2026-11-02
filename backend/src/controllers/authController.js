
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// CADASTRO DE CLIENTES
async function register(req, res) {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                message: "Preencha todos os campos."
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                message: "A senha precisa ter pelo menos 8 caracteres."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const [existingUser] = await db.query(
            "SELECT id FROM clientes WHERE email = ?",
            [emailNormalizado]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Este e-mail já está cadastrado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const [result] = await db.query(
            "INSERT INTO clientes (nome, email, senha_hash) VALUES (?, ?, ?)",
            [nome.trim(), emailNormalizado, senhaHash]
        );

        res.status(201).json({
            message: "Cadastro realizado com sucesso!",
            cliente: {
                id: result.insertId,
                nome: nome.trim(),
                email: emailNormalizado,
                perfil: "cliente"
            }
        });

    } catch (error) {
        console.error("Erro no cadastro:", error);

        res.status(500).json({
            message: "Erro ao cadastrar cliente."
        });
    }
}

// LOGIN DE CLIENTES
async function login(req, res) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                message: "Informe seu e-mail e sua senha."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const [users] = await db.query(
            `SELECT id, nome, email, senha_hash, perfil
             FROM clientes
             WHERE email = ?
             LIMIT 1`,
            [emailNormalizado]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "E-mail ou senha incorretos."
            });
        }

        const cliente = users[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            cliente.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                message: "E-mail ou senha incorretos."
            });
        }

        const token = jwt.sign(
            {
                id: cliente.id,
                email: cliente.email,
                perfil: cliente.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            message: "Login realizado com sucesso!",
            token,
            cliente: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                perfil: cliente.perfil
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);

        res.status(500).json({
            message: "Erro ao realizar login."
        });
    }
}

module.exports = {
    register,
    login
};
