console.log("GLOW UP SCRIPT CARREGADO!");

const API_URL = "https://glow-up-ecommerce-ijlp.onrender.com/api/produtos";
const AUTH_API_URL = "https://glow-up-ecommerce-ijlp.onrender.com/api/auth";
const ORDERS_API_URL = "https://glow-up-ecommerce-ijlp.onrender.com/api/pedidos";


// Produtos carregados do banco de dados
let products = [];

let cart = JSON.parse(localStorage.getItem("glowup-cart")) || [];

const productGrid = document.getElementById("product-grid");
const cartPanel = document.getElementById("cart-panel");
const overlay = document.getElementById("overlay");
const modal = document.getElementById("product-modal");

// Caminho das imagens

function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}
function getProductImage(image) {
    if (!image) {
        return "assets/images/placeholder.png";
    }

    if (image.startsWith("http")) {
        return image;
    }

    return `assets/images/${image}`;
}
// Busca os produtos no backend
async function loadProducts() {
    try {
        productGrid.innerHTML = "<p>Carregando produtos...</p>";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Não foi possível buscar os produtos.");
        }

        const data = await response.json();

        products = data.map(product => ({
            id: Number(product.id),
            name: product.nome,
            category: product.categoria,
            description: product.descricao || "",
            price: Number(product.preco),
            image: getProductImage(product.imagem),
            stock: Number(product.estoque)
        }));

        renderProducts();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productGrid.innerHTML =
            "<p>Não foi possível carregar os produtos. Verifique se o servidor está funcionando.</p>";
    }
}

// Exibe os produtos na tela
function renderProducts(list = products) {
    productGrid.innerHTML = list.map(product => `
        <article class="product-card">
            <img src="${product.image}" alt="${product.name}">

            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>

                <span class="product-price">
                    ${formatPrice(product.price)}
                </span>

                <button class="details-button"
                    onclick="showProduct(${product.id})">
                    VER DETALHES
                </button>

                <button class="add-button"
                    onclick="addToCart(${product.id})"
                    ${product.stock <= 0 ? "disabled" : ""}>
                    ${product.stock <= 0 ? "ESGOTADO" : "ADICIONAR AO CARRINHO +"}
                </button>
            </div>
        </article>
    `).join("");

    document.getElementById("no-products").hidden = list.length > 0;
}

// Pesquisa, categoria e ordenação
function filterProducts() {
    const search = document.getElementById("search-input")
        .value.toLowerCase().trim();

    const category = document.getElementById("category-filter").value;
    const sort = document.getElementById("sort-filter").value;

    let filtered = products.filter(product => {
        const matchesName =
            product.name.toLowerCase().includes(search);

        const matchesCategory =
            category === "todos" || product.category === category;

        return matchesName && matchesCategory;
    });

    if (sort === "lowest") {
        filtered.sort((a, b) => a.price - b.price);
    }

    if (sort === "highest") {
        filtered.sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderProducts(filtered);
}

// Detalhes do produto
function showProduct(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) return;

    document.getElementById("modal-image").src = product.image;
    document.getElementById("modal-image").alt = product.name;
    document.getElementById("modal-name").textContent = product.name;
    document.getElementById("modal-description").textContent =
        product.description;

    document.getElementById("modal-price").textContent =
        formatPrice(product.price);

    document.getElementById("modal-add-button").onclick = () => {
        addToCart(product.id);
        closeProductModal();
    };

    modal.classList.add("show");
}

function closeProductModal() {
    modal.classList.remove("show");
}

// Carrinho
function saveCart() {
    localStorage.setItem("glowup-cart", JSON.stringify(cart));
}

