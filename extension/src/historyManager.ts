import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface HistoryEntry {
  timestamp: string;
  code: string;
  language: string;
  explanation: any;
  mode: string;
}

export class HistoryManager {
  private _historyPath: string;
  private _maxEntries: number;

  constructor(maxEntries: number = 100) {
    this._maxEntries = maxEntries;
    this._historyPath = path.join(os.homedir(), '.codesensei', 'history.json');
    this._ensureDir();
  }

  private _ensureDir() {
    const dir = path.dirname(this._historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  save(entry: HistoryEntry): void {
    try {
      const history = this.getAll();
      history.unshift(entry);
      const trimmed = history.slice(0, this._maxEntries);
      fs.writeFileSync(this._historyPath, JSON.stringify(trimmed, null, 2));
    } catch (err) {
      console.error('HistoryManager: Failed to save entry', err);
    }
  }

  getAll(): HistoryEntry[] {
    try {
      if (fs.existsSync(this._historyPath)) {
        return JSON.parse(fs.readFileSync(this._historyPath, 'utf8'));
      }
    } catch (err) {
      console.error('HistoryManager: Failed to read history', err);
    }
    return [];
  }

  clear(): void {
    try {
      fs.writeFileSync(this._historyPath, JSON.stringify([], null, 2));
    } catch (err) {
      console.error('HistoryManager: Failed to clear history', err);
    }
  }

  search(query: string): HistoryEntry[] {
    const all = this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(entry =>
      entry.code.toLowerCase().includes(lowerQuery) ||
      entry.language.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(entry.explanation).toLowerCase().includes(lowerQuery)
    );
  }
}
