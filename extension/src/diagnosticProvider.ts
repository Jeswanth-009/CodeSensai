import * as vscode from 'vscode';

export class DiagnosticProvider {
  private _diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this._diagnosticCollection = vscode.languages.createDiagnosticCollection('codesensei');
  }

  addHint(uri: vscode.Uri, range: vscode.Range, message: string) {
    const diagnostic = new vscode.Diagnostic(
      range,
      `🥋 CodeSensei: ${message}`,
      vscode.DiagnosticSeverity.Hint
    );
    diagnostic.source = 'CodeSensei';

    const existing = this._diagnosticCollection.get(uri) || [];
    this._diagnosticCollection.set(uri, [...existing, diagnostic]);
  }

  clear(uri?: vscode.Uri) {
    if (uri) {
      this._diagnosticCollection.delete(uri);
    } else {
      this._diagnosticCollection.clear();
    }
  }

  dispose() {
    this._diagnosticCollection.dispose();
  }
}
