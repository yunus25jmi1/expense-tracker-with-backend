package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Transaction struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Description string             `json:"description" bson:"description"`
	Amount      float64            `json:"amount" bson:"amount"`
	Type        string             `json:"type" bson:"type"`
	DateTime    time.Time          `json:"dateTime" bson:"dateTime"`
}

var client *mongo.Client
var collection *mongo.Collection

func enableCORS(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if req.Method == "OPTIONS" {
		(*w).WriteHeader(http.StatusOK)
		return
	}
}

func connectDB() error {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		return fmt.Errorf("MONGODB_URI not set")
	}

	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).
		SetServerAPIOptions(serverAPI).
		SetTLSConfig(&tls.Config{InsecureSkipVerify: true}) // Add this line

	var err error
	client, err = mongo.Connect(context.TODO(), opts)
	if err != nil {
		return err
	}

	// Add connection verification
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err = client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	collection = client.Database("neofinance").Collection("transactions")
	return nil
}

func handleTransactions(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w, r)
	if r.Method == "OPTIONS" {
		return
	}

	switch r.Method {
	case "GET":
		getTransactions(w, r)
	case "POST":
		createTransaction(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getTransactions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var transactions []Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(transactions)
}

func createTransaction(w http.ResponseWriter, r *http.Request) {
	var t struct {
		Description string    `json:"description"`
		Amount      float64   `json:"amount"`
		Type        string    `json:"type"`
		DateTime    time.Time `json:"dateTime"`
	}

	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	newTransaction := Transaction{
		Description: t.Description,
		Amount:      t.Amount,
		Type:        t.Type,
		DateTime:    t.DateTime,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.InsertOne(ctx, newTransaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	newTransaction.ID = result.InsertedID.(primitive.ObjectID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newTransaction)
}

func deleteTransaction(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w, r)
	id := r.URL.Path[len("/transactions/"):]

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func main() {
	if err := connectDB(); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	http.HandleFunc("/transactions", handleTransactions)
	http.HandleFunc("/transactions/", deleteTransaction)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
