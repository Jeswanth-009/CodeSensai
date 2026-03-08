import * as vscode from 'vscode';

export class CodeLensProvider implements vscode.CodeLensProvider {
  private _functionPatterns: { [key: string]: RegExp } = {
    javascript: /^(?:export\s+)?(?:async\s+)?function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(/m,
    typescript: /^(?:export\s+)?(?:async\s+)?function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(/m,
    python: /^(?:async\s+)?def\s+\w+/m,
    java: /(?:public|private|protected|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\(/m,
    go: /^func\s+\w+/m,
    rust: /^(?:pub\s+)?(?:async\s+)?fn\s+\w+/m,
    ruby: /^def\s+\w+/m,
    php: /(?:public|private|protected|static|\s)+function\s+\w+/m,
    c: /^[\w\*]+\s+\w+\s*\([^)]*\)\s*\{/m,
    cpp: /^[\w\*\:]+\s+\w+\s*\([^)]*\)\s*\{/m
  };

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const language = document.languageId;
    const pattern = this._functionPatterns[language];

    if (!pattern) return lenses;

    const text = document.getText();
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      if (pattern.test(line)) {
        const range = new vscode.Range(lineIndex, 0, lineIndex, line.length);

        // Get function body (up to 50 lines)
        const functionCode = lines.slice(lineIndex, Math.min(lineIndex + 50, lines.length)).join('\n');

        lenses.push(
          new vscode.CodeLens(range, {
            title: '🥋 Explain Logic',
            command: 'codesensei.explainFunctionLogic',
            arguments: [functionCode, language, 'english']
          }),
          new vscode.CodeLens(range, {
            title: 'Explain in Hinglish',
            command: 'codesensei.explainFunctionLogic',
            arguments: [functionCode, language, 'hinglish']
          })
        );
      }
    });

    // Add CodeLens above diagnostic errors
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    diagnostics
      .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
      .forEach(diagnostic => {
        const range = new vscode.Range(
          diagnostic.range.start.line, 0,
          diagnostic.range.start.line, 0
        );
        const surrounding = lines.slice(
          Math.max(0, diagnostic.range.start.line - 3),
          Math.min(lines.length, diagnostic.range.start.line + 3)
        ).join('\n');

        lenses.push(
          new vscode.CodeLens(range, {
            title: '🥋 Explain Error',
            command: 'codesensei.explainError',
            arguments: [diagnostic.message, surrounding, language]
          })
        );
      });

    return lenses;
  }
}
