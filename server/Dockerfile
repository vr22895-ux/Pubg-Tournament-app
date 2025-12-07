FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port (Render sets PORT env var, but this documents intent)
EXPOSE 5050

# Start command
CMD ["npm", "start"]