function addToCart(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) return;

    if (product.stock <= 0) {
        showToast("Produto sem estoque!");
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    const quantityInCart = existingItem ? existingItem.quantity : 0;

    if (quantityInCart >= product.stock) {
        showToast("Quantidade máxima disponível em estoque!");
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    renderCart();
    animateCart();
    showToast(`${product.name} adicionado à sacola!`);
}

function animateCart() {
    const cartButton = document.getElementById("cart-button");

    cartButton.classList.remove("animate");
    void cartButton.offsetWidth;
    cartButton.classList.add("animate");

    setTimeout(() => {
        cartButton.classList.remove("animate");
    }, 500);
}

function showToast(message) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.textContent = "✓ " + message;
    toast.classList.add("show");

    clearTimeout(window.toastTimeout);

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);

    saveCart();
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    cartItems.innerHTML = cart.length
        ? cart.map(item => `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong>
                    <p>Quantidade: ${item.quantity}</p>
                    <p>${formatPrice(item.price * item.quantity)}</p>
                </div>

                <button onclick="removeFromCart(${item.id})">
                    Remover
                </button>
            </div>
        `).join("")
        : "<p>Seu carrinho está vazio.</p>";

    const quantity = cart.reduce(
        (sum, item) => sum + item.quantity, 0
    );

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
    );

    cartCount.textContent = quantity;
    cartTotal.textContent = formatPrice(total);
}

// Abrir e fechar carrinho
function openCart() {
    cartPanel.classList.add("open");
    overlay.classList.add("show");
}

function closeCart() {
    cartPanel.classList.remove("open");
    overlay.classList.remove("show");
}

document.getElementById("cart-button")
    .addEventListener("click", openCart);

document.getElementById("close-cart")
    .addEventListener("click", closeCart);

overlay.addEventListener("click", closeCart);

// Eventos dos filtros
document.getElementById("search-input")
    .addEventListener("input", filterProducts);

document.getElementById("category-filter")
    .addEventListener("change", filterProducts);

document.getElementById("sort-filter")
    .addEventListener("change", filterProducts);

// Eventos do modal de produto
document.getElementById("close-modal")
    .addEventListener("click", closeProductModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeProductModal();
    }
});
// FINALIZAÇÃO DE PEDIDOS
const checkoutButton = document.getElementById("checkout-button");

checkoutButton?.addEventListener("click", async () => {
    if (cart.length === 0) {
        showToast("Adicione produtos ao carrinho primeiro!");
        return;
    }

    const token = localStorage.getItem("glowup-token");

    if (!token) {
        showToast("Entre na sua conta para finalizar a compra!");

        openAccountModal();
        return;
    }

    const itens = cart.map(item => ({
        produto_id: item.id,
        quantidade: item.quantity
    }));

    checkoutButton.disabled = true;
    checkoutButton.textContent = "Processando...";

    try {
        const response = await fetch(ORDERS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ itens })
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("glowup-token");
                localStorage.removeItem("glowup-client");
                currentClient = null;
                updateAccountDisplay();
            }

            throw new Error(result.message || "Erro ao finalizar pedido.");
        }

        cart = [];
        saveCart();
        renderCart();

        // Atualiza o estoque exibido no catálogo
        await loadProducts();

        showToast(`Pedido #${result.pedido.id} realizado com sucesso!`);

        closeCart();

    } catch (error) {
        showToast(error.message);

    } finally {
        checkoutButton.disabled = false;
        checkoutButton.textContent = "Finalizar pedido";
    }
});
// Botão de pesquisa do cabeçalho
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");

if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
        searchInput.focus();

        document.getElementById("produtos")?.scrollIntoView({
            behavior: "smooth"
        });
    });
}
// AUTENTICAÇÃO DE CLIENTES

let accountMode = "login";

let currentClient = JSON.parse(
    localStorage.getItem("glowup-client")
) || null;

const accountButton = document.getElementById("account-button");
const accountModal = document.getElementById("account-modal");
const closeAccount = document.getElementById("close-account");
const accountForm = document.getElementById("account-form");

const accountTitle = document.getElementById("account-title");
const accountDescription = document.getElementById("account-description");
const accountSubmit = document.getElementById("account-submit");
const accountName = document.getElementById("account-name");
const nameGroup = document.getElementById("name-group");
const registerLink = document.getElementById("register-link");
const registerText = document.getElementById("register-text");
const logoutButton = document.getElementById("logout-button");
const accountMessage = document.getElementById("account-message");
const accountLabel = document.getElementById("account-label");
function updateAccountDisplay() {
    const adminButton = document.getElementById("admin-button");

    if (currentClient) {
        accountLabel.textContent = currentClient.nome;

        if (adminButton) {
            adminButton.hidden = currentClient.perfil !== "admin";
        }

    } else {
        accountLabel.textContent = "Minha conta";

        if (adminButton) {
            adminButton.hidden = true;
        }
    }
}
const adminButton = document.getElementById("admin-button");

