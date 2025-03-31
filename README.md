# NeoFinance - Modern Expense Tracker

![App Screenshot](https://api.pikwy.com/web/67eadba90a090762f32c8f3e.jpg)

A full-stack expense tracking application with a modern minimalist design, built with React frontend and Go backend connected to MongoDB.

## Features

- 💸 Add income/expense transactions with descriptions
- 📅 Date-time tracking for each transaction
- 📊 Real-time balance calculation
- 📈 Income/expense breakdown statistics
- 🗑️ Delete transactions with undo animation
- 🔄 Data persistence with MongoDB
- 🛡️ Error boundaries and loading states
- 🌐 Responsive design with dark mode

## Tech Stack

**Frontend:**
- React (CDN-based)
- Tailwind CSS
- React DOM
- Babel (in-browser transpilation)

**Backend:**
- Go 1.21
- MongoDB Go Driver
- HTTP/2 with h2c
- Render.com deployment

**Database:**
- MongoDB Atlas

**DevOps:**
- Docker
- Render.com
- GitHub Pages (Frontend)

## Installation

### Prerequisites
- Go 1.21+
- Node.js (for local frontend server)
- MongoDB Atlas cluster

### Local Setup

1. **Clone Repository**
```bash
git clone https://github.com/yunus25jmi1/expense-tracker-with-backend.git
cd expense-tracker-with-backend
```

2. **Backend Setup**
```bash
cd backend
echo "MONGODB_URI=your_mongodb_uri" > .env
echo "PORT=8080" >> .env
go mod download
go run main.go
```

3. **Frontend Setup**
```bash
cd ..
python3 -m http.server 3000
```

4. Access at `http://localhost:3000`

## Deployment

1. **Backend (Render.com)**
- Create new Web Service
- Set environment variables:
  ```env
  MONGODB_URI=mongodb+srv://<user>:<password>@cluster.example.com/neofinance
  PORT=8080
  ```
- Build Command: `go mod download && go build -mod=vendor -o neofinance`
- Start Command: `./neofinance`

2. **Frontend (GitHub Pages)**
- Update API URLs in `app.js` to your Render URL
- Push to GitHub repository
- Enable GitHub Pages in repository settings

## Development Challenges & Solutions

### 1. CORS Configuration Issues
**Problem:** Persistent CORS errors between frontend and backend  
**Solution:**
- Implemented CORS middleware in Go
- Added proper OPTIONS request handling
- Set correct headers globally:
  ```go
  w.Header().Set("Access-Control-Allow-Origin", "*")
  w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
  ```

### 2. Data Format Mismatch
**Problem:** Date format inconsistencies between React and Go  
**Solution:**
- Standardized on ISO 8601 format
- Added validation in both layers:
  ```js
  // Frontend
  new Date(formData.dateTime).toISOString()
  
  // Backend
  time.Parse(time.RFC3339, requestBody.DateTime)
  ```

### 3. MongoDB Connection Problems
**Problem:** Intermittent connection failures in production  
**Solution:**
- Implemented proper connection pooling
- Added timeout contexts
- Used MongoDB Go Driver's recommended practices:
  ```go
  client, err := mongo.Connect(ctx, clientOptions)
  client.Ping(ctx, nil) // Verify connection
  ```

### 4. Dependency Management
**Problem:** Go module version conflicts  
**Solution:**
- Pinned dependency versions in `go.mod`
- Used vendoring for production builds
  ```bash
  go mod vendor
  go build -mod=vendor
  ```

### 5. Error Handling
**Problem:** Silent failures in API calls  
**Solution:**
- Added React error boundaries
- Implemented status code checks
- Created unified error response format:
  ```go
  http.Error(w, fmt.Sprintf("database error: %v", err), http.StatusInternalServerError)
  ```

## Lessons Learned

1. **Production-Grade CORS**  
Proper CORS implementation requires handling preflight requests and setting headers at the middleware level rather than per-endpoint.

2. **Type Safety**  
Maintaining consistent data formats between frontend and backend requires explicit validation on both sides.

3. **Connection Management**  
Database connections in cloud environments need proper pooling, timeout handling, and TLS configuration.

4. **Error Resilience**  
Implementing error boundaries in React and proper error logging in Go significantly improves debugging capabilities.

5. **Dependency Management**  
Vendoring Go dependencies ensures consistent builds across development and production environments.

## Environment Variables

`backend/.env`
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.example.com/neofinance
PORT=8080
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details

---

**Project Status:** Production-ready  
**Live Demo:** [https://yunus25jmi1.github.io/expense-tracker-with-backend](https://yunus25jmi1.github.io/expense-tracker-with-backend)

This project was developed as a learning exercise in full-stack development with modern web technologies. The implementation demonstrates real-world problem-solving in connecting frontend and backend systems with proper error handling and data validation.
