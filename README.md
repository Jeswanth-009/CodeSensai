# 🥋 CodeSensei — AI Reasoning Coach for Indian Developers

> Built for the **AWS AI for Bharat Hackathon** | Team XFactor

An intelligent VS Code extension powered by **Amazon Bedrock (Claude Haiku 3)** that teaches developers WHY code works — not just what it does. With 4-layer reasoning, Hinglish mode, Socratic tutoring, and Big-O complexity analysis.

[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange)](https://aws.amazon.com/bedrock/)
[![Lambda](https://img.shields.io/badge/AWS-Lambda-orange)](https://aws.amazon.com/lambda/)
[![DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-blue)](https://aws.amazon.com/dynamodb/)

---

## 🌐 Live Demo (GitHub Codespaces)

**Open in Codespace:** Click the green "Code" button on GitHub → "Open with Codespaces"  
**Health Check:** Forward port 3000 → visit `/health`  
**GitHub:** https://github.com/Jeswanth-009/AI-For-Bharat

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 4-Layer Reasoning | What, Why, Pitfalls, Socratic Question |
| 🇮🇳 Hinglish Mode | Desi explanations with Indian analogies |
| 🔍 CodeLens | One-click explain above every function |
| ⚠️ Error Translator | Plain-language error explanations |
| 💬 Socratic Chat | Follow-up Q&A to deepen understanding |
| ⚡ Complexity Analyzer | Big-O time and space complexity |
| 📜 Local History | Browse past explanations |
| 📥 Export | Save explanations as Markdown |

---

## 🏗️ AWS Architecture

```
VS Code Extension / Web Demo
         │
         ▼
Amazon API Gateway (REST)
         │
         ▼
AWS Lambda (Node.js 20.x)
    ├── /explain    → Amazon Bedrock (Claude Haiku 3)
    ├── /followup   → Amazon Bedrock (Claude Haiku 3)
    ├── /complexity → Amazon Bedrock (Claude Haiku 3)
    ├── /history    → Amazon DynamoDB
    └── /health     → Status check
```

---

## 🚀 Setup & Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed
- Node.js 20+
- VS Code 1.85+

### 1. Deploy AWS Backend

```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

Note the API URL from the output.

### 2. Install Extension

```bash
cd extension
npm install
npm run compile
```

Open `extension/` in VS Code and press **F5**.

### 3. Configure Extension

Open VS Code Settings → search `codesensei.apiUrl` → paste your API Gateway URL.

### 4. Run Web Demo (GitHub Codespaces)

```bash
cd server
cp .env.example .env
# Edit .env to add your AWS API URL
npm install
npm start
```

The Codespace will auto-forward port 3000 as public — that URL is your **Working Prototype Link** for the hackathon submission.

---

## 📁 Project Structure

```
codesensei/
├── .devcontainer/          # GitHub Codespaces config
│   └── devcontainer.json
├── .github/workflows/      # CI/CD pipeline
│   └── deploy.yml
├── extension/              # VS Code extension
│   ├── src/                # TypeScript sources
│   │   ├── extension.ts
│   │   ├── sidebarProvider.ts
│   │   ├── codeLensProvider.ts
│   │   ├── diagnosticProvider.ts
│   │   ├── historyManager.ts
│   │   ├── complexityAnalyzer.ts
│   │   ├── autoExplainProvider.ts
│   │   ├── exportManager.ts
│   │   └── diffExplainer.ts
│   ├── webview/src/         # React sidebar UI
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── components/
│   ├── package.json
│   ├── tsconfig.json
│   ├── webpack.config.js
│   └── tailwind.config.js
├── lambda/                 # AWS Lambda functions
│   ├── explain/
│   ├── followup/
│   ├── complexity/
│   ├── history/
│   ├── health/
│   └── shared/promptBuilder.js
├── server/                 # Local proxy for Codespaces
│   ├── server.js
│   └── .env.example
├── web-demo/               # Standalone web demo
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── infrastructure/         # AWS SAM template
│   ├── template.yaml
│   └── deploy.sh
├── README.md
└── .gitignore
```

---

## 💰 Cost Analysis

| Service | Free Tier | Scaled (1000 users/month) |
|---------|-----------|--------------------------|
| Lambda | 1M req free | ₹0 |
| API Gateway | 1M calls free | ₹250 |
| Bedrock Haiku | Pay per use | ~₹800 |
| DynamoDB | 25GB free | ₹0 |
| **Total** | **₹0** | **~₹1,050/month** |

---

## 🎯 Why AI? Why AWS?

**Why AI is required:** Code understanding is inherently semantic — no rule-based system can explain WHY a design pattern was chosen or generate Socratic questions specific to the developer's exact code.

**Why Amazon Bedrock:** Managed access to Claude Haiku 3 without infrastructure overhead. Pay-per-use pricing makes it viable for student developers.

**Value added by AI:** Transforms cryptic errors and complex patterns into personalized, culturally-relevant explanations — bridging the gap between confusion and clarity for 10M+ Indian developers.

---

*"Code samajhna hai toh CodeSensei se seekho!"* 🥋  
**Built with ❤️ by Team XFactor for India's developers**