if (adminButton) {
    adminButton.addEventListener("click", () => {
        window.location.href = "admin.html";
    });
}

function showAccountMessage(message, success = false) {
    accountMessage.textContent = message;
    accountMessage.style.color = success ? "green" : "crimson";
}

function setAccountMode(mode) {
    accountMode = mode;

    accountMessage.textContent = "";

    accountForm.hidden = false;
    logoutButton.hidden = true;
    registerText.hidden = false;

    if (mode === "register") {
        accountTitle.textContent = "Crie sua conta";
        accountDescription.textContent =
            "Faça parte da experiência Glow Up.";

        nameGroup.hidden = false;
        accountName.required = true;

        accountSubmit.textContent = "Criar conta";

        registerText.innerHTML =
            'Já tem uma conta? <a href="#" id="register-link">Entrar</a>';

    } else {
        accountTitle.textContent = "Bem-vinda à Glow Up!";
        accountDescription.textContent =
            "Acesse sua conta para acompanhar suas compras.";

        nameGroup.hidden = true;
        accountName.required = false;

        accountSubmit.textContent = "Entrar";

        registerText.innerHTML =
            'Ainda não tem uma conta? <a href="#" id="register-link">Cadastre-se</a>';
    }

    document.getElementById("register-link").addEventListener(
        "click",
        event => {
            event.preventDefault();
            setAccountMode(
                accountMode === "login" ? "register" : "login"
            );
        }
    );
}

function openAccountModal() {
    accountModal.classList.add("active");
    accountMessage.textContent = "";

    if (currentClient) {
        accountTitle.textContent = `Olá, ${currentClient.nome}!`;
        accountDescription.textContent =
            "Que bom ter você de volta à Glow Up.";

        accountForm.hidden = true;
        registerText.hidden = true;
        logoutButton.hidden = false;
    } else {
        setAccountMode("login");
    }
}

accountButton?.addEventListener("click", openAccountModal);

closeAccount?.addEventListener("click", () => {
    accountModal.classList.remove("active");
});

accountModal?.addEventListener("click", event => {
    if (event.target === accountModal) {
        accountModal.classList.remove("active");
    }
});

