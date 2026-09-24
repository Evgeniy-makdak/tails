FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/index.js"]
