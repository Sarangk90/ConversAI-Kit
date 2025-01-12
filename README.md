# ConversAI-Kit

A comprehensive, modern AI chat platform with a React frontend and Python backend. Build powerful conversational experiences with multiple AI models, voice interactions, and multi-modal capabilities.

## Features

Current:
- 🎯 Modern, responsive React-based UI
- 💬 Real-time chat with streaming responses
- 🤖 Multiple model support (OpenAI integration)
- 🖼️ Image handling capabilities
- 🔒 Secure environment configuration
- 📝 Automatic conversation naming
- 📚 Conversation history and management
- 🚀 FastAPI backend with type safety
- 📖 Interactive API documentation

Planned:
- 🧠 Multiple LLM integrations (GPT-4, Claude, Llama)
- 📄 Document processing (RAG)
- 📚 Custom knowledge base integration
- 🔄 Multi-modal conversations
- 💾 Enhanced conversation memory and context

## Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- Python 3.9+
- OpenAI API key

## Project Structure

```
ConversAI-Kit/
├── chatbot-ui/          # React frontend
│   ├── src/            # Source files
│   ├── public/         # Static files
│   └── package.json    # Frontend dependencies
├── chatbot-api/        # Python FastAPI backend
│   ├── src/           # Source files
│   │   ├── app.py    # Main FastAPI application
│   │   ├── chat.py   # Chat logic
│   │   └── database.py# Database operations
│   ├── tests/        # Test files
│   └── requirements.txt# Backend dependencies
```

## Quick Start

### Frontend (chatbot-ui)
1. Navigate to the frontend directory:
   ```bash
   cd chatbot-ui
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn start
   ```
   The UI will be available at http://localhost:3000

### Backend (chatbot-api)
1. Create and activate a virtual environment:
   ```bash
   cd chatbot-api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Start the server:
   ```bash
   uvicorn src.app:app --reload --port 5001
   ```
   The API will be available at http://localhost:5001
   API Documentation at http://localhost:5001/docs

## Development

### Code Style
- Frontend: ESLint and Prettier for JavaScript/React
- Backend: PEP 8 guidelines for Python
- Use meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code of Conduct
- Development process
- How to submit pull requests
- Bug reporting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📫 For bugs and feature requests, please use [GitHub Issues](https://github.com/yourusername/ConversAI-Kit/issues)
- 💬 For questions and discussions, use [GitHub Discussions](https://github.com/yourusername/ConversAI-Kit/discussions)

## Acknowledgments

- Thanks to all contributors who help improve this project
- Built with React, FastAPI, and OpenAI 