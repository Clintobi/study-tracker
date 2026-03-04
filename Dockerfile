FROM node:22-alpine

WORKDIR /app
COPY . .
RUN npm run build

ENV NODE_ENV=production
CMD ["node", "server/src/index.js"]