// Cadastro e login
accountForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("account-email").value.trim();
    const senha = document.getElementById("account-password").value;

    const dados = {
        email,
        senha
    };

    if (accountMode === "register") {
        dados.nome = accountName.value.trim();
    }

    const endpoint = accountMode === "register"
        ? "/cadastro"
        : "/login";

    accountSubmit.disabled = true;
    accountSubmit.textContent = "Aguarde...";

    try {
        const response = await fetch(`${AUTH_API_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Não foi possível continuar.");
        }

        if (accountMode === "register") {
            showAccountMessage(
                "Cadastro realizado! Agora entre na sua conta.",
                true
            );

            accountForm.reset();
            setAccountMode("login");
            return;
        }

        localStorage.setItem("glowup-token", result.token);
        localStorage.setItem(
            "glowup-client",
            JSON.stringify(result.cliente)
        );

        currentClient = result.cliente;

        updateAccountDisplay();

        showToast(`Bem-vinda, ${currentClient.nome}!`);

        accountModal.classList.remove("active");
        accountForm.reset();

    } catch (error) {
        showAccountMessage(error.message);
    } finally {
        accountSubmit.disabled = false;
        accountSubmit.textContent =
            accountMode === "register" ? "Criar conta" : "Entrar";
    }
});

// Sair da conta
logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("glowup-token");
    localStorage.removeItem("glowup-client");

    currentClient = null;

    updateAccountDisplay();

    accountModal.classList.remove("active");

    showToast("Você saiu da sua conta!");
});

// MEUS PEDIDOS

const myOrdersButton = document.getElementById("my-orders-button");
const ordersSection = document.getElementById("orders-section");
const ordersList = document.getElementById("orders-list");
const productsSection = document.getElementById("produtos");
const backToProductsButton = document.getElementById("back-to-products");

async function loadMyOrders() {
    const token = localStorage.getItem("glowup-token");

    if (!token) {
        showToast("Entre na sua conta para consultar seus pedidos!");
        openAccountModal();
        return;
    }

    if (myOrdersButton) myOrdersButton.disabled = true;

    ordersList.innerHTML = "<p>Carregando seus pedidos...</p>";

    try {
        const response = await fetch(`${ORDERS_API_URL}/meus`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("glowup-token");
                localStorage.removeItem("glowup-client");

                currentClient = null;
                updateAccountDisplay();
            }

            throw new Error(
                result.message || "Não foi possível carregar seus pedidos."
            );
        }

        // Exibe os pedidos na tela
        renderMyOrders(result);

        productsSection.hidden = true;
        ordersSection.hidden = false;

        ordersSection.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        ordersList.innerHTML = `<p>${error.message}</p>`;
    } finally {
        if (myOrdersButton) myOrdersButton.disabled = false;
    }
}



function renderMyOrders(pedidos) {
    if (!pedidos || pedidos.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <h3>Você ainda não tem pedidos.</h3>
                <p>Que tal conhecer nossos produtos?</p>
            </div>
        `;
        return;
    }

    const etapas = [
        "Pendente",
        "Em processamento",
        "Enviado",
        "Entregue"
    ];

    ordersList.innerHTML = pedidos.map(pedido => {
        const data = pedido.criado_em
            ? new Date(pedido.criado_em).toLocaleDateString("pt-BR")
            : "Data não disponível";

        const statusAtual = pedido.status;
        const indiceAtual = etapas.indexOf(statusAtual);

        const statusCancelado = statusAtual === "Cancelado";

        const acompanhamentoHTML = statusCancelado
            ? `
                <div class="order-tracking cancelled">
                    <strong>Pedido cancelado</strong>
                </div>
            `
            : `
                <div class="order-tracking">
                    ${etapas.map((etapa, indice) => `
                        <div class="tracking-step ${
                            indice <= indiceAtual ? "completed" : ""
                        }">
                            <div class="tracking-circle">
                                ${indice < indiceAtual ? "✓" : indice + 1}
                            </div>
                            <span>${etapa}</span>
                        </div>
                    `).join("")}
                </div>
            `;

        const itensHTML = pedido.itens.map(item => `
            <div class="order-item">
                <img
                    src="${getProductImage(item.imagem)}"
                    alt="${item.nome}"
                >

                <div class="order-item-info">
                    <strong>${item.nome}</strong>
                    <p>Quantidade: ${item.quantidade}</p>
                    <p>
                        ${formatPrice(item.preco_unitario)}
                        por unidade
                    </p>
                </div>
            </div>
        `).join("");

        return `
            <article class="order-card">
                <div class="order-card-header">
                    <div>
                        <strong>Pedido #${pedido.id}</strong>
                        <p>Realizado em ${data}</p>
                    </div>

                    <span class="order-status">
                        ${statusAtual}
                    </span>
                </div>

                ${acompanhamentoHTML}

                <div class="order-items">
                    ${itensHTML}
                </div>

                <div class="order-card-footer">
                    <span>Total do pedido</span>
                    <strong>${formatPrice(pedido.total)}</strong>
                </div>
            </article>
        `;
    }).join("");
}

// Abrir meus pedidos
if (myOrdersButton) {
    myOrdersButton.addEventListener("click", () => {
        console.log("Botão Meus pedidos clicado!");
        loadMyOrders();
    });
} else {
    console.error("Botão Meus pedidos não encontrado no HTML!");
}

// Voltar ao catálogo
backToProductsButton?.addEventListener("click", () => {
    ordersSection.hidden = true;
    productsSection.hidden = false;

    productsSection.scrollIntoView({
        behavior: "smooth"
    });
});

// Inicializa o estado da conta
updateAccountDisplay();
// Inicialização
renderCart();
loadProducts();
