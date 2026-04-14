FROM node:18-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-"Kärcher Analytics"}

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
