import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

interface Explanation {
  level1: string;
  level2: string;
  pitfalls: string;
  socraticQuestion: string;
  errorExplanation: string | null;
  code?: string;
  language?: string;
  timestamp?: string;
  mode?: string;
}

interface ComplexityResult {
  timeComplexity: string;
  spaceComplexity: string;
  badge: 'green' | 'yellow' | 'red';
  explanation: string;
  optimization: string | null;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _apiUrl: string;
  private _userId: string;
  private _currentExplanation: Explanation | null = null;
  private _latestSocraticQuestion: string | null = null;
  private _historyPath: string;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    userId: string
  ) {
    this._userId = userId;
    this._apiUrl = vscode.workspace.getConfiguration('codesensei').get<string>('apiUrl') || '';
    this._historyPath = path.join(os.homedir(), '.codesensei', 'history.json');
    this._ensureHistoryDir();
  }

  private _ensureHistoryDir() {
    const dir = path.dirname(this._historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  updateApiUrl(url: string) {
    this._apiUrl = url;
  }

  getCurrentExplanation(): Explanation | null {
    return this._currentExplanation;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._context.extensionUri, 'dist')
      ]
    };

    webviewView.webview.html = this._getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'followup':
          await this._handleFollowup(message);
          break;
        case 'getHistory':
          await this._sendHistory();
          break;
        case 'clearHistory':
          await this._clearHistory();
          break;
        case 'loadHistoryItem':
          this._loadHistoryItem(message.item);
          break;
        case 'export':
          await vscode.commands.executeCommand('codesensei.exportNotes');
          break;
        case 'ready':
          this._view?.webview.postMessage({
            type: 'init',
            userId: this._userId,
            apiUrl: this._apiUrl
          });
          break;
      }
    });
  }

  async explainCode(code: string, language: string, errorMessage: string | null, mode: 'english' | 'hinglish') {
    if (!this._apiUrl) {
      vscode.window.showErrorMessage('Please set your AWS API URL in CodeSensei settings');
      return;
    }

    this._view?.webview.postMessage({ type: 'loading', message: 'Analyzing your code...' });

    await vscode.commands.executeCommand('codesensei.sidebar.focus');

    try {
      const response = await fetch(`${this._apiUrl}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          errorMessage,
          mode,
          userId: this._userId,
          conversationHistory: []
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const explanation: Explanation = await response.json() as Explanation;
      explanation.code = code;
      explanation.language = language;
      explanation.timestamp = new Date().toISOString();
      explanation.mode = mode;

      this._currentExplanation = explanation;
      this._latestSocraticQuestion = null;
      this._saveToLocalHistory(explanation);

      this._view?.webview.postMessage({
        type: 'explanation',
        data: explanation,
        code,
        language,
        mode
      });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'error',
        message: err.message || 'Failed to get explanation'
      });
    }
  }

  async analyzeComplexity(code: string, language: string) {
    if (!this._apiUrl) {
      vscode.window.showErrorMessage('Please set your AWS API URL in CodeSensei settings');
      return;
    }

    this._view?.webview.postMessage({ type: 'loading', message: 'Analyzing complexity...' });

    await vscode.commands.executeCommand('codesensei.sidebar.focus');

    try {
      const response = await fetch(`${this._apiUrl}/complexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, mode: 'english' })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const result: ComplexityResult = await response.json() as ComplexityResult;

      this._view?.webview.postMessage({ type: 'complexity', data: result });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'error',
        message: err.message || 'Failed to analyze complexity'
      });
    }
  }

  private async _handleFollowup(message: any) {
    if (!this._apiUrl || !this._currentExplanation) return;

    this._view?.webview.postMessage({ type: 'chatLoading' });

    try {
      // Use the latest socratic question (may have been updated by previous follow-up)
      const currentQuestion = this._latestSocraticQuestion || this._currentExplanation.socraticQuestion;

      const response = await fetch(`${this._apiUrl}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: this._currentExplanation.code,
          userAnswer: message.answer,
          socraticQuestion: currentQuestion,
          mode: message.mode || 'english',
          conversationHistory: message.history || []
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const result: any = await response.json();

      // Track the next question for context continuity
      if (result.nextQuestion) {
        this._latestSocraticQuestion = result.nextQuestion;
      }

      this._view?.webview.postMessage({ type: 'chatResponse', data: result });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'chatError',
        message: err.message
      });
    }
  }

  private _saveToLocalHistory(explanation: Explanation) {
    try {
      let history: Explanation[] = [];
      if (fs.existsSync(this._historyPath)) {
        history = JSON.parse(fs.readFileSync(this._historyPath, 'utf8'));
      }
      history.unshift(explanation);
      history = history.slice(0, 100);
      fs.writeFileSync(this._historyPath, JSON.stringify(history, null, 2));
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }

  private async _sendHistory() {
    try {
      let history: Explanation[] = [];
      if (fs.existsSync(this._historyPath)) {
        history = JSON.parse(fs.readFileSync(this._historyPath, 'utf8'));
      }
      this._view?.webview.postMessage({ type: 'history', data: history });
    } catch (err) {
      this._view?.webview.postMessage({ type: 'history', data: [] });
    }
  }

  private async _clearHistory() {
    try {
      fs.writeFileSync(this._historyPath, JSON.stringify([], null, 2));
      this._view?.webview.postMessage({ type: 'history', data: [] });
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }

  private _loadHistoryItem(item: Explanation) {
    this._currentExplanation = item;
    this._view?.webview.postMessage({
      type: 'explanation',
      data: item,
      code: item.code,
      language: item.language,
      mode: item.mode || 'english'
    });
  }

  private _getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview.js')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https:;">
  <title>CodeSensei</title>
</head>
<body style="margin:0;padding:0;background:#1e1e2e;">
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
