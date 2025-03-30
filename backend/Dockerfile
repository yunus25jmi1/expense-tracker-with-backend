FROM golang:1.21-alpine

# Install CA certificates for SSL
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .

RUN go build -mod=vendor -o /neofinance

EXPOSE 8080

CMD [ "/neofinance" ]