import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';
import { CodeLensProvider } from './codeLensProvider';
import { AutoExplainProvider } from './autoExplainProvider';
import { ExportManager } from './exportManager';
import * as crypto from 'crypto';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeSensei is now active! 🥋');

  // Generate or retrieve userId
  let userId = context.globalState.get<string>('codesensei.userId');
  if (!userId) {
    userId = crypto.randomUUID();
    context.globalState.update('codesensei.userId', userId);
  }

  // Get API URL from settings
  const config = vscode.workspace.getConfiguration('codesensei');
  let apiUrl = config.get<string>('apiUrl') || '';

  if (!apiUrl) {
    vscode.window.showWarningMessage(
      'CodeSensei: Please set your AWS API URL in settings (codesensei.apiUrl)',
      'Open Settings'
    ).then(selection => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codesensei.apiUrl');
      }
    });
  }

  // Initialize providers
  const sidebarProvider = new SidebarProvider(context, userId);
  const autoExplainProvider = new AutoExplainProvider(sidebarProvider);
  const exportManager = new ExportManager();

  // Register sidebar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codesensei.sidebar', sidebarProvider)
  );

  // Register CodeLens for all supported languages
  const supportedLanguages = [
    'javascript', 'typescript', 'python', 'java',
    'go', 'rust', 'ruby', 'php', 'c', 'cpp'
  ];

  supportedLanguages.forEach(lang => {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        { language: lang },
        new CodeLensProvider()
      )
    );
  });

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('codesensei.explainCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }
      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText.trim()) {
        vscode.window.showErrorMessage('Please select some code first');
        return;
      }
      const language = editor.document.languageId;
      await sidebarProvider.explainCode(selectedText, language, null, 'english');
    }),

    vscode.commands.registerCommand('codesensei.explainHinglish', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText.trim()) {
        vscode.window.showErrorMessage('Please select some code first');
        return;
      }
      const language = editor.document.languageId;
      await sidebarProvider.explainCode(selectedText, language, null, 'hinglish');
    }),

    vscode.commands.registerCommand('codesensei.analyzeComplexity', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText.trim()) {
        vscode.window.showErrorMessage('Please select some code first');
        return;
      }
      const language = editor.document.languageId;
      await sidebarProvider.analyzeComplexity(selectedText, language);
    }),

    vscode.commands.registerCommand('codesensei.explainError', async (errorMessage: string, code: string, language: string) => {
      await sidebarProvider.explainCode(code || '', language || 'unknown', errorMessage, 'english');
    }),

    vscode.commands.registerCommand('codesensei.explainFunctionLogic', async (code: string, language: string, mode: string) => {
      await sidebarProvider.explainCode(code, language, null, mode as 'english' | 'hinglish');
    }),

    vscode.commands.registerCommand('codesensei.exportNotes', async () => {
      const explanation = sidebarProvider.getCurrentExplanation();
      if (!explanation) {
        vscode.window.showErrorMessage('No explanation to export. Explain some code first!');
        return;
      }
      await exportManager.exportToMarkdown(explanation);
    }),

    vscode.commands.registerCommand('codesensei.toggleAutoExplain', () => {
      autoExplainProvider.toggle();
    })
  );

  // Listen for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('codesensei.apiUrl')) {
        const newUrl = vscode.workspace.getConfiguration('codesensei').get<string>('apiUrl') || '';
        sidebarProvider.updateApiUrl(newUrl);
      }
    })
  );
}

export function deactivate() {}
