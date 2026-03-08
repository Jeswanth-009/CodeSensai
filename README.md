# 🥋 CodeSensei — AI Reasoning Coach for Indian Developers

> **AWS AI for Bharat Hackathon** | Team XFactor

**CodeSensei** is a VS Code extension that teaches developers *why* code works — not just what it does. Powered by **Amazon Bedrock (Nova Lite)**, it delivers multi-layered explanations, Socratic tutoring, Big-O complexity analysis, and Hinglish support — all from your editor sidebar.

[![AWS Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Nova%20Lite-FF9900?logo=amazon-aws)](https://aws.amazon.com/bedrock/)
[![Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=aws-lambda)](https://aws.amazon.com/lambda/)
[![DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-4053D6?logo=amazon-dynamodb)](https://aws.amazon.com/dynamodb/)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visual-studio-code)](https://code.visualstudio.com/)

---

## The Problem

India has **10M+ developers** — many are self-taught, learning from tutorials that show *what* to type but rarely explain *why*. Error messages are cryptic, design patterns feel arbitrary, and the gap between "it works" and "I understand it" remains wide. Existing tools auto-complete code; none teach you to *reason* about it.

## The Solution

CodeSensei sits inside VS Code and acts like a senior developer mentor:

- **Select any code** → get a 4-layer breakdown (beginner explanation → design reasoning → pitfalls → Socratic question)
- **Answer the Socratic question** → get evaluated with follow-up dialogue that builds deeper understanding
- **Switch to Hinglish** → get explanations with Indian analogies (async/await = ordering chai at a stall)
- **Analyze complexity** → instant Big-O rating with color-coded badges and optimization suggestions

---

## Features

| Feature | What it does |
|---------|-------------|
| **4-Layer Reasoning** | Level 1 (what) → Level 2 (why/design) → Pitfalls → Socratic Question |
| **Hinglish Mode** 🇮🇳 | Hindi-English explanations with desi analogies |
| **Socratic Chat** | Multi-turn follow-up Q&A — the AI remembers context |
| **Complexity Analyzer** | Big-O time & space analysis with green/yellow/red badges |
| **CodeLens** | One-click "Explain" button above every function |
| **Error Translator** | Select an error → get a plain-language explanation |
| **Export to Markdown** | Save any explanation as a `.md` file |
| **Local History** | Browse and reload past explanations |
| **Per-User History** | DynamoDB-backed history tied to your user ID |

---

## Architecture

```
┌─────────────────────────┐
│   VS Code Extension     │
│   (TypeScript + React)  │
└──────────┬──────────────┘
           │ HTTPS
           ▼
┌─────────────────────────┐
│   Amazon API Gateway    │
│   (REST, ap-south-2)    │
└──────────┬──────────────┘
           │
     ┌─────┴──────┬──────────┬────────────┐
     ▼            ▼          ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ /explain│ │/followup│ │/complex │ │/history │
│ Lambda  │ │ Lambda  │ │ Lambda  │ │ Lambda  │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │            │
     ▼           ▼           ▼            ▼
┌─────────────────────┐          ┌──────────────┐
│   Amazon Bedrock    │          │   DynamoDB   │
│   (Nova Lite v1)    │          │  (History)   │
│   Region: us-east-1 │          │  ap-south-2  │
└─────────────────────┘          └──────────────┘
```

**All infrastructure is serverless** — zero servers to manage, scales to zero when idle, pay only for what you use.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | TypeScript, React 18, Tailwind CSS, Webpack 5 |
| Backend | AWS Lambda (Node.js 20.x), API Gateway REST |
| AI Model | Amazon Bedrock — Nova Lite v1 |
| Database | Amazon DynamoDB (TTL-enabled, 30-day expiry) |
| Infrastructure | AWS SAM (CloudFormation) |
| Region | ap-south-2 (Hyderabad) — Lambdas & DynamoDB |
| CI/CD | GitHub Actions |

---

## Quick Start

### Prerequisites
- AWS CLI configured with Bedrock access
- AWS SAM CLI
- Node.js 20+
- VS Code 1.85+

### 1. Deploy Backend

```powershell
cd infrastructure
sam build
sam deploy --guided --region ap-south-2
```

Copy the API URL from the output.

### 2. Build & Run Extension

```bash
cd extension
npm install
npx webpack --mode production
```

Press **F5** in VS Code to launch the Extension Development Host.

### 3. Configure

VS Code Settings → search `codesensei.apiUrl` → paste your API Gateway URL.

### 4. Use It

1. Open any code file
2. Select code → right-click → **"Explain with CodeSensei"**
3. Or click the **CodeLens** button above any function
4. Toggle Hinglish mode with the 🇮🇳 switch
5. Answer the Socratic question in the chat
6. Right-click → **"Analyze Complexity"** for Big-O analysis

---

## Project Structure

```
codesensei/
├── extension/                  # VS Code extension
│   ├── src/                    # TypeScript source
│   │   ├── extension.ts        # Entry point, command registration
│   │   ├── sidebarProvider.ts  # Webview panel, API calls, message handling
│   │   ├── codeLensProvider.ts # Inline "Explain" buttons
│   │   ├── exportManager.ts    # Markdown export
│   │   └── autoExplainProvider.ts
│   ├── webview/src/            # React sidebar UI
│   │   ├── App.tsx             # Main component, state management
│   │   └── components/         # ExplanationCard, ChatThread, ComplexityBadge...
│   ├── package.json
│   └── webpack.config.js       # Dual config: extension + webview
│
├── lambda/                     # AWS Lambda functions
│   ├── explain/index.js        # 4-layer code explanation
│   ├── followup/index.js       # Multi-turn Socratic chat
│   ├── complexity/index.js     # Big-O analysis
│   ├── history/index.js        # Per-user history (DynamoDB)
│   ├── health/index.js         # Health check
│   └── shared/promptBuilder.js # All prompts (explain, followup, complexity)
│
├── infrastructure/
│   ├── template.yaml           # SAM template (Lambda, API GW, DynamoDB)
│   └── deploy.ps1              # Windows deployment script
│
├── web-demo/                   # Standalone web demo
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
└── server/                     # Proxy server for Codespaces demo
    └── server.js
```

---

## How the AI Works

**Explain Flow:**
1. User selects code → extension sends it to `/explain` Lambda
2. Lambda builds a structured prompt via `promptBuilder.js` asking for JSON output with 4 fields
3. Amazon Bedrock (Nova Lite) generates the explanation
4. Lambda normalizes all fields to strings, saves to DynamoDB, returns JSON
5. Extension renders each field in a collapsible card

**Follow-up Flow (Multi-Turn):**
1. User answers the Socratic question in the chat
2. Extension sends the answer + full conversation history to `/followup` Lambda
3. Lambda constructs proper multi-turn messages (user/assistant alternation) for Nova Lite
4. Model evaluates the answer with full context of previous exchanges
5. Returns feedback + deeper insight + next question

**Hinglish Mode:**
The system prompt switches to Hindi-English with Indian analogies:
- `async/await` → ordering chai at a stall — you place the order, then wait or do other things
- `hash maps` → phone directory — name se number milta hai instantly
- `recursion` → looking at yourself in two facing mirrors

---

## Cost Analysis

| Service | Free Tier | At Scale (1000 users/month) |
|---------|-----------|---------------------------|
| Lambda | 1M requests free | ₹0 |
| API Gateway | 1M calls free | ₹250 |
| Bedrock Nova Lite | Pay per token | ~₹400 |
| DynamoDB | 25 GB free | ₹0 |
| **Total** | **₹0** | **~₹650/month** |

Nova Lite is significantly cheaper than Claude/GPT while delivering quality explanations for code reasoning tasks.

---

## Why AI? Why AWS?

**Why AI is required:** Code understanding is semantic — no rule-based system can explain *why* a design pattern was chosen, generate Socratic questions specific to the developer's exact code, or produce culturally relevant analogies in Hinglish.

**Why Amazon Bedrock:** Fully managed access to foundation models with no infrastructure overhead. Pay-per-token pricing makes it viable for student developers. Nova Lite offers the best cost-quality ratio for structured reasoning tasks.

**Why Serverless:** A student in tier-2 India shouldn't pay for idle servers. Lambda + API Gateway + DynamoDB scale to zero — the cost is literally ₹0 when no one is using it.

**Impact:** Bridges the gap between "it works" and "I understand it" for millions of self-taught Indian developers learning from tutorials and Stack Overflow.

---

## Team

**Team XFactor** — Built for the AWS AI for Bharat Hackathon

---

*"Code samajhna hai toh CodeSensei se seekho!"* 🥋
