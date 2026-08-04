FROM node:20-alpine AS builder
USER root
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN find . -type d -name node_modules -prune -o -print

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app /usr/src/app

USER root
RUN chown -R node:node /usr/src/app
USER node

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["sh", "./scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]
