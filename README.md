# Bolt Clone - AI Code Generator

A simple clone of Bolt.new where you can prompt AI to generate code and then update it iteratively.

## Features

- 💬 Chat interface for describing what you want to build
- 🤖 AI-powered code generation using **Google Gemini** (cloud-based AI)
- 👀 Live preview of generated HTML/CSS/JavaScript
- 🔍 Syntax-highlighted code display
- 🔄 Iterative code updates and modifications
- 📱 Split-screen interface (chat + code/preview)
- 🌐 **Cloud-based AI** - Uses Google Gemini API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Google Gemini API

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Copy your API key

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   
3. **Add your API key to .env**:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   PORT=3001
   ```

### 3. Run the Application

Start both the frontend and backend:
```bash
npm run dev
```

This will start:
- Frontend (Vite + React) on http://localhost:5173
- Backend (Express + Gemini) on http://localhost:3001

## Usage

1. Open http://localhost:5173 in your browser
2. Type what you want to build in the chat (e.g., "Create a todo app")
3. The AI will generate HTML, CSS, and JavaScript code
4. View the live preview or inspect the code
5. Ask for modifications (e.g., "Make it blue" or "Add a delete button")

## Example Prompts

- "Create a calculator"
- "Build a simple landing page"
- "Make a todo app with add/delete functionality"
- "Create a weather widget"
- "Build a simple game like rock paper scissors"

## Project Structure

```
bolt-clone/
├── public/                 # Static files
├── src/
│   ├── components/
│   │   ├── ChatPanel.jsx   # Chat interface
│   │   └── CodePanel.jsx   # Code display and preview
│   ├── App.jsx            # Main application
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── server/
│   └── server.js          # Express API server
├── package.json
└── vite.config.js
```

## Technologies Used

- **Frontend**: React, Vite, Prism (syntax highlighting)
- **Backend**: Express.js, Gemini API
- **AI**: Google Gemini (cloud AI models)
- **Styling**: Pure CSS with dark theme
- **Icons**: Lucide React

## Notes

- **Cloud-based AI** - Uses Google Gemini API for high-quality code generation
- Generated code runs in a sandboxed iframe for security
- All code is temporary and resets when you refresh
- Requires internet connection for AI generation

## Contributing

Feel free to submit issues and PRs to improve this Bolt.new clone!