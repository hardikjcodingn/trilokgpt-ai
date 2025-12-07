FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --force

# Copy backend code
COPY src ./src

# Copy frontend
COPY ../frontend ./frontend

# Expose port
EXPOSE 8000

# Start server
CMD ["npm", "start"]
