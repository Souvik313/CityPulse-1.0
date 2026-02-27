# CityPulse

A full‑stack urban analytics dashboard that aggregates and visualises
real‑time data for:

* **Air Quality (AQI)**
* **Weather**
* **Traffic**
* **Public sentiment** (chatbot)

The backend is a Node/Express/MongoDB API; the frontend is a
React‑&‑Vite single‑page application.  Machine‑learning scripts live
under `backend/ml`; realtime chat uses Socket.IO.

---

## 🎯 Features

* Register/login users with city association.
* Search or add cities; store geo‑coordinates via OpenWeather API.
* Fetch & cache live data from WAQI, OpenWeatherMap and TomTom.
* Examine historical records and computed “trends” (24 h / 7 d).
* Chatbot allows citizens to send feedback; sentiment is analysed and
  aggregated per city.
* Simple dashboard UI with modals and maps.

---

## 📁 Repository structure

```
CityPulse
├── backend/
│ ├── controllers/
| ├── database/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── utils/
│ ├── ml/ # dataset builders / training scripts
│ ├── config/
│ ├── middleware/
│ ├── scripts/
│ └── server.js
└── frontend/
├── public/
├── src/
│ ├── components/
│ ├── hooks/
│ ├── pages/
│ ├── assets/
│ └── main.jsx/
├── package.json
└── vite.config.js
```

---

## 🛠 Backend

### Requirements

* Node 18+
* MongoDB instance reachable via `DB_URI`
* Environment variables (see `.env.development.local`):

```env
DB_URI=mongodb://…
PORT=5000
JWT_SECRET=…
WAQI_API_KEY=…
OPENWEATHER_API_KEY=…
TOMTOM_API_KEY=…
GROQ_API_KEY=…
```

### Start

```
cd backend
npm install
cp .env.development.local.example .env.development.local   # adjust keys
npm run start            # or `node server.js`
```

### Startup sequence

On startup the server connects to MongoDB, initializes Socket.IO via `initSocket()` and ensures the time-series collections (`aqidata`, `weatherdata`, `trafficdata`) exist.

---

### API routes

All endpoints live under `/api/v1`.

#### Auth (`backend/routes/auth.routes.js`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/signup` | `{ name, city, email, password }` | `{ success:true, data:{ token, user } }` |
| `POST` | `/signin` | `{ email, password }` | `{ success:true, data:{ token, user } }` |
| `POST` | `/signOut` | — | `{ success:true }` |

> Creates user and city (if missing) on signup.

#### Users (`backend/routes/user.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all users |
| `GET` | `/:id` | Get one user (populates `city`) |
| `POST` | `/` | Create user |
| `PATCH` | `/:id` | Update `name`, `city`, `email`, or `password` |
| `DELETE` | `/:id` | Delete one user |
| `DELETE` | `/` | Delete all users |

> All responses follow `{ success:true, data… }` or `{ success:false, message }` via `error.middleware.js`.

#### City (`backend/routes/city.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | `{ city }` — 201 on create, 409 if already exists |
| `GET` | `/` | List all cities |
| `GET` | `/search?city=name` | Lookup by name; returns `{ success:true, city }` or `{ success:false, message }` |
| `DELETE` | `/:id` | Remove one city |
| `DELETE` | `/` | Remove all cities |

> Controller uses OpenWeather geocoding to populate `latitude`, `longitude`, `state`, and `country` in the City model.

---

#### AQI (`backend/routes/aqi.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fetch` | `{ city }` — fetches WAQI data via `services/aqi.service.js`, caches for 10 min and stores |
| `GET` | `/latest?city=…` | Latest AQI record for city |
| `GET` | `/history?city=…&limit=…` | Historical records sorted descending |
| `GET` | `/trends?city=…&period=24h\|7d` | Trend analysis via `services/aqiTrends.service.js` |

#### Weather (`backend/routes/weather.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fetch` | `{ city }` — resolves coords via City model and fetches weather |
| `GET` | `/latest?city=…` | Latest weather record |
| `GET` | `/history?city=…&limit=…` | Historical records (limit optional) |
| `GET` | `/trends?city=…&period=24h\|7d` | Trend analysis via `services/weatherTrends.service.js` |

---

#### Traffic (`backend/routes/traffic.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/fetch` | `{ city, lat, lon }` — fetches live traffic via TomTom API |
| `GET` | `/latest?city=…` | Latest traffic record |
| `GET` | `/history?city=…&limit=…` | Historical records sorted descending |

---

#### Sentiment (`backend/routes/sentiment.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | `{ text }` — returns sentiment score |
| `POST` | `/analyze-text` | Identical to `/analyze`; used internally by chatbot messages |
| `GET` | `/trends?city=…&period=24h\|7d` | Aggregates chat-based sentiment via `services/sentimentTrends.service.js` |

#### Chat (`backend/routes/chat.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/start` | Auth required — `{ cityId }` — creates a new `ChatSession` |
| `POST` | `/message` | `{ sessionId, message, sender }` — stores `ChatMessage` and emits via Socket.IO |
| `POST` | `/end` | Ends the active session |
| `GET` | `/messages?sessionId=…` | List all messages for a session |
| `GET` | `/all-sessions` | Auth only — list all sessions for the current user |

> Socket helpers in `backend/utils/socket.js` manage rooms and emit events.

---

### Models

Key models under `backend/models`:

