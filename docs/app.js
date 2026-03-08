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
  const hinglishBadge = mode === 'hinglish' ? '<div class="notice-badge">Hinglish Mode Active</div>' : '';

  const html = `
    <div class="result-stack">
      ${hinglishBadge}
      ${data.errorExplanation ? renderCard('Error Explained', '#e57a6f', data.errorExplanation) : ''}
      ${renderCard('Level 1: What is happening?', '#3e8f86', data.level1)}
      ${renderCard('Level 2: Why this design?', '#5f9be6', data.level2)}
      ${renderCard('Common Pitfalls', '#d8a33f', data.pitfalls)}
      ${renderCard('Socratic Question', '#9b78d6', data.socraticQuestion)}
      <div class="followup-box">
        <div class="followup-label">Answer the question or ask a follow-up.</div>
        <div class="followup-row">
          <input class="followup-input" id="followupInput" placeholder="Type your answer...">
          <button class="btn btn-primary btn-send" id="btnFollowup">➤</button>
        </div>
      </div>
      <div id="chatArea" class="chat-area"></div>
    </div>
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
  const colors = { green: '#67c0b5', yellow: '#f4b860', red: '#f47f74' };
  const color = colors[data.badge] || '#5e738a';
  const html = `
    <div class="complexity-card">
      <div class="complexity-top">
        <h3 style="color:${color}">Complexity Analysis</h3>
        <div class="complexity-badges">
          <span class="complexity-pill" style="background:${color};color:#081018">Time: ${data.timeComplexity}</span>
          <span class="complexity-pill" style="background:#edf2f8;color:#2d4358">Space: ${data.spaceComplexity}</span>
        </div>
      </div>
      <div class="complexity-body">${data.explanation}</div>
      ${data.optimization ? `<div class="optimization-note">Optimization: ${data.optimization}</div>` : ''}
    </div>
  `;
  document.getElementById('resultState').innerHTML = html;
  showState('result');
}

function renderCard(title, color, content) {
  return `
    <div class="card" style="--accent:${color}">
      <div class="card-header">${title}</div>
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

  chatArea.innerHTML += `<div class="chat-bubble user"><strong>You</strong>${escapeHtml(answer)}</div>`;
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
    const accent = data.isCorrect ? '#67c0b5' : '#f4b860';
    chatArea.innerHTML += `<div class="chat-bubble bot" style="border-left-color:${accent}"><strong>CodeSensei ${data.isCorrect ? 'Correct' : 'Guidance'}</strong>${escapeHtml(data.feedback)}<em>${escapeHtml(data.deeperInsight)}</em></div>`;
  } catch (err) {
    chatArea.innerHTML += `<div class="error">Error: ${escapeHtml(err.message)}</div>`;
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
  document.getElementById('errorState').innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
  showState('error');
}

function showState(state) {
  const ids = ['emptyState', 'loadingState', 'errorState', 'resultState'];
  ids.forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  const config = {
    empty: { id: 'emptyState', display: 'grid' },
    loading: { id: 'loadingState', display: 'grid' },
    error: { id: 'errorState', display: 'block' },
    result: { id: 'resultState', display: 'block' }
  };

  if (config[state]) {
    document.getElementById(config[state].id).style.display = config[state].display;
  }
}
