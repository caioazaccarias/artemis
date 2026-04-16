# Artemis - Documentação do Projeto

Este documento apresenta uma visão geral do sistema Artemis (anteriormente conhecido como Controle Financeiro), incluindo seus principais recursos, regras de negócio, páginas, stack tecnológica e design system utilizado.

## 🚀 Principais Recursos do Projeto

- **Autenticação e Segurança:** Sistema de login seguro utilizando JWT (JSON Web Token) e senhas criptografadas (Bcrypt).
- **Controle de Acesso Granular (RBAC):** Sistema de gestão de perfis (Roles) em que o administrador pode aplicar permissões específicas a cada grupo de usuários, limitando ou concedendo acesso a telas como Dashboard, Transações, Categorias, Usuários, Perfis e Backups.
- **Gestão de Transações:** CRUD (Criar, Ler, Atualizar e Deletar) completo para fluxo de caixa.
- **Dashboard Financeiro:** Resumo dinâmico exibindo saldo, total de entradas, total de saídas no mês/período, e gráficos interativos para análise rápida.
- **Filtros e Buscas:** Capacidade de buscar dados por texto ou realizar filtros por períodos baseados no mês e ano.
- **Controle de Pagamento:** Possibilidade de marcar uma despesa ou receita como "paga" (efetivada) ou "pendente" (previsão), ajustando o fluxo de caixa real.
- **Ferramentas de Backups:** Funcionalidade na interface para realizar rápido backup de segurança extraindo JSON e recursos de importação (restauração de dados estruturados em banco).

## 💼 Regras de Negócios

- **Dados Compartilhados da Empresa:** O sistema suporta múltiplos usuários com login individualizado, mas todos acessam à mesma base consolidada de categorias e transações. 
- **Classificação de Caixa:** Uma transação é estritamente de `entrada` (receita) ou `saida` (despesa).
- **Projeção X Realização:** Status `paga` atua como chave para identificar o que já impactou o saldo real vs o que está apenas mapeado em faturas futuras.
- **Unicidade e Tratamento de Usuários:** O e-mail do usuário não pode ser duplicado e é a chave da sua sessão.
- **Proteção do Sistema (Root):** O Perfil de "Administrador" (ID = 1) não pode sofrer mutações de segurança nas permissões nem ser excluído.

## 📄 Páginas da Aplicação (SPA)

- **`/` (Dashboard.jsx):** Início do painel após login. Fornece métricas de painel executivo com cards e gráficos analíticos integrados.
- **`/login` (Login.jsx):** Painel de acesso centralizado.
- **`/transactions` (Transactions.jsx):** Motor do sistema de finanças. Lista fluxos em linhas tabeladas intuitivas e abriga o formulário flutuante (modal).
- **`/categories` (Categories.jsx):** Gestor de agrupamento e organização das finanças (Ex: Lazer, Alimentação, Salário).
- **`/users` (Users.jsx):** Controle dos operadores do sistema, seu acesso sistêmico (credenciais) e perfilamento (Roles).
- **`/roles` (Roles.jsx):** Central de customização de políticas e permissões departamentais (RBAC).
- **`/backup` (Backup.jsx):** Ferramenta utilitária de exportação ou reconstrução direta da estrutura relacional.

## 🛠️ Tecnologia Utilizada

### Backend (API REST)
- **Node.js** com framework minimalista **Express.js**.
- **Sequelize** como ORM escalável.
- **MySQL** utilizado como SGBD relacional subjacente.
- Segurança via **JWT (jsonwebtoken)** e hash criptográfico **bcryptjs**.

### Frontend (SPA React)
- React.js otimizado via fluxo de compilação ultrarrápido **Vite**.
- Navegação assíncrona orientada a rotas privadas utilizando **React Router Dom**.
- Construção resiliente e fácil validação de forms pelo **React Hook Form**.
- Exibição de Data-Viz (Gráficos) com **Recharts**.
- Alertas dinâmicos com **SweetAlert2**.
- Gestão fluida de chamadas HTTP através do **Axios**.

## 🎨 Design System e UI

O visual foi trabalhado e construído em bases administrativas modernas e de rápida leitura de BI (Business Intelligence):

- **Branding "Artemis":** Atualização na tipografia e nos vetores, voltada a um sistema polido, veloz e robusto.
- **AdminLTE (v3) / Bootstrap 4:** Utilização da biblioteca AdminLTE como motor principal para gerar os Sidebars (menus em colunas), Painéis Modais, Tabelas estilizadas Responsivas e Elementos estruturais.
- **FontAwesome (Free):** Motor para ícones de ação.
- O sistema interage através de comportamentos otimizados de UX em formulários (ex: autofoco inteligente na Descrição do Lançamento, interações keydown de submissão do form) e tratamento assíncrono.
