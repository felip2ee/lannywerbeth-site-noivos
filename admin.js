/**
 * Lanny & Werbeth Admin Dashboard JavaScript
 */

// Global variables for Chart instances so we can update/destroy them
let visitsChart = null;
let rsvpChart = null;
let activeClearTarget = null;
let cachedRsvps = [];
let cachedVisitors = [];
let activeDetailEntry = null;
let currentRsvpTab = 'rsvp'; // 'rsvp' | 'gift'

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initLogin();
  initLogout();
  initSearch();
  initExport();
  initClearData();
  initDetailModal();
  initTabs();
});

// ==========================================
// 1. Authentication
// ==========================================
function checkAuth() {
  const authWrapper = document.getElementById('admin-auth-wrapper');
  const dashboardWrapper = document.getElementById('admin-dashboard-wrapper');
  
  if (sessionStorage.getItem('lw_admin_auth') === 'true') {
    authWrapper.style.display = 'none';
    dashboardWrapper.style.display = 'block';
    loadDashboard();
  } else {
    authWrapper.style.display = 'flex';
    dashboardWrapper.style.display = 'none';
  }
}

function initLogin() {
  const form = document.getElementById('admin-login-form');
  const passInput = document.getElementById('admin-password');
  const errorMsg = document.getElementById('login-error-msg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = passInput.value.trim();

    // Default password check
    if (password === 'lanny2026') {
      sessionStorage.setItem('lw_admin_auth', 'true');
      errorMsg.style.display = 'none';
      passInput.value = '';
      checkAuth();
    } else {
      errorMsg.style.display = 'block';
      passInput.focus();
    }
  });
}

function initLogout() {
  const logoutBtn = document.getElementById('btn-admin-logout');
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('lw_admin_auth');
    checkAuth();
  });
}

// ==========================================
// 2. Data Loading & KPI Calculations
// ==========================================
async function loadDashboard() {
  const { data: rsvpData,  error: rsvpErr }  = await sbClient.from('rsvp').select('*');
  const { data: visitData, error: visitErr } = await sbClient.from('visitors').select('*');

  if (rsvpErr)  console.error('Supabase rsvp:', rsvpErr.message);
  if (visitErr) console.error('Supabase visitors:', visitErr.message);

  // Mapeia snake_case do banco para camelCase usado pelo restante do painel
  cachedRsvps = (rsvpData || []).map(r => ({
    ...r,
    timestamp: r.submitted_at,
    isGift:    r.is_gift,
    giftName:  r.gift_name,
    giftValue: r.gift_value,
  }));

  cachedVisitors = (visitData || []).map(v => ({
    ...v,
    timestamp:  v.submitted_at,
    userAgent:  v.user_agent,
    screenSize: v.screen_size,
  }));

  calculateKPIs(cachedRsvps, cachedVisitors);
  renderCharts(cachedRsvps, cachedVisitors);
  renderRSVPTable(getTabFilteredRsvps());
  renderVisitorsTable(cachedVisitors);
}

function calculateKPIs(rsvps, visitors) {
  // 1. Total Visitors
  document.getElementById('val-total-visitors').innerText = visitors.length;

  // 2. Total RSVP responses (excluding pure gift records without RSVP)
  const rsvpResponses = rsvps.filter(r => !r.isGift);
  document.getElementById('val-total-rsvps').innerText = rsvpResponses.length;

  // 3. Confirmed Guests (1 for the person + guest count)
  const confirmedCount = rsvps
    .filter(r => !r.isGift && r.attending)
    .reduce((sum, r) => sum + 1 + (r.guests || 0), 0);
  document.getElementById('val-total-guests').innerText = confirmedCount;

  // 4. Total Gifts count & simulated value
  const gifts = rsvps.filter(r => r.isGift);
  const totalGiftsValue = gifts.reduce((sum, r) => sum + (r.giftValue || 0), 0);
  
  const formattedValue = totalGiftsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  document.getElementById('val-total-gifts').innerText = `${gifts.length} (${formattedValue})`;
}

