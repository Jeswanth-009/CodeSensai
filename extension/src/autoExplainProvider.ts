import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';

export class AutoExplainProvider {
  private _enabled: boolean = false;
  private _lastErrorUri: string = '';
  private _debounceTimer: NodeJS.Timeout | null = null;

  constructor(private readonly _sidebarProvider: SidebarProvider) {
    vscode.languages.onDidChangeDiagnostics(this._onDiagnosticsChanged.bind(this));
  }

  toggle() {
    this._enabled = !this._enabled;
    vscode.window.showInformationMessage(
      `CodeSensei Auto-Explain: ${this._enabled ? 'ON 🟢' : 'OFF 🔴'}`
    );
  }

  private _onDiagnosticsChanged(event: vscode.DiagnosticChangeEvent) {
    if (!this._enabled) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    if (!event.uris.some(uri => uri.toString() === editor.document.uri.toString())) return;

    const errors = vscode.languages.getDiagnostics(editor.document.uri)
      .filter(d => d.severity === vscode.DiagnosticSeverity.Error);

    if (errors.length === 0) return;

    const errorKey = `${editor.document.uri.toString()}-${errors[0].message}`;
    if (errorKey === this._lastErrorUri) return;

    this._lastErrorUri = errorKey;

    if (this._debounceTimer) clearTimeout(this._debounceTimer);

    this._debounceTimer = setTimeout(async () => {
      const error = errors[0];
      const language = editor.document.languageId;
      const lines = editor.document.getText().split('\n');
      const surrounding = lines.slice(
        Math.max(0, error.range.start.line - 3),
        Math.min(lines.length, error.range.start.line + 3)
      ).join('\n');

      const choice = await vscode.window.showInformationMessage(
        `🥋 CodeSensei detected an error: ${error.message.substring(0, 60)}...`,
        'Explain Error'
      );

      if (choice === 'Explain Error') {
        await this._sidebarProvider.explainCode(surrounding, language, error.message, 'english');
      }
    }, 1500);
  }
}
