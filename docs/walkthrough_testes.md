# Walkthrough: Implementação de Testes TDD no Artemis

Estabelecemos uma infraestrutura robusta de testes para garantir que o Artemis continue estável enquanto novas funcionalidades são adicionadas.

## 🚀 O que foi implementado

### 🖥️ Backend (API)
- **Framework**: Jest + Supertest.
- **Banco de Teste**: SQLite em memória (isolado e ultra-rápido).
- **Funcionalidade**: Refatoração do `server.js` para permitir a exportação do app sem iniciar o servidor automaticamente em testes.

### 🎨 Frontend (React)
- **Framework**: Vitest (nativo para Vite).
- **Ambiente**: React Testing Library + JSDOM.
- **Vitória do TDD**: Durante a criação do teste de login, detectamos e corrigimos um erro no arquivo [Login.jsx](file:///c:/DEV/teste_ia/frontend/src/pages/Login.jsx) onde a validação de erro apontava para a chave errada (`password` em vez de `senha`).

## 🧪 Como executar os testes

Você pode rodar os testes individualmente em cada camada:

### No Backend (Raiz):
```bash
npm test
```

### No Frontend:
```bash
cd frontend
npm test
```

## ✅ Resultados da Verificação

Atualmente, temos testes de exemplo que validam os fluxos críticos de autenticação:

```text
✓ tests/auth.test.js (Sucesso no Login e Proteção de Rotas)
✓ frontend/src/__tests__/Login.test.jsx (Renderização e Validação de Form)
```

> [!TIP]
> Use o comando `npm run test:watch` no backend para manter os testes rodando enquanto você desenvolve. Isso é a essência do "Red-Green-Refactor".

A base está pronta para que você comece a "escrever o teste antes do código" em qualquer futura expansão!