// ==========================================
// 3. Render Tables
// ==========================================
function renderRSVPTable(rsvps, filterText = '') {
  const tbody = document.getElementById('rsvp-table-body');
  tbody.innerHTML = '';

  const filtered = rsvps.filter(r => {
    const text = filterText.toLowerCase();
    const nameMatch = r.name.toLowerCase().includes(text);
    const emailMatch = r.email.toLowerCase().includes(text);
    const phoneMatch = r.phone.toLowerCase().includes(text);
    const messageMatch = (r.message || '').toLowerCase().includes(text);
    const giftMatch = r.isGift && (r.giftName || '').toLowerCase().includes(text);
    return nameMatch || emailMatch || phoneMatch || messageMatch || giftMatch;
  });

  if (filtered.length === 0) {
    const emptyMsg = currentRsvpTab === 'gift'
      ? 'Nenhum presente registrado ainda.'
      : 'Nenhuma confirmação de presença registrada.';
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">${emptyMsg}</td></tr>`;
    renderRSVPCards(filtered);
    return;
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  filtered.forEach(r => {
    const date = new Date(r.timestamp).toLocaleString('pt-BR');
    let statusBadge = '';

    if (r.isGift) {
      statusBadge = `<span class="badge badge-gift" title="${r.giftName}"><i class="fa fa-gift"></i> ${r.giftName}</span>`;
    } else if (r.attending) {
      statusBadge = '<span class="badge badge-success"><i class="fa fa-check"></i> Confirmado</span>';
    } else {
      statusBadge = '<span class="badge badge-danger"><i class="fa fa-times"></i> Não Irá</span>';
    }

    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.title = 'Clique para ver detalhes';
    row.innerHTML = `
      <td>${date}</td>
      <td><strong>${r.name}</strong></td>
      <td>${r.email}</td>
      <td>${r.phone}</td>
      <td>${statusBadge}</td>
      <td>${r.isGift ? '-' : (r.guests > 0 ? `${r.guests} convidado(s)` : 'Apenas ele(a)')}</td>
      <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.message || ''}">
        ${r.message || '<em style="color: var(--text-muted);">Sem mensagem</em>'}
      </td>
    `;
    row.addEventListener('click', () => openDetailModal(r));
    tbody.appendChild(row);
  });

  renderRSVPCards(filtered);
}

function renderVisitorsTable(visitors, filterText = '') {
  const tbody = document.getElementById('visitors-table-body');
  tbody.innerHTML = '';

  const filtered = visitors.filter(v => {
    const text = filterText.toLowerCase();
    const deviceMatch = v.device.toLowerCase().includes(text);
    const browserMatch = v.browser.toLowerCase().includes(text);
    const refMatch = v.referrer.toLowerCase().includes(text);
    return deviceMatch || browserMatch || refMatch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma visita registrada.</td></tr>';
    return;
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  filtered.forEach(v => {
    const date = new Date(v.timestamp).toLocaleString('pt-BR');
    
    // Icon for devices
    let deviceIcon = 'fa-desktop';
    if (v.device === 'Mobile') deviceIcon = 'fa-mobile-screen-button';
    else if (v.device === 'Tablet') deviceIcon = 'fa-tablet-screen-button';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${date}</td>
      <td><i class="fa ${deviceIcon}" style="color: var(--color-primary); margin-right: 8px;"></i> ${v.device}</td>
      <td>${v.browser}</td>
      <td>${v.screenSize}</td>
      <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${v.referrer}">
        ${v.referrer}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ==========================================
// 4. RSVP Mobile Cards
// ==========================================
function renderRSVPCards(rsvps) {
  const container = document.getElementById('rsvp-card-list');
  if (!container) return;
  container.innerHTML = '';

  if (rsvps.length === 0) {
    container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 24px 0;">Nenhum resultado encontrado.</p>';
    return;
  }

  rsvps.forEach(r => {
    const names = r.name.trim().split(' ');
    const initials = (names.length >= 2
      ? names[0][0] + names[names.length - 1][0]
      : names[0].substring(0, 2)
    ).toUpperCase();

    const date = new Date(r.timestamp).toLocaleDateString('pt-BR');

    let badge = '';
    if (r.isGift) {
      badge = `<span class="badge badge-gift"><i class="fa fa-gift"></i> Presente</span>`;
    } else if (r.attending) {
      badge = `<span class="badge badge-success"><i class="fa fa-check"></i> Confirmado</span>`;
    } else {
      badge = `<span class="badge badge-danger"><i class="fa fa-times"></i> Não Irá</span>`;
    }

    const meta = r.isGift
      ? `${r.giftName} • ${date}`
      : `${r.guests > 0 ? `+${r.guests} acomp.` : 'Só ele/ela'} • ${date}`;

    const card = document.createElement('div');
    card.className = 'rsvp-card';
    card.innerHTML = `
      <div class="rsvp-card-avatar">${initials}</div>
      <div class="rsvp-card-info">
        <div class="rsvp-card-name">${r.name}</div>
        <div class="rsvp-card-meta">${meta}</div>
      </div>
      <div class="rsvp-card-right">${badge}</div>
      <i class="fa fa-chevron-right rsvp-card-arrow"></i>
    `;
    card.addEventListener('click', () => openDetailModal(r));
    container.appendChild(card);
  });
}

// ==========================================
// 4b. RSVP Detail Modal
// ==========================================
function openDetailModal(r) {
  activeDetailEntry = r;

  const names = r.name.trim().split(' ');
  const initials = (names.length >= 2
    ? names[0][0] + names[names.length - 1][0]
    : names[0].substring(0, 2)
  ).toUpperCase();

  document.getElementById('detail-avatar').textContent = initials;
  document.getElementById('detail-name').textContent = r.name;

  const badgeEl = document.getElementById('detail-status-badge');
  if (r.isGift) {
    badgeEl.innerHTML = `<span class="badge badge-gift"><i class="fa fa-gift"></i> Presente: ${r.giftName}</span>`;
  } else if (r.attending) {
    badgeEl.innerHTML = `<span class="badge badge-success"><i class="fa fa-check"></i> Confirmado</span>`;
  } else {
    badgeEl.innerHTML = `<span class="badge badge-danger"><i class="fa fa-times"></i> Não Irá</span>`;
  }

  const date = new Date(r.timestamp).toLocaleString('pt-BR');
  const guestsText = r.isGift
    ? `${r.giftName} — R$ ${(r.giftValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : (r.guests > 0 ? `${r.guests} acompanhante(s) além de ${names[0]}` : `Apenas ${names[0]}`);

  const rows = [
    { icon: 'fa-calendar-days', label: 'Data / Hora', value: date },
    { icon: 'fa-envelope',      label: 'E-mail',      value: `<a href="mailto:${r.email}">${r.email}</a>` },
    { icon: 'fa-phone',         label: 'Telefone',    value: `<a href="tel:${r.phone}">${r.phone}</a>` },
    { icon: r.isGift ? 'fa-gift' : 'fa-users',
      label: r.isGift ? 'Presente' : 'Acompanhantes',
      value: guestsText },
  ];

  document.getElementById('detail-info-grid').innerHTML = rows.map(row => `
    <div class="detail-info-row">
      <div class="detail-info-icon"><i class="fa ${row.icon}"></i></div>
      <div class="detail-info-content">
        <div class="detail-info-label">${row.label}</div>
        <div class="detail-info-value">${row.value}</div>
      </div>
    </div>
  `).join('');

  const msgSection = document.getElementById('detail-message-section');
  const msgText    = document.getElementById('detail-message-text');
  if (r.message && r.message.trim()) {
    msgText.textContent = `"${r.message}"`;
    msgSection.style.display = 'block';
  } else {
    msgSection.style.display = 'none';
  }

  document.getElementById('rsvp-detail-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('rsvp-detail-modal').classList.remove('active');
  document.body.style.overflow = '';
  activeDetailEntry = null;
}

function initDetailModal() {
  const modal    = document.getElementById('rsvp-detail-modal');
  const closeBtn = document.getElementById('btn-close-rsvp-detail');

  closeBtn.addEventListener('click', closeDetailModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDetailModal();
  });
}

// ==========================================
// 5. Tab Filtering (Confirmados / Presentes)
// ==========================================
function getTabFilteredRsvps() {
  if (currentRsvpTab === 'gift') return cachedRsvps.filter(r => r.isGift);
  return cachedRsvps.filter(r => !r.isGift);
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRsvpTab = btn.dataset.tab;
      const searchVal = document.getElementById('rsvp-search').value;
      renderRSVPTable(getTabFilteredRsvps(), searchVal);
    });
  });
}

// ==========================================
// 5b. Interactive Search
// ==========================================
function initSearch() {
  const rsvpSearch = document.getElementById('rsvp-search');
  const visitorsSearch = document.getElementById('visitors-search');

  rsvpSearch.addEventListener('input', () => {
    renderRSVPTable(getTabFilteredRsvps(), rsvpSearch.value);
  });

  visitorsSearch.addEventListener('input', () => {
    renderVisitorsTable(cachedVisitors, visitorsSearch.value);
  });
}

// ==========================================
// 6. Chart.js Graphs Rendering
// ==========================================
function renderCharts(rsvps, visitors) {
  // Destroy existing charts to reload clean on updates
  if (visitsChart) visitsChart.destroy();
  if (rsvpChart) rsvpChart.destroy();

  // 1. RSVP Distribution Doughnut Chart
  const ctxRSVP = document.getElementById('chart-rsvp-distribution').getContext('2d');
  
  const attendingCount = rsvps.filter(r => !r.isGift && r.attending).length;
  const notAttendingCount = rsvps.filter(r => !r.isGift && !r.attending).length;
  const giftOnlyCount = rsvps.filter(r => r.isGift).length;

  rsvpChart = new Chart(ctxRSVP, {
    type: 'doughnut',
    data: {
      labels: ['Confirmados', 'Não Irão', 'Apenas Presente'],
      datasets: [{
        data: [attendingCount, notAttendingCount, giftOnlyCount],
        backgroundColor: ['#10b981', '#ef4444', '#f2c574'],
        borderColor: '#1e293b',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: 'Quicksand', size: 12 }
          }
        }
      }
    }
  });

  // 2. Visits Timeline (Daily) Chart
  const ctxVisits = document.getElementById('chart-visits-timeline').getContext('2d');
  
  // Group visits by date (last 7 days by default)
  const visitsByDate = {};
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    last7Days.push(dateStr);
    visitsByDate[dateStr] = 0;
  }

  visitors.forEach(v => {
    const dateStr = new Date(v.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (visitsByDate[dateStr] !== undefined) {
      visitsByDate[dateStr]++;
    }
  });

  const chartData = last7Days.map(day => visitsByDate[day]);

  visitsChart = new Chart(ctxVisits, {
    type: 'line',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Número de Acessos',
        data: chartData,
        backgroundColor: 'rgba(126, 184, 208, 0.2)',
        borderColor: '#7eb8d0',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#f2c574',
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Quicksand' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#94a3b8', 
            font: { family: 'Quicksand' },
            stepSize: 1,
            precision: 0
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ==========================================
// 7. CSV Exporters
// ==========================================
function initExport() {
  const exportRSVPBtn = document.getElementById('btn-export-rsvp');
  const exportVisitorsBtn = document.getElementById('btn-export-visitors');

  exportRSVPBtn.addEventListener('click', () => {
    const rsvps = getTabFilteredRsvps();
    if (rsvps.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }

    let csvContent = '\ufeff'; // BOM for Excel pt-BR character encoding
    csvContent += 'Data/Hora,Nome,Email,Telefone,Status,Tipo,Valor Presente,Acompanhantes,Mensagem\n';

    rsvps.forEach(r => {
      const date = new Date(r.timestamp).toLocaleString('pt-BR');
      const status = r.isGift ? 'Ganhou Presente' : (r.attending ? 'Confirmado' : 'Não Irá');
      const type = r.isGift ? 'Presente' : 'RSVP';
      const giftVal = r.isGift ? r.giftValue : 0;
      const guests = r.isGift ? 0 : r.guests;
      
      // Escape commas & quotes
      const name = `"${r.name.replace(/"/g, '""')}"`;
      const email = `"${r.email.replace(/"/g, '""')}"`;
      const msg = `"${(r.message || '').replace(/"/g, '""')}"`;

      csvContent += `${date},${name},${email},${r.phone},${status},${type},${giftVal},${guests},${msg}\n`;
    });

    downloadCSV(csvContent, 'confirmados_presentes_lanny_werbeth.csv');
  });

  exportVisitorsBtn.addEventListener('click', () => {
    const visitors = cachedVisitors;
    if (visitors.length === 0) {
      alert('Nenhum registro de visitas para exportar.');
      return;
    }

    let csvContent = '\ufeff'; // BOM for Excel
    csvContent += 'Data/Hora,Dispositivo,Navegador,Resolucao,Referrer\n';

    visitors.forEach(v => {
      const date = new Date(v.timestamp).toLocaleString('pt-BR');
      const device = v.device;
      const browser = v.browser;
      const screen = v.screenSize;
      const ref = `"${v.referrer.replace(/"/g, '""')}"`;

      csvContent += `${date},${device},${browser},${screen},${ref}\n`;
    });

    downloadCSV(csvContent, 'logs_visitas_lanny_werbeth.csv');
  });
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 8. Clear Data / Local DB Reset
// ==========================================
function initClearData() {
  const clearRSVPBtn = document.getElementById('btn-clear-rsvps');
  const clearVisitorsBtn = document.getElementById('btn-clear-visitors');
  
  const modal = document.getElementById('clear-confirm-modal');
  const closeBtn = document.getElementById('btn-close-confirm-modal');
  const cancelBtn = document.getElementById('btn-cancel-clear');
  const confirmBtn = document.getElementById('btn-confirm-clear');
  const modalDesc = document.getElementById('confirm-modal-desc');

  const openModal = (target, desc) => {
    activeClearTarget = target;
    modalDesc.innerText = desc;
    modal.classList.add('active');
  };

  const closeModal = () => {
    modal.classList.remove('active');
    activeClearTarget = null;
  };

  clearRSVPBtn.addEventListener('click', () => {
    openModal('rsvp', 'Você tem certeza absoluta que deseja EXCLUIR todas as confirmações de presença (RSVP) e presentes simulados?');
  });

  clearVisitorsBtn.addEventListener('click', () => {
    openModal('visitors', 'Você tem certeza absoluta que deseja EXCLUIR todo o log e histórico de visitas do painel?');
  });

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  confirmBtn.addEventListener('click', async () => {
    if (activeClearTarget === 'rsvp') {
      await sbClient.from('rsvp').delete().not('id', 'is', null);
      localStorage.removeItem('lw_rsvp');
    } else if (activeClearTarget === 'visitors') {
      await sbClient.from('visitors').delete().not('id', 'is', null);
      localStorage.removeItem('lw_visitors');
    }
    closeModal();
    loadDashboard();
  });
}
