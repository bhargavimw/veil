# Multi-stage Dockerfile for the Vite + React dashboard.
# Builds the static site and serves it with `vite preview` on port 3000.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
ARG VITE_VEIL_API_URL=http://localhost:8000
ENV VITE_VEIL_API_URL=$VITE_VEIL_API_URL

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "--port", "3000"]
