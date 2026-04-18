# Ayurveda Kendra Web Application

Production-oriented full-stack web platform for Ayurveda consultation and lead management.

It combines an immersive frontend experience with a Node.js API layer for AI-assisted chat, contact capture, personalized journey requests, and admin-level request monitoring.

## Features

- AI-powered Ayurveda chatbot integrated with Groq (OpenAI-compatible API flow)
- Structured journey planner with guided intake and WhatsApp handoff
- Contact submission workflow for lead capture and follow-up
- Admin dashboard support through secured journey data access
- Optional SMTP notifications for newly submitted journey requests
- Responsive multi-page interface with dedicated chatbot, journey, admin, and cosmic-healing pages

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js, Express |
| AI Integration | Groq Chat Completions (OpenAI-compatible endpoint) |
| Notifications | Nodemailer (optional SMTP) |
| Development | Nodemon |
| Storage | JSON file persistence in data/ |

## Project Structure

```text
Ayurveda-website/
├── client/
│   ├── css/
│   ├── js/
│   └── pages/
│       ├── admin.html
│       ├── chatbot.html
│       ├── cosmic-healing.html
│       └── journey.html
├── server/
│   └── server.js
├── config/
│   └── .env.example
├── data/
│   ├── chat-log.json
│   ├── contacts.json
│   └── journey-requests.json
├── nodemon.json
├── package.json
└── README.md
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Shivanshu0729/Ayurveda-website.git
cd Ayurveda-website
```

2. Install dependencies:

```bash
npm install
```

3. Create environment configuration:

```bash
copy config\\.env.example config\\.env
```

4. Update config/.env with your runtime values.

## Usage

Run in development mode:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

Default base URL:

- http://localhost:3000

Primary routes:

- / (loads chatbot page)
- /pages/chatbot.html
- /pages/journey.html
- /pages/admin.html
- /pages/cosmic-healing.html

## API Endpoints

| Method | Endpoint | Purpose | Notes |
| --- | --- | --- | --- |
| POST | /api/contact | Save contact inquiry | Requires `name` and `email` |
| POST | /api/journey | Save journey request | Requires `track`, `name`, and `email`; returns a WhatsApp URL |
| GET | /api/journey | Fetch journey requests for admin dashboard | Protected only when `ADMIN_TOKEN` is configured |
| POST | /api/chat | Generate AI response for chatbot UI | Requires `GROQ_API_KEY` |
| GET | /api/health | Service health check | Returns status and uptime |

## Environment Variables

Create `config/.env` from `config/.env.example`.

| Variable | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes (for chat) | API key for Groq chat completions |
| `GROQ_MODEL` | No | Model name. Default: `llama-3.1-8b-instant` |
| `PORT` | No | Server port. Default: `3000` |
| `CORS_ORIGIN` | No | Allowed frontend origin in production |
| `CLINIC_WHATSAPP_NUMBER` | No | WhatsApp number used in journey handoff link |
| `ADMIN_TOKEN` | No | Enables token-protected admin access for `GET /api/journey` |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_SECURE` | No | SMTP transport security (`true`/`false`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM_EMAIL` | No | Sender email for notifications |
| `NOTIFY_TO_EMAIL` | No | Destination email for journey notifications |

## Future Improvements

- Replace JSON file storage with PostgreSQL or MongoDB for scalability
- Add authentication and role-based access control for admin workflows
- Add automated testing and CI pipeline for quality enforcement
- Introduce containerized deployment and environment-specific configs
- Expand analytics for chatbot usage and conversion performance

## Contributing

Contributions are welcome. For major changes, open an issue first to discuss scope and implementation.

1. Fork the repository
2. Create a feature branch
3. Commit with clear messages
4. Push your branch
5. Open a pull request

Before submitting:

- Do not commit secrets (config/.env)
- Do not commit generated runtime data files unless intentionally required
- Verify the app runs locally with npm run dev