# Build web (Vite) and serve as static files
# Build web (Vite) and serve as static files
FROM node:22-alpine AS build
WORKDIR /app

# Build-time API URL for Vite (Dokploy can pass as build arg).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Workspace install
COPY package.json package-lock.json ./
COPY frontend/web/package.json frontend/web/package.json
COPY frontend/shared/package.json frontend/shared/package.json
COPY frontend/shared/src frontend/shared/src
COPY frontend/web/tsconfig.json frontend/web/tsconfig.json
COPY frontend/web/vite.config.ts frontend/web/vite.config.ts
COPY frontend/web/index.html frontend/web/index.html
COPY frontend/shared/map/style.base.json frontend/web/public/map/style.json
COPY frontend/web/public frontend/web/public
COPY frontend/web/src frontend/web/src

RUN npm ci
RUN npm --workspace frontend/web run build

FROM nginx:1.27-alpine
COPY --from=build /app/frontend/web/dist /usr/share/nginx/html
# Basic SPA-ish routing (optional; harmless for now)
COPY frontend/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
