FROM node:16-alpine as builder

# Set environment variables
ENV NODE_ENV=production
ENV REACT_APP_API_URL=/api
ENV NIXPACKS_PATH=/app

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the frontend
WORKDIR /app/frontend
RUN npm run build

# Production image
FROM node:16-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set working directory
WORKDIR /app

# Copy backend code and built frontend
COPY backend/ ./backend/
COPY --from=builder /app/frontend/build ./frontend/build

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production

# Set the default command to run the server
CMD ["npm", "start"]
