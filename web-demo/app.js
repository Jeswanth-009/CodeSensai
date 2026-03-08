let currentExplanation = null;
let currentCode = '';

// Wire up buttons
document.getElementById('btnExplain').addEventListener('click', () => explainCode('english'));
document.getElementById('btnHinglish').addEventListener('click', () => explainCode('hinglish'));
document.getElementById('btnComplexity').addEventListener('click', () => analyzeComplexity());

function getApiUrl() {
  return document.getElementById('apiUrl').value.trim().replace(/\/$/, '');
}

async function explainCode(mode) {
  const code = document.getElementById('codeInput').value.trim();
  const errorMessage = document.getElementById('errorInput').value.trim();
  const language = document.getElementById('language').value;
  const apiUrl = getApiUrl();

  if (!code) { alert('Please paste some code first!'); return; }
  if (!apiUrl) { alert('Please enter your AWS API URL!'); return; }

  setLoading(true);
  currentCode = code;

  try {
    const response = await fetch(`${apiUrl}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, errorMessage: errorMessage || null, mode, userId: 'web-demo', conversationHistory: [] })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    currentExplanation = data;
    renderExplanation(data, mode);
  } catch (err) {
    setError(err.message);
  }
}

async function analyzeComplexity() {
  const code = document.getElementById('codeInput').value.trim();
  const language = document.getElementById('language').value;
  const apiUrl = getApiUrl();

  if (!code) { alert('Please paste some code first!'); return; }
  if (!apiUrl) { alert('Please enter your AWS API URL!'); return; }

  setLoading(true);

  try {
    const response = await fetch(`${apiUrl}/complexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, mode: 'english' })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    renderComplexity(data);
  } catch (err) {
    setError(err.message);
  }
}

function renderExplanation(data, mode) {
  const hinglishBadge = mode === 'hinglish' ? '<div style="background:#2d1b4e;border:1px solid #cba6f7;border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:11px;color:#cba6f7">🇮🇳 Hinglish Mode Active</div>' : '';

  const html = `
    ${hinglishBadge}
    ${data.errorExplanation ? renderCard('⚠️', 'Error Explained', '#f38ba8', data.errorExplanation) : ''}
    ${renderCard('🟢', 'Level 1: What is happening?', '#a6e3a1', data.level1)}
    ${renderCard('🔵', 'Level 2: Why this design?', '#89b4fa', data.level2)}
    ${renderCard('🟠', 'Common Pitfalls', '#fab387', data.pitfalls)}
    ${renderCard('🔮', 'Socratic Question', '#cba6f7', data.socraticQuestion)}
    <div style="margin-top:12px">
      <div style="font-size:12px;font-weight:600;color:#6c7086;margin-bottom:6px">💬 Answer the question or ask follow-up:</div>
      <div style="display:flex;gap:6px">
        <input id="followupInput" placeholder="Type your answer..." style="flex:1;background:#1e1e2e;border:1px solid #3a3a5e;border-radius:6px;padding:8px;color:#cdd6f4;font-size:12px;outline:none">
        <button class="btn btn-primary" id="btnFollowup" style="padding:8px 12px">➤</button>
      </div>
    </div>
    <div id="chatArea" style="margin-top:10px"></div>
  `;

  document.getElementById('resultState').innerHTML = html;
  showState('result');

  // Wire up followup button and enter key
  document.getElementById('btnFollowup').addEventListener('click', sendFollowup);
  document.getElementById('followupInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendFollowup();
  });
}

function renderComplexity(data) {
  const colors = { green: '#a6e3a1', yellow: '#f9e2af', red: '#f38ba8' };
  const color = colors[data.badge] || '#cdd6f4';
  const html = `
    <div style="background:#1e1e2e;border-radius:8px;padding:12px;border:1px solid ${color}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:700;color:${color}">⚡ Complexity Analysis</span>
        <div style="display:flex;gap:6px">
          <span style="background:${color};color:#1e1e2e;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700">Time: ${data.timeComplexity}</span>
          <span style="background:#3a3a5e;color:#cdd6f4;border-radius:4px;padding:2px 8px;font-size:11px">Space: ${data.spaceComplexity}</span>
        </div>
      </div>
      <div style="font-size:12px;line-height:1.6">${data.explanation}</div>
      ${data.optimization ? `<div style="margin-top:8px;padding:8px;background:#2a2a3e;border-radius:6px;font-size:12px;color:#a6e3a1">💡 ${data.optimization}</div>` : ''}
    </div>
  `;
  document.getElementById('resultState').innerHTML = html;
  showState('result');
}

function renderCard(icon, title, color, content) {
  return `
    <div class="card" style="border-color:${color};margin-bottom:8px">
      <div class="card-header" style="color:${color}">${icon} ${title}</div>
      <div class="card-body">${content}</div>
    </div>
  `;
}

async function sendFollowup() {
  const input = document.getElementById('followupInput');
  const answer = input.value.trim();
  if (!answer || !currentExplanation) return;

  const apiUrl = getApiUrl();
  const chatArea = document.getElementById('chatArea');

  chatArea.innerHTML += `<div style="background:#2a2a3e;border-left:3px solid #89b4fa;border-radius:6px;padding:8px;margin-bottom:6px;font-size:12px"><span style="color:#6c7086;font-size:10px">👨‍💻 You</span><br>${escapeHtml(answer)}</div>`;
  input.value = '';

  try {
    const response = await fetch(`${apiUrl}/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: currentCode,
        userAnswer: answer,
        socraticQuestion: currentExplanation.socraticQuestion,
        mode: 'english',
        conversationHistory: []
      })
    });
    const data = await response.json();
    const color = data.isCorrect ? '#a6e3a1' : '#fab387';
    chatArea.innerHTML += `<div style="background:#1a2a1a;border-left:3px solid ${color};border-radius:6px;padding:8px;margin-bottom:6px;font-size:12px"><span style="color:#6c7086;font-size:10px">🥋 CodeSensei ${data.isCorrect ? '✅' : '🔄'}</span><br>${escapeHtml(data.feedback)}<br><br><em style="color:#6c7086">${escapeHtml(data.deeperInsight)}</em></div>`;
  } catch (err) {
    chatArea.innerHTML += `<div style="color:#f38ba8;font-size:12px">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setLoading(show) {
  showState(show ? 'loading' : 'empty');
}

function setError(message) {
  document.getElementById('errorState').innerHTML = `<div class="error">⚠️ ${escapeHtml(message)}</div>`;
  showState('error');
}

function showState(state) {
  ['emptyState', 'loadingState', 'errorState', 'resultState'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  const map = { empty: 'emptyState', loading: 'loadingState', error: 'errorState', result: 'resultState' };
  if (map[state]) document.getElementById(map[state]).style.display = 'block';
}
