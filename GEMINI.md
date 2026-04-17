# Artemis - Documentação do Projeto

Este documento apresenta uma visão geral do sistema Artemis, incluindo seus principais recursos, regras de negócio, páginas, stack tecnológica e design system utilizado.

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

O visual do Artemis evoluiu para uma estética premium e moderna, focada em produtividade e clareza visual:

- **Branding "Artemis":** Identidade visual polida com logotipia reconstruída e espaçamento tipográfico expandido.
- **Tipografia Premium:** Utilização da fonte **Inter** (ou similar de alta performance) para garantir legibilidade superior e um ar tecnológico/limpo.
- **Paleta de Cores (Artemis Blue):** Escala de azuis vibrantes (ex: `#0061ff`) para elementos de destaque, combinada com superfícies claras e neutras para reduzir o cansaço visual.
- **Superfícies e Profundidade:**
  - **Soft Shadows:** Uso de sombras suaves e multicamadas em substituição a bordas sólidas e pesadas.
  - **Arredondamento Moderno:** Bordas com raios mais generosos (12px a 20px) para uma interface amigável e contemporânea.
- **Glassmorphism:** Aplicação de efeitos de transparência leve e desfoque de fundo (*backdrop-filter*) em barras laterais e cabeçalhos para um toque de sofisticação.
- **Componentes:** Embora utilize AdminLTE 3 / Bootstrap 4 como base estrutural, o sistema aplica camadas de customização CSS para remover o aspecto "padrão" e entregar uma experiência única.