| Model | Description |
|-------|-------------|
| `User` | User account with auth fields |
| `City` | City with geocoded `latitude`, `longitude`, `state`, `country` |
| `AQIData` | Time-series AQI records |
| `WeatherData` | Time-series weather records |
| `TrafficData` | Time-series traffic records |
| `SentimentRecord` | Sentiment scores linked to city |
| `DataSource` | External API source metadata |
| `ChatSession` | Chat session linked to city and user |
| `ChatMessage` | Individual messages within a session |

> All time-series models include a `city` ref, value fields, `recordedAt` timestamp, and `ingestionMeta`.

---

### Utilities & scripts

| Path | Description |
|------|-------------|
| `utils/catchAsync.js` | Async wrapper to avoid repetitive try/catch |
| `utils/AppError.js` | Custom `Error` subclass with status codes |
| `middleware/auth.middleware.js` | JWT authentication and authorization |
| `middleware/error.middleware.js` | Global error handler — formats `{ success:false, message }` |
| `scripts/` | One-off scripts e.g. `users.dropIndex.js` |
| `ml/` | Dataset builders and TensorFlow training models for AQI prediction |

---

## 🧩 Frontend

### Requirements

- Node 18+
- `.env.local` with `VITE_API_URL=http://localhost:5000` (or your deployed API URL)

### Start
```bash
cd frontend
npm install
cp .env.local.example .env.local   # adjust VITE_API_URL
npm run dev
```
### Routing & pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Landing page |
| `/about` | `About` | About CityPulse |
| `/contact` | `Contact` | Contact form |
| `/register` | `Register` | User registration form |
| `/login` | `Login` | User login |
| `/users/:id` | `Profile` | User profile page |
| `/users/:id/update` | `UpdateProfile` | Edit profile details |
| `/get-started` | `GetStarted` | Select or add a city |
| `/dashboard` | `Dashboard` | Main dashboard — AQI, Weather, Traffic, Sentiment cards |

### Data fetching

`Dashboard` uses `src/hooks/useCityDashboard.js` which fires four parallel requests on city load:
```js
axios.get(`${API_URL}/api/v1/aqi/latest`,        { params: { city } })
axios.get(`${API_URL}/api/v1/weather/latest`,     { params: { city } })
axios.get(`${API_URL}/api/v1/traffic/latest`,     { params: { city } })
axios.get(`${API_URL}/api/v1/sentiment/trends`,   { params: { city, period: '24h' } })
```

### Trend modals

`AQITrendsModal`, `WeatherTrendsModal`, `TrafficTrendsModal`, and `SentimentTrendsModal` each load data from their corresponding hook:

| Hook | Endpoint |
|------|----------|
| `useAQITrends` | `/api/v1/aqi/trends` |
| `useWeatherTrends` | `/api/v1/weather/trends` |
| `useTrafficTrends` | `/api/v1/traffic/trends` |
| `useSentimentTrends` | `/api/v1/sentiment/trends` |

---

### Components & hooks

**Layout**
- `Header`, `Footer`, `Body`, `Sidebar`

**Chat**
- `ChatWidget` — connects via Socket.IO to `/` and handles session lifecycle

**Hooks**

| Hook | Description |
|------|-------------|
| `useFetchUser` | Fetch authenticated user info |
| `useChat` | Start session, send messages, poll for new messages |
| `useCityDashboard` | Main dashboard data (AQI, weather, traffic, sentiment) |
| `useAQITrends` | AQI trend data for modal |
| `useWeatherTrends` | Weather trend data for modal |
| `useTrafficTrends` | Traffic trend data for modal |
| `useSentimentTrends` | Sentiment trend data for modal |

---

### Styling

CSS modules per component and page; global `index.css` for resets and base styles.

---

## 🔌 API examples

**Sign up**
```js
await axios.post(`${API_URL}/api/v1/auth/signup`, {
  name, city, email, password
});
```

**Search city**
```js
await axios.get(`${API_URL}/api/v1/city/search`, {
  params: { city: encodeURIComponent(cityName) }
});
```

**Start chat session**
```js
fetch(`${API_URL}/api/v1/chat/start`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ cityId })
});
```

---

## 📦 Building & deployment

1. **Backend** — no build step required; runs directly with Node.js
2. **Frontend** — build for production:
```bash
cd frontend
npm run build
```

3. Serve the generated `dist/` folder with any static host (Vercel, Netlify, Nginx, etc.); set `VITE_API_URL` to your production API URL
4. Configure all production `.env` variables with valid API keys before deploying

> Make sure your backend is deployed and reachable before pointing `VITE_API_URL` at it.

---

## 🔍 Example requests

**Get latest AQI for a city**
```bash
curl "http://localhost:5000/api/v1/aqi/latest?city=Los%20Angeles"
```
```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "city": "...",
    "aqiValue": 85,
    "category": "Moderate",
    "pollutants": { "pm25": 12, "pm10": 20 },
    "recordedAt": "2026-02-27T12:00:00.000Z",
    "ingestionMeta": { "fetchedAt": "2026-02-27T11:59:50.000Z" }
  }
}
```

**Start a chat session**
```bash
curl -X POST http://localhost:5000/api/v1/chat/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cityId":"..."}'
```
---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature-name`
3. Lint the frontend before committing:
```bash
cd frontend
npx eslint .
```
4. Run the backend in watch mode during development:
```bash
cd backend
npx nodemon server.js
```
5. Submit a pull request with a clear description of your changes

---

## 📄 License

MIT — see the [LICENSE](./LICENSE) file for details.

---

> Explore the `backend/` and `frontend/` folders for detailed code — every route, model, and component referenced in this README exists in the workspace.