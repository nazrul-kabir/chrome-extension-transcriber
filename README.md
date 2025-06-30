# Chrome Extension Transcriber

A Chrome Extension built with Preact and Vite that provides real-time transcription using transformers.js and Whisper, running entirely in the browser.

## 🚀 Features

- **Real-time Transcription**: Uses Whisper models via transformers.js for in-browser speech-to-text
- **Text Summarization**: Automatic summarization using T5/BART models
- **Local Storage**: Save and load transcripts and summaries locally
- **Modern UI**: Built with Preact and responsive design
- **Privacy-First**: All processing happens locally in the browser

## 📦 Tech Stack

- **Frontend Framework**: Preact
- **Bundler**: Vite
- **Chrome Extension**: Manifest V3
- **ML Inference**: transformers.js (ONNX models)
- **Audio Capture**: Web Audio API
- **Storage**: localStorage
- **Language**: TypeScript

## 🛠️ Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser

### Installation

1. Clone or extract the project:
   ```bash
   cd chrome-extension-transcriber
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist` folder from your project
4. The extension should now appear in your extensions list

### Development Commands

- `npm run dev` - Start development server (for testing components)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🏗️ Project Structure

```
chrome-extension-transcriber/
├── public/
│   └── manifest.json          # Chrome extension manifest
├── src/
│   ├── components/
│   │   ├── Transcript.tsx     # Transcript display component
│   │   └── Summary.tsx        # Summary display component
│   ├── ml/
│   │   ├── whisper.ts         # Whisper model integration
│   │   └── summarizer.ts      # Text summarization
│   ├── utils/
│   │   ├── audioCapture.ts    # Web Audio API utilities
│   │   └── storage.ts         # localStorage management
│   ├── app.tsx                # Main app component
│   ├── app.css                # Styles
│   ├── background.ts          # Background script
│   └── main.tsx               # Entry point
├── vite.config.ts             # Vite configuration
└── package.json
```

## 🔧 Implementation Status

### ✅ Completed (Bootstrap)
- Chrome Extension setup with Manifest V3
- Preact UI components with basic styling
- Audio capture utilities using Web Audio API
- Storage utilities for localStorage
- ML model integration stubs (Whisper & summarization)
- Build configuration for Chrome Extension

### 🚧 To Implement
- Actual transformers.js integration
- Real Whisper model loading and inference
- Real-time audio processing pipeline
- Text summarization implementation
- Error handling and user feedback
- Settings and configuration UI
- Export/import functionality

## 📝 Usage

1. Click the extension icon in Chrome toolbar
2. Click "Start Recording" to begin audio capture
3. Speak into your microphone
4. View real-time transcript in the extension popup
5. Get automatic summary of the transcribed text
6. Transcripts are automatically saved locally

## 🔒 Permissions

The extension requires the following permissions:
- `activeTab` - Access to current tab
- `storage` - Local data storage
- `scripting` - Script injection capabilities

## 🤝 Contributing

This is a bootstrap/starter project. To contribute:

1. Implement the ML model integration using transformers.js
2. Add real-time audio processing
3. Improve UI/UX design
4. Add more features like export, settings, etc.

## 📄 License

MIT License - feel free to use this as a starting point for your own projects.

## 🔗 Useful Links

- [transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Preact Documentation](https://preactjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

