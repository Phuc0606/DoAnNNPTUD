const API = 'http://localhost:3000/api/v1';

function getToken() { return localStorage.getItem('token'); }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': getToken() };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/index.html'; }
  return res;
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
