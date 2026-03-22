# Step 1: Build frontend (Vite)
FROM node:20-alpine AS client-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Step 2: Backend
FROM node:20-alpine

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend code
COPY backend ./backend

# Copy frontend build
COPY --from=client-build /app/frontend/dist ./backend/public

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "index.js"]