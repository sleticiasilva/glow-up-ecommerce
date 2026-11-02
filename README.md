
# 💗 Glow Up — E-commerce de Skincare

<p align="center">
  <strong>Uma experiência digital para o universo do skincare.</strong>
</p>

O Glow Up é uma aplicação web de comércio eletrônico desenvolvida para a venda de produtos de skincare. O projeto conta com uma loja virtual integrada a um banco de dados MySQL e um painel administrativo para gerenciamento de produtos, estoque e pedidos.

## ✨ Funcionalidades

### 🛍️ Loja virtual
- Exibição dinâmica de produtos cadastrados no banco de dados.
- Visualização de preços, descrições e categorias.
- Cadastro e login de clientes.
- Consulta e acompanhamento dos próprios pedidos.

### ⚙️ Painel administrativo
- Acesso restrito a administradores.
- Cadastro, edição e exclusão de produtos.
- Gerenciamento de pedidos.
- Atualização do status dos pedidos.
- Controle de estoque.
- Indicadores de pedidos e faturamento.
- Gráfico de pedidos por status.

### 🔐 Segurança
- Autenticação utilizando JWT.
- Proteção de rotas administrativas.
- Controle de permissões por perfil de usuário.
- Consultas parametrizadas ao banco de dados.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e responsividade |
| JavaScript | Interatividade e integração com a API |
| Node.js | Ambiente de execução do backend |
| Express.js | Criação da API e gerenciamento de rotas |
| MySQL | Banco de dados relacional |
| JWT | Autenticação e autorização |
| Chart.js | Gráficos e indicadores |

## 📁 Estrutura do projeto

```text
glow-up-ecommerce/
│
├── frontend/
│   ├── assets/
│   │   └── images/
│   ├── css/
│   │   ├── style.css
│   │   └── admin.css
│   ├── js/
│   │   ├── script.js
│   │   └── admin.js
│   ├── index.html
│   └── admin.html
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── routes/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
└── README.md
```

## 💻 Como executar o projeto

### 1. Pré-requisitos

- Node.js instalado.
- MySQL instalado e configurado.
- Git instalado.

### 2. Clonar o repositório

```bash
git clone https://github.com/sleticiasilva/glow-up-ecommerce.git
```

### 3. Configurar o banco de dados

Crie o banco de dados MySQL chamado:

```sql
CREATE DATABASE glow_up;
```

Configure as tabelas necessárias para clientes, produtos, pedidos e itens dos pedidos.

### 4. Configurar o backend

Entre na pasta:

```bash
cd glow-up-ecommerce/backend
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` na pasta backend com suas configurações:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=glow_up
JWT_SECRET=sua_chave_secreta
```

### 5. Iniciar o servidor

```bash
node server.js
```

A API estará disponível em:

```text
http://localhost:3000
```

### 6. Abrir o frontend

Abra o arquivo `frontend/index.html` utilizando a extensão Live Server do VS Code.

## 🗄️ Banco de dados

O sistema utiliza MySQL para armazenar e relacionar informações de:

- Clientes;
- Produtos;
- Pedidos;
- Itens dos pedidos.

A integração entre o backend e o banco de dados é realizada por meio de consultas SQL.

## 📊 Painel administrativo

O painel permite acompanhar os pedidos realizados, visualizar indicadores e gerenciar os produtos disponíveis na loja.

## 👩‍💻 Desenvolvido por

**Letícia Silva Frederico**

Estudante de Desenvolvimento de Sistemas, com interesse em desenvolvimento de software, banco de dados e tecnologia.

🔗 [GitHub](https://github.com/sleticiasilva)

---

⭐ Projeto desenvolvido para fins educacionais e para aprimoramento de habilidades em desenvolvimento Full Stack.
