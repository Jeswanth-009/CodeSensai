import * as vscode from 'vscode';

interface ComplexityIndicator {
  line: number;
  level: 'green' | 'yellow' | 'red';
  label: string;
}

export class ComplexityAnalyzer {
  private _decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

  constructor() {
    this._decorationTypes.set('green', vscode.window.createTextEditorDecorationType({
      after: {
        contentText: ' ● O(1)/O(log n)',
        color: '#a6e3a1',
        fontStyle: 'italic',
        margin: '0 0 0 16px'
      }
    }));
    this._decorationTypes.set('yellow', vscode.window.createTextEditorDecorationType({
      after: {
        contentText: ' ● O(n)/O(n log n)',
        color: '#f9e2af',
        fontStyle: 'italic',
        margin: '0 0 0 16px'
      }
    }));
    this._decorationTypes.set('red', vscode.window.createTextEditorDecorationType({
      after: {
        contentText: ' ● O(n²)+',
        color: '#f38ba8',
        fontStyle: 'italic',
        margin: '0 0 0 16px'
      }
    }));
  }

  applyDecorations(editor: vscode.TextEditor, indicators: ComplexityIndicator[]) {
    // Clear existing
    this._decorationTypes.forEach(dt => editor.setDecorations(dt, []));

    // Group by level
    const groups: Map<string, vscode.DecorationOptions[]> = new Map();
    indicators.forEach(ind => {
      const existing = groups.get(ind.level) || [];
      existing.push({
        range: new vscode.Range(ind.line, 0, ind.line, 0),
        hoverMessage: new vscode.MarkdownString(`**CodeSensei Complexity:** ${ind.label}`)
      });
      groups.set(ind.level, existing);
    });

    groups.forEach((decorations, level) => {
      const dt = this._decorationTypes.get(level);
      if (dt) {
        editor.setDecorations(dt, decorations);
      }
    });
  }

  clearDecorations(editor: vscode.TextEditor) {
    this._decorationTypes.forEach(dt => editor.setDecorations(dt, []));
  }

  dispose() {
    this._decorationTypes.forEach(dt => dt.dispose());
  }
}
