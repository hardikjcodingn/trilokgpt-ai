# 🚀 TrilokGPT Quick Start Guide

## ⚡ 5-Minute Setup (Windows)

### 1. Install Prerequisites
```bash
# Download Node.js from https://nodejs.org/ (v16 or higher)
# Download Ollama from https://ollama.ai/
```

### 2. Start Ollama
```bash
# Open Command Prompt and run:
ollama serve

# In another Command Prompt, download models (one-time):
ollama pull llama2
ollama pull nomic-embed-text
```

### 3. Start TrilokGPT
```bash
# In project directory:
cd trilokgpt-ai
start-windows.bat
```

That's it! Open http://localhost:8000 in your browser.

---

## 📱 Using the System

### Upload Documents
1. Click the upload area on the left
2. Select PDF, DOCX, TXT, or images
3. Wait for processing to complete

### Ask Questions
1. Type your question in the chat box
2. Press Send (Ctrl+Enter)
3. Get instant answers based on your documents

### Enable AI Responses
- Check "Use Ollama LLM for detailed answers"
- The system will generate natural language responses

---

## 🔧 Troubleshooting

**"Cannot connect to Ollama"**
```bash
# Make sure Ollama is running in a separate terminal:
ollama serve
```

**"Module not found"**
```bash
# Reinstall dependencies:
cd backend
npm install
```

**"Port 8000 already in use"**
```bash
# Edit backend/.env:
PORT=8001  # or any other free port
```

**"Out of memory"**
- Restart Ollama: `Ctrl+C` then `ollama serve`
- Use a smaller model: `ollama pull neural-chat`

---

## 📚 Available Models

### For LLM (Question Answering)
```bash
ollama pull llama2        # 7B - Good balance (default)
ollama pull mistral       # 7B - Faster
ollama pull gemma         # 7B - Smaller
ollama pull neural-chat   # 7B - Lightweight
```

### For Embeddings
```bash
ollama pull nomic-embed-text      # 384-dim - Fast (default)
ollama pull all-minilm-l6-v2      # 384-dim - Small
ollama pull mxbai-embed-large     # 1024-dim - Most accurate
```

---

## 🌐 Network Access

### Access from Other Computers
1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Edit `backend/.env`:
   ```env
   API_URL=http://<YOUR_IP>:8000
   ```
3. Access from other computers: `http://<YOUR_IP>:8000`

---

## 📊 Performance Tips

| Setting | Fast | Balanced | Accurate |
|---------|------|----------|----------|
| Model | neural-chat | llama2 | mistral |
| Embedding | nomic-embed | nomic-embed | mxbai-embed |
| Top-K | 3 | 5 | 10 |
| Chunk Size | 300 | 500 | 1000 |

---

## 🛑 Stop the Server

Press `Ctrl+C` in the terminal running the server.

---

## 📖 Full Documentation

See `README.md` for complete documentation, API reference, and advanced configuration.

---

## ❓ Quick FAQ

**Q: Do I need internet?**
A: No, everything runs locally offline.

**Q: Is my data safe?**
A: Yes, 100% private. Files never leave your computer.

**Q: Can I use this commercially?**
A: Yes, MIT license - completely free for any use.

**Q: What about file sizes?**
A: Supports up to 500MB (adjustable in code).

**Q: Can I change the port?**
A: Yes, edit `backend/.env` and set `PORT=8001` (or any free port).

---

**Happy analyzing! 🎉**
