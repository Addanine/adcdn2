FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all files
COPY . .

# Set environment variables for build
ENV NODE_ENV=production \
    DATABASE_URL="postgresql://postgres:postgres@postgres-db:5432/adcdn" \
    JWT_SECRET="placeholder-will-be-replaced" \
    NEXTAUTH_SECRET="placeholder-will-be-replaced" \
    UPLOAD_DIR="/app/uploads" \
    SKIP_ENV_VALIDATION=true

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Create upload directory
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Start the application
CMD ["npm", "start"]