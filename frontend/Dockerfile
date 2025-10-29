FROM node:18-alpine

WORKDIR /app

# Install deps first for caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install; fi

# Copy the rest
COPY . /app

EXPOSE 3000

# HOST env is passed by docker-compose for Vite
CMD ["npm", "run", "dev", "--", "--host"]
