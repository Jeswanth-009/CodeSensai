import * as vscode from 'vscode';

interface DiffResult {
  summary: string;
  changes: string[];
  impact: string;
  recommendations: string;
}

export class DiffExplainer {
  private _apiUrl: string;

  constructor() {
    this._apiUrl = vscode.workspace.getConfiguration('codesensei').get<string>('apiUrl') || '';
  }

  async explainDiff(
    beforeCode: string,
    afterCode: string,
    language: string,
    mode: 'english' | 'hinglish'
  ): Promise<DiffResult | null> {
    if (!this._apiUrl) {
      vscode.window.showErrorMessage('Please set your AWS API URL in CodeSensei settings');
      return null;
    }

    try {
      const response = await fetch(`${this._apiUrl}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `BEFORE:\n${beforeCode}\n\nAFTER:\n${afterCode}`,
          language,
          mode,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      return await response.json() as DiffResult;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Diff explanation failed: ${err.message}`);
      return null;
    }
  }

  async explainGitDiff(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const document = editor.document;
    if (!document.isDirty) {
      vscode.window.showInformationMessage('No unsaved changes to compare');
      return;
    }

    const currentContent = document.getText();
    const language = document.languageId;

    // Use the saved version as "before"
    try {
      const uri = document.uri;
      const savedContent = (await vscode.workspace.fs.readFile(uri)).toString();

      if (savedContent === currentContent) {
        vscode.window.showInformationMessage('No changes detected');
        return;
      }

      const result = await this.explainDiff(savedContent, currentContent, language, 'english');
      if (result) {
        const panel = vscode.window.createWebviewPanel(
          'codeSenseiDiff',
          'CodeSensei Diff Explanation',
          vscode.ViewColumn.Beside,
          {}
        );

        panel.webview.html = this._renderDiffHtml(result);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to read saved file: ${err.message}`);
    }
  }

  private _renderDiffHtml(result: DiffResult): string {
    const changesHtml = Array.isArray(result.changes)
      ? result.changes.map(c => `<li style="margin-bottom:4px">${c}</li>`).join('')
      : `<li>${result.changes}</li>`;

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, sans-serif; background: #1e1e2e; color: #cdd6f4; padding: 20px; }
    .card { background: #2a2a3e; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 3px solid; }
    h2 { font-size: 14px; margin: 0 0 8px 0; }
    ul { margin: 0; padding-left: 20px; }
    li { font-size: 13px; line-height: 1.6; }
    p { font-size: 13px; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <h1 style="color:#a6e3a1;font-size:16px">🥋 CodeSensei Diff Explanation</h1>
  <div class="card" style="border-color:#89b4fa">
    <h2 style="color:#89b4fa">📝 Summary</h2>
    <p>${result.summary}</p>
  </div>
  <div class="card" style="border-color:#a6e3a1">
    <h2 style="color:#a6e3a1">🔄 Changes</h2>
    <ul>${changesHtml}</ul>
  </div>
  <div class="card" style="border-color:#fab387">
    <h2 style="color:#fab387">⚡ Impact</h2>
    <p>${result.impact}</p>
  </div>
  <div class="card" style="border-color:#cba6f7">
    <h2 style="color:#cba6f7">💡 Recommendations</h2>
    <p>${result.recommendations}</p>
  </div>
</body>
</html>`;
  }
}
