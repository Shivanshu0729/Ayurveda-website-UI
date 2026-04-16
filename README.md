# Ayurveda Kendra Website

A comprehensive web application for Ayurveda Kendra, featuring an interactive chatbot and contact registration system. The project includes both frontend and backend components to provide a seamless user experience for Ayurvedic consultations and inquiries.

## Features

### Frontend
- Interactive chatbot interface for Ayurvedic consultations
- Contact registration form
- Responsive design with modern UI
- Real-time chat functionality

### Backend
- RESTful API endpoints for contact submissions and chat proxying
- Secure handling of API keys (Groq/OpenAI) on the server side
- Data persistence for contacts and chat logs
- Static file serving for the frontend

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Data Storage**: JSON files (contacts.json, chat-log.json)
- **External APIs**: Groq/OpenAI for chatbot functionality
- **Development**: Nodemon for hot reloading

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- A valid API key for Groq or OpenAI

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

3. Set up environment variables:
   - Copy the environment template (if available) or create a `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Add your API key to `.env`:
     ```
     GROQ_API_KEY=your_api_key_here
     ```

## Usage

### Development
Start the development server with hot reloading:
```bash
npm run dev
```

### Production
Start the production server:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port specified in your environment).

## API Endpoints

- `POST /api/contact` — Submit contact registration form
- `POST /api/chat` — Send chat messages (proxied to AI service)
- `GET /api/health` — Health check endpoint
- Static files served from root for frontend assets

## Project Structure

```
Ayurveda-website/
├── chatbot.html          # Main chatbot interface
├── script.js             # Frontend JavaScript
├── style.css             # Frontend styles
├── server.js             # Express server
├── package.json          # Node.js dependencies
├── README.md             # This file
└── data/
    ├── contacts.json     # Contact form submissions
    └── chat-log.json     # Chat history
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Notes

- API keys are securely stored on the server to prevent exposure in the frontend
- Contact data and chat logs are stored locally in JSON files
- The chatbot integrates with AI services for Ayurvedic advice
