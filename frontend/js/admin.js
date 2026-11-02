const API_URL = "https://glow-up-ecommerce-ijlp.onrender.com/api/pedidos";
const PRODUCTS_API_URL = "https://glow-up-ecommerce-ijlp.onrender.com/api/produtos";


const token = localStorage.getItem("glowup-token");
const clienteSalvo = localStorage.getItem("glowup-client");

const ordersList = document.getElementById("orders-list");
const productsList = document.getElementById("products-list");

let pedidos = [];
let produtos = [];
let ordersChart = null;

// ESCAPAR TEXTOS EXIBIDOS NO HTML
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

// VERIFICAR LOGIN E PERMISSÃO
function verificarAdmin() {
    if (!token || !clienteSalvo) {
        alert("Faça login para acessar o painel.");
        window.location.href = "index.html";
        return false;
    }

    try {
        const cliente = JSON.parse(clienteSalvo);

        if (cliente.perfil !== "admin") {
            alert("Acesso permitido somente para administradores.");
            window.location.href = "index.html";
            return false;
        }

        return true;

    } catch (error) {
        localStorage.removeItem("glowup-client");
        localStorage.removeItem("glowup-token");
        window.location.href = "index.html";
        return false;
    }
}

// FORMATAR MOEDA
function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ==============================
// GERENCIAMENTO DE ABAS
// ==============================

document.querySelectorAll(".admin-tab").forEach(botao => {
    botao.addEventListener("click", () => {
        const secaoSelecionada = botao.dataset.section;

        document.querySelectorAll(".admin-tab").forEach(tab => {
            tab.classList.remove("active");
        });

        document.querySelectorAll(".admin-section").forEach(secao => {
            secao.hidden = true;
        });

        botao.classList.add("active");

        document.getElementById(secaoSelecionada).hidden = false;

        if (secaoSelecionada === "products-section") {
            carregarProdutos();
        }

        if (secaoSelecionada === "orders-section") {
            carregarPedidos();
        }
    });
});

// ==============================
// GERENCIAMENTO DE PEDIDOS
// ==============================

async function carregarPedidos() {
    try {
        ordersList.innerHTML = "<p>Carregando pedidos...</p>";

        const response = await fetch(`${API_URL}/admin/todos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || "Erro ao carregar pedidos.");
        }

        pedidos = resultado;

        atualizarResumo();
        atualizarGrafico();
        renderizarPedidos();

    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);

        ordersList.innerHTML = `
            <p class="empty-orders">
                Não foi possível carregar os pedidos.
            </p>
        `;
    }
}
function atualizarResumo() {
    const total = pedidos.length;

    const pendentes = pedidos.filter(
        pedido => pedido.status === "Pendente"
    ).length;

    const processamento = pedidos.filter(
        pedido => pedido.status === "Em processamento"
    ).length;

    const entregues = pedidos.filter(
        pedido => pedido.status === "Entregue"
    ).length;

    const faturamento = pedidos.reduce(
        (soma, pedido) => soma + Number(pedido.total || 0),
        0
    );

    document.getElementById("total-orders").textContent = total;
    document.getElementById("pending-orders").textContent = pendentes;
    document.getElementById("processing-orders").textContent = processamento;
    document.getElementById("delivered-orders").textContent = entregues;

    document.getElementById("total-revenue").textContent =
        formatarMoeda(faturamento);
}

function renderizarPedidos() {
    if (pedidos.length === 0) {
        ordersList.innerHTML = `
            <p class="empty-orders">Nenhum pedido encontrado.</p>
        `;
        return;
    }

    ordersList.innerHTML = pedidos.map(pedido => {
        const data = new Date(pedido.criado_em).toLocaleString("pt-BR");

        const itensHTML = (pedido.itens || []).map(item => `
            <div class="order-item">
                <span>
                    ${escaparHTML(item.nome)} — ${item.quantidade} unidade(s)
                </span>
                <strong>
                    ${formatarMoeda(item.preco_unitario * item.quantidade)}
                </strong>
            </div>
        `).join("");

        const clienteNome = escaparHTML(pedido.cliente?.nome || "Não informado");
        const clienteEmail = escaparHTML(pedido.cliente?.email || "Não informado");

        return `
            <article class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Pedido #${pedido.id}</h3>

                        <div class="customer-info">
                            <p><strong>Cliente:</strong> ${clienteNome}</p>
                            <p><strong>E-mail:</strong> ${clienteEmail}</p>
                            <p><strong>Data:</strong> ${data}</p>
                        </div>
                    </div>

                    <strong>${escaparHTML(pedido.status)}</strong>
                </div>

                <div class="order-items">
                    ${itensHTML}
                </div>

                <div class="order-footer">
                    <span class="order-total">
                        Total: ${formatarMoeda(pedido.total)}
                    </span>

                    <div class="status-control">
                        <select id="status-${pedido.id}">
                            ${["Pendente", "Em processamento", "Enviado", "Entregue"].map(status => `
                                <option value="${status}" ${pedido.status === status ? "selected" : ""}>
                                    ${status}
                                </option>
                            `).join("")}
                        </select>

                        <button onclick="atualizarStatus(${pedido.id})">
                            Salvar status
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function atualizarStatus(pedidoId) {
    const select = document.getElementById(`status-${pedidoId}`);
    const novoStatus = select.value;

    try {
        const response = await fetch(
            `${API_URL}/admin/${pedidoId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: novoStatus })
            }
        );

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || "Erro ao atualizar status.");
        }

        alert("Status atualizado com sucesso!");
        await carregarPedidos();

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}

// ==============================
// GERENCIAMENTO DE PRODUTOS
// ==============================

// CARREGAR PRODUTOS
async function carregarProdutos() {
    try {
        productsList.innerHTML = "<p>Carregando produtos...</p>";

        const response = await fetch(PRODUCTS_API_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || "Erro ao carregar produtos.");
        }

        produtos = resultado;

        renderizarProdutos();

        const estoqueBaixo = produtos.filter(
            produto => Number(produto.estoque) <= 5
        ).length;

        document.getElementById("low-stock-products").textContent = estoqueBaixo;

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);

        productsList.innerHTML = `
            <p class="empty-orders">Não foi possível carregar os produtos.</p>
        `;
    }
}
// EXIBIR PRODUTOS
function renderizarProdutos() {
    if (produtos.length === 0) {
        productsList.innerHTML = `
            <p class="empty-orders">Nenhum produto cadastrado.</p>
        `;
        return;
    }

    productsList.innerHTML = produtos.map(produto => {
        const imagem = escaparHTML(produto.imagem);

        return `
            <article class="admin-product-card">

                <img
                    src="assets/images/${imagem}"
                    alt="${escaparHTML(produto.nome)}"
                    class="admin-product-image"
                    onerror="this.style.display='none'"
                >

                <div class="admin-product-info">
                    <h3>${escaparHTML(produto.nome)}</h3>

                    <p>${escaparHTML(produto.categoria)}</p>

                    <strong>${formatarMoeda(produto.preco)}</strong>

                    <span>Estoque: ${produto.estoque} unidade(s)</span>
                </div>

                <div class="admin-product-actions">
                    <button onclick="editarProduto(${produto.id})">
                        Editar
                    </button>

                    <button
                        class="delete-product-button"
                        onclick="excluirProduto(${produto.id})"
                    >
                        Excluir
                    </button>
                </div>

            </article>
        `;
    }).join("");
}

// ABRIR MODAL
function abrirModalProduto() {
    document.getElementById("product-modal").hidden = false;
}

// FECHAR MODAL
function fecharModalProduto() {
    document.getElementById("product-modal").hidden = true;
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";

    document.getElementById("product-form-title").textContent =
        "Cadastrar produto";
}

// BOTÃO NOVO PRODUTO
document.getElementById("add-product-button").addEventListener("click", () => {
    fecharModalProduto();
    abrirModalProduto();
});

// BOTÃO FECHAR MODAL
document.getElementById("close-product-modal").addEventListener("click", () => {
    fecharModalProduto();
});

// EDITAR PRODUTO
function editarProduto(id) {
    const produto = produtos.find(item => Number(item.id) === Number(id));

    if (!produto) return;

    document.getElementById("product-id").value = produto.id;
    document.getElementById("product-name").value = produto.nome;
    document.getElementById("product-description").value = produto.descricao || "";
    document.getElementById("product-category").value = produto.categoria;
    document.getElementById("product-price").value = produto.preco;
    document.getElementById("product-image").value = produto.imagem;
    document.getElementById("product-stock").value = produto.estoque;

    document.getElementById("product-form-title").textContent =
        "Editar produto";

    abrirModalProduto();
}

// CADASTRAR OU ATUALIZAR
document.getElementById("product-form").addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("product-id").value;

    const produto = {
        nome: document.getElementById("product-name").value.trim(),
        descricao: document.getElementById("product-description").value.trim(),
        categoria: document.getElementById("product-category").value,
        preco: Number(document.getElementById("product-price").value),
        imagem: document.getElementById("product-image").value.trim(),
        estoque: Number(document.getElementById("product-stock").value)
    };

    if (
        !produto.nome ||
        !produto.categoria ||
        !produto.imagem ||
        !Number.isFinite(produto.preco) ||
        produto.preco <= 0 ||
        !Number.isInteger(produto.estoque) ||
        produto.estoque < 0
    ) {
        alert("Confira os dados do produto.");
        return;
    }

    try {
        const response = await fetch(
            id ? `${PRODUCTS_API_URL}/${id}` : PRODUCTS_API_URL,
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(produto)
            }
        );

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || "Erro ao salvar produto.");
        }

        alert(resultado.message || "Produto salvo com sucesso!");

        fecharModalProduto();
        await carregarProdutos();

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
});

// EXCLUIR PRODUTO
async function excluirProduto(id) {
    const confirmar = confirm(
        "Tem certeza que deseja excluir este produto?"
    );

    if (!confirmar) return;

    try {
        const response = await fetch(`${PRODUCTS_API_URL}/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || "Erro ao excluir produto.");
        }

        alert(resultado.message || "Produto excluído com sucesso!");

        await carregarProdutos();

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}

// ==============================
// SAIR DO PAINEL
// ==============================

document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("glowup-token");
    localStorage.removeItem("glowup-client");

    window.location.href = "index.html";
});
function atualizarGrafico() {
    const canvas = document.getElementById("orders-chart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const status = [
        "Pendente",
        "Em processamento",
        "Enviado",
        "Entregue"
    ];

    const quantidades = status.map(item =>
        pedidos.filter(pedido => pedido.status === item).length
    );

    if (ordersChart) {
        ordersChart.destroy();
    }

    ordersChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: status,

            datasets: [{
                label: "Quantidade de pedidos",
                data: quantidades,
                backgroundColor: [
                    "#f4b6c2",
                    "#d9a5c7",
                    "#b9a1d8",
                    "#a5c9b8"
                ],
                borderRadius: 8,
                barThickness: 45
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// ==============================
// INICIALIZAÇÃO
// ==============================

if (verificarAdmin()) {
    carregarPedidos();
    carregarProdutos();
}