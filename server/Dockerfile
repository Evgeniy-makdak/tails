FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
ENV PORT=8080
ENV NODE_ENV=production
ENV COLLAR_TCP_ENABLE=1
ENV COLLAR_TCP_PORTS=5001,5093
EXPOSE 8080 5001 5093
CMD ["node", "src/index.js"]
