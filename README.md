# Bolt Clone - AI Code Generator

A simple clone of Bolt.new where you can prompt AI to generate code and then update it iteratively.

## Features

- 💬 Chat interface for describing what you want to build
- 🤖 AI-powered code generation using **Ollama** (runs locally - completely free!)
- 👀 Live preview of generated HTML/CSS/JavaScript
- 🔍 Syntax-highlighted code display
- 🔄 Iterative code updates and modifications
- 📱 Split-screen interface (chat + code/preview)
- 🏠 **100% Local** - No API keys needed!

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install and Set up Ollama

1. **Install Ollama** (if you haven't already):
   - Visit [ollama.ai](https://ollama.ai) and download for your platform
   - Or on macOS: `brew install ollama`

2. **Pull a coding model**:
   ```bash
   ollama pull codellama
   # OR use other models like:
   # ollama pull deepseek-coder
   # ollama pull llama2
   # ollama pull mistral
   ```

3. **Start Ollama server**:
   ```bash
   ollama serve
   ```
   (Keep this running in a separate terminal)

4. **Copy the environment template** (optional):
   ```bash
   cp .env.example .env
   ```
   
   You can modify the `.env` file to change the model or URL if needed.

### 3. Run the Application

Start both the frontend and backend:
```bash
npm run dev
```

This will start:
- Frontend (Vite + React) on http://localhost:3000
- Backend (Express + OpenAI) on http://localhost:3001

## Usage

1. Open http://localhost:3000 in your browser
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
- **Backend**: Express.js, Ollama API
- **AI**: Ollama (local AI models)
- **Styling**: Pure CSS with dark theme
- **Icons**: Lucide React

## Notes

- **Completely FREE** - No API keys or subscriptions needed!
- Uses Ollama for local AI code generation (models like CodeLlama, DeepSeek Coder)
- Generated code runs in a sandboxed iframe for security
- All code is temporary and resets when you refresh
- Works offline once models are downloaded

## Contributing

Feel free to submit issues and PRs to improve this Bolt.new clone!