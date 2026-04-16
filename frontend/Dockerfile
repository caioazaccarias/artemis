# --- Dockerfile para o Frontend (React/Vite) ---
# Stage 1: Build da aplicação React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Servir os arquivos estáticos com Nginx leve
FROM nginx:alpine

# Remove a config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração customizada
COPY nginx.conf /etc/nginx/conf.d/

# Copia os arquivos compilados do React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
