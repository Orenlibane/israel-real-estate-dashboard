# Use Node.js 22.12 (required for Angular 21)
FROM node:22.12-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server files
COPY server ./server

# Copy frontend files
COPY frontend ./frontend

# Install root dependencies
RUN npm install --omit=dev

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Back to root
WORKDIR /app

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "server/index.js"]
