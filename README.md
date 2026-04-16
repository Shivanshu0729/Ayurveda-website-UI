# Ayurveda Kendra Backend

This project now includes a Node.js backend for the Ayurveda Kendra website.

## What it supports
- `POST /api/contact` — receives registration form submissions and stores them in `data/contacts.json`
- `POST /api/chat` — proxies chat messages to Groq/OpenAI endpoints using a server-side API key
- `GET /api/health` — simple health check endpoint
- Serves `chatbot.html` and static assets from the project root

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
3. Add your `GROQ_API_KEY` to `.env`.
4. Start the server:
   ```bash
   npm start
   ```

## Local development
Use `npm run dev` to start the server with `nodemon`.

## Notes
- The backend keeps model credentials on the server, so the frontend no longer exposes them.
- Contact submissions and chat history are stored in `data/`.
