require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./src/models');
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const userRoutes = require('./src/routes/userRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const roleRoutes = require('./src/routes/roleRoutes');

const app = express();

// Middlewares globais
app.use(cors()); // Habilita o Cross-Origin Resource Sharing
app.use(express.json()); // Permite ler JSON do corpo das requisições

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API de Controle Financeiro rodando com sucesso!' });
});

// Inicialização do Servidor e Banco de Dados
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Sincroniza as tabelas do banco de dados baseado nos Models
  await syncDatabase();
});
