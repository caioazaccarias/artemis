# Controle Financeiro - Documentação do Projeto

Este documento apresenta uma visão geral do sistema de Controle Financeiro, incluindo seus principais recursos, regras de negócio, páginas, stack tecnológica e design system utilizado.

## 🚀 Principais Recursos do Projeto

- **Autenticação de Usuários:** Sistema de login seguro utilizando JWT (JSON Web Token) e senhas criptografadas.
- **Gestão de Transações:** CRUD (Criar, Ler, Atualizar e Deletar) completo para receitas e despesas financeiras.
- **Dashboard Financeiro:** Resumo dinâmico exibindo saldos, total de entradas, total de saídas e gráficos interativos para análise financeira.
- **Filtros e Buscas:** Capacidade de buscar transações e filtrá-las por período.
- **Controle de Pagamento:** Possibilidade de marcar uma despesa ou receita como "paga" ou "pendente".

## 💼 Regras de Negócios

- **Isolamento de Dados:** Cada usuário só tem acesso às próprias transações. As operações de consulta, criação, edição e exclusão de transações são atreladas ao `user_id` do usuário logado de forma isolada.
- **Tipos de Transação:** Uma transação é estritamente classificada como `entrada` (receita) ou `saida` (despesa).
- **Status de Pagamento:** As transações possuem um status `paga` (booleano), permitindo gerenciar o fluxo de caixa considerando o que é apenas previsão e o que já foi consolidado/pago.
- **Validação de Usuário:** O e-mail de um usuário deve ser único no sistema e é utilizado para a autenticação.

## 📄 Páginas da Aplicação

A interface (SPA em React) está dividida nas seguintes páginas principais:

- **`/` (Login.jsx):** Tela de entrada do sistema, onde os usuários inserem suas credenciais para obter acesso seguro à plataforma.
- **`/dashboard` (Dashboard.jsx):** Tela inicial após o login. Apresenta cards visuais com saldo total, resumo de receitas e despesas e integração com gráficos (`Recharts`) para visualização de métricas de forma intuitiva.
- **`/transactions` (Transactions.jsx):** Módulo central de gestão financeira. Traz listagem de todas as movimentações, formulários para inserção/edição rápida, além de busca e controles de mudança de status de pagamento.
- **Layout Base (`Layout.jsx`):** Componente que envolve as rotas autenticadas, disponibilizando as estruturas visuais padrão de navegação, como barra lateral (sidebar) e cabeçalho (topbar).

## 🛠️ Tecnologia Utilizada

### Backend (API REST)
- **Node.js** com framework **Express.js** para estruturação das rotas e requisições HTTP.
- **Sequelize** como ORM interativo para comunicação flexível com o banco de dados.
- **MySQL** utilizado como o banco de dados relacional.
- **JWT (jsonwebtoken)** e **bcryptjs** responsáveis pela camada de autenticação, sessões e criptografia.
- Utilitários: **Cors**, **Dotenv**, **Nodemon**.

### Frontend (SPA React)
- **React.js** empacotado e otimizado através do **Vite**.
- **React Router Dom** utilizado para navegação do lado do cliente entre as páginas.
- **Axios** para requisições assíncronas à API.
- **React Hook Form** atuando na gerência, performance e validação intuitiva de grandes formulários.
- **Recharts** como ferramenta para renderização e montagem dos gráficos no Dashboard.
- **SweetAlert2** encarregado das notificações visuais interativas e modais de confirmação.

## 🎨 Design System e UI

O visual do frontend foi fundamentado em layouts administrativos de alta conversão visual:

- **AdminLTE (v3):** Core do design da aplicação. Garante uma interface limpa, altamente profissional e adaptada ao formato típico de dashboards (com painéis expansíveis, sidebar retrátil e cards de dados).
- **Bootstrap 4:** Atua como motor visual base e grade (grid) do sistema em parceria com o AdminLTE. Fornece flexibilidade, classes utilitárias rápidas, modais, botões e controles de formulário.
- **FontAwesome (Free):** Família e padrão de ícones aplicados globalmente na aplicação (menus, botões de ação na tabela de transações e cards visuais).
- O sistema mantém arquivos locais de CSS para ajustes finos sobre a personalização principal.
