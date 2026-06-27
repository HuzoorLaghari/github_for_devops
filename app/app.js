const API_BASE = '/api';

async function recordVisit() {
  try {
    await fetch(`${API_BASE}/visits`, { method: 'POST' });
  } catch {
    // silently fail — visit tracking is non-critical
  }
}

async function fetchVisitCount() {
  try {
    const res = await fetch(`${API_BASE}/visits`);
    const data = await res.json();
    document.getElementById('visit-count').textContent = data.count.toLocaleString();
  } catch {
    document.getElementById('visit-count').textContent = 'N/A';
  }
}

async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    document.getElementById('backend-status').textContent = 'Healthy';
    document.getElementById('backend-status').className = 'status-ok';
    document.getElementById('db-status').textContent = 'Connected';
    document.getElementById('db-status').className = 'status-ok';
    document.getElementById('server-time').textContent = new Date(data.timestamp).toLocaleString();
  } catch {
    document.getElementById('backend-status').textContent = 'Unreachable';
    document.getElementById('backend-status').className = 'status-err';
    document.getElementById('db-status').textContent = 'Unknown';
    document.getElementById('db-status').className = 'status-err';
  }
}

async function fetchMessages() {
  try {
    const res = await fetch(`${API_BASE}/messages`);
    const data = await res.json();
    const list = document.getElementById('messages-list');
    const empty = document.getElementById('empty-state');
    list.innerHTML = '';
    if (data.messages.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    data.messages.forEach(msg => {
      const el = document.createElement('div');
      el.className = 'message';
      el.innerHTML = `
        <div class="msg-header">
          <strong>${escapeHtml(msg.name)}</strong>
          <span class="msg-time">${new Date(msg.created_at).toLocaleString()}</span>
        </div>
        <p>${escapeHtml(msg.message)}</p>
      `;
      list.appendChild(el);
    });
  } catch {
    document.getElementById('messages-container').innerHTML +=
      '<p class="error-msg">Failed to load messages.</p>';
  }
}

document.getElementById('message-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name-input').value.trim();
  const message = document.getElementById('message-input').value.trim();
  if (!name || !message) return;

  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message }),
    });
    if (res.ok) {
      document.getElementById('name-input').value = '';
      document.getElementById('message-input').value = '';
      await fetchMessages();
      await fetchVisitCount();
    }
  } catch {
    alert('Failed to submit message. Try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit';
  }
});

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

recordVisit();
fetchVisitCount();
fetchHealth();
fetchMessages();
