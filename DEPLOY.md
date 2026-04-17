# ─────────────────────────────────────────────────────────────────────────────
# 🚀 Guia de Implantação do Artemis na VPS via Docker
# ─────────────────────────────────────────────────────────────────────────────

## Pré-requisitos na VPS (Ubuntu/Debian)

Instale Docker e Docker Compose com os seguintes comandos:

```bash
# Atualiza o sistema
sudo apt update && sudo apt upgrade -y

# Instala o Docker
curl -fsSL https://get.docker.com | sh

# Adiciona seu usuário ao grupo docker (sem precisar de sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verifica a instalação
docker --version
docker compose version
```

---

## Passos para Subir a Aplicação

### 1. Clonar o repositório na VPS

```bash
git clone <URL_DO_SEU_REPOSITORIO> /opt/artemis
cd /opt/artemis
```

### 2. Criar o arquivo de variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Preencha os valores no `.env`:
```env
DB_ROOT_PASSWORD=UmaSenhaForte123!
DB_NAME=artemis_db
DB_USER=artemis_user
DB_PASSWORD=OutraSenhaForte456!
JWT_SECRET=ArtemisJwtSecretSuperLonga2024!
DOMAIN=caiozaccarias.com.br
LETSENCRYPT_EMAIL=seuemail@gmail.com
```

### 3. Construir e Subir os Containers

```bash
# Sobe toda a stack em modo produção em background (-d = detached)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 4. Verificar os Logs

```bash
# Ver todos os containers rodando
docker compose ps

# Ver logs em tempo real (Ctrl+C para sair)
docker compose logs -f

# Logs somente do backend
docker compose logs -f backend
```

---

## Teste Local com Docker (Opcional)

Se você quiser testar se a orquestração está funcionando antes de subir para a VPS, utilize o comando:

```bash
docker compose up --build
```

Neste modo local:
1. O **Banco de Dados** rodará na porta `3306`.
2. O **Backend** rodará na porta `3000`.
3. O **Frontend** rodará na porta `8081` (acesso via `http://localhost:8081`).

Isso simula exatamente como os containers conversarão entre si na VPS.

---

## Comandos Úteis

| Ação | Comando |
|------|---------|
| Subir tudo | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` |
| Parar tudo | `docker compose down` |
| Reiniciar backend | `docker compose restart backend` |
| Ver logs ao vivo | `docker compose logs -f` |
| Acessar MySQL | `docker exec -it artemis_db mysql -u artemis_user -p` |
| Atualizar a aplicação | `git pull && docker compose ... up -d --build` |

---

## Testando o HTTPS

Após executar o comando de inicialização, aguarde cerca de **1-2 minutos** para o Let's Encrypt emitir o certificado SSL. Depois acesse `https://caiozaccarias.com.br` no navegador.

---

> **Atenção:**  O arquivo `.env` NUNCA deve ser commitado no Git. O `.gitignore` já está configurado para ignorá-lo.
