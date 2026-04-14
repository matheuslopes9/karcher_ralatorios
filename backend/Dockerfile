# Build stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /karcher-analytics ./cmd/server

# Final stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /root/

COPY --from=builder /karcher-analytics .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./karcher-analytics"]
