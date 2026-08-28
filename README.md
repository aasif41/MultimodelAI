# MultimodelAI

Multimodal AI Application powered by React, Vite, Express, Groq API, and Hugging Face.

## Project Structure
```
├── public/
├── server/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## Setup & Installation

### 1. Server Setup
```bash
cd server
npm install
# Copy .env.example to .env and configure your API keys
cp .env.example .env
npm start # or node index.js
```

### 2. Client Setup
```bash
npm install
# Copy .env.example to .env
cp .env.example .env
npm run dev
```
