async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    let body;
    try {
      body = contentType.includes('application/json') ? await res.json() : await res.text();
    } catch (e) { body = await res.text(); }
    const err = new Error('API error');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadLinks() {
  const tbody = document.getElementById('linksBody');
  tbody.innerHTML = '<tr><td class="p-2" colspan="5">Loading...</td></tr>';
  try {
    const links = await api('/api/links');
    if (!links.length) {
      tbody.innerHTML = '<tr><td class="p-2" colspan="5">No links yet</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    links.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2"><a href="${l.short}" target="_blank">${l.code}</a></td>
        <td class="p-2" title="${l.target}">${truncate(l.target, 60)}</td>
        <td class="p-2">${l.clicks}</td>
        <td class="p-2">${l.last_clicked ? new Date(l.last_clicked).toLocaleString() : 'Never'}</td>
        <td class="p-2">
          <button data-code="${l.code}" class="deleteBtn bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
          <a class="ml-2 text-indigo-600 text-sm" href="/code/${l.code}">Stats</a>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        const code = btn.dataset.code;
        if (!confirm(`Delete ${code}?`)) return;
        try {
          await api(`/api/links/${encodeURIComponent(code)}`, { method: 'DELETE' });
          loadLinks();
        } catch (e) {
          alert('Delete failed: ' + JSON.stringify(e.body || e.message));
        }
      });
    });

  } catch (e) {
    tbody.innerHTML = '<tr><td class="p-2 text-red-600" colspan="5">Failed to load</td></tr>';
    console.error(e);
  }
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n-1) + '…' : s;
}

document.getElementById('createForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const target = document.getElementById('target').value.trim();
  const code = document.getElementById('codeInput').value.trim() || undefined;
  const btn = document.getElementById('createBtn');
  const msg = document.getElementById('msg');
  btn.disabled = true;
  msg.textContent = '';

  try {
    const payload = { target };
    if (code) payload.code = code;
    const created = await api('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    msg.textContent = 'Created: ' + created.short;
    document.getElementById('target').value = '';
    document.getElementById('codeInput').value = '';
    loadLinks();
  } catch (e) {
    if (e.status === 409) msg.textContent = 'Code already exists';
    else if (e.body && e.body.error) msg.textContent = e.body.error;
    else msg.textContent = 'Create failed';
    console.error(e);
  } finally {
    btn.disabled = false;
  }
});

loadLinks();
