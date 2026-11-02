
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    console.log("AUTH MIDDLEWARE EXECUTADO");

    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Faça login para continuar."
        });
    }

    const token = authorization.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.cliente = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Sessão inválida ou expirada. Entre novamente."
        });
    }
}

function adminMiddleware(req, res, next) {
    console.log("ADMIN MIDDLEWARE EXECUTADO");
    console.log("USUÁRIO AUTENTICADO:", req.cliente);

    if (!req.cliente || req.cliente.perfil !== "admin") {
        return res.status(403).json({
            message: "Acesso permitido somente para administradores.",
            perfilRecebido: req.cliente?.perfil || null
        });
    }

    next();
}

module.exports = {
    authMiddleware,
    adminMiddleware
};
