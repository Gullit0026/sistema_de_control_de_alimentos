// ── Configuración ──────────────────────────────────────────────
const API = 'http://localhost:3000';
const POLL_MS = 1000; // refresca cada 8 segundos

let selectedDevice = null;

// ── Utilidades ─────────────────────────────────────────────────
function fmt(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function toast(msg, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `toast-msg ${tipo}`;
  el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function setStatus(ok) {
  const dot   = document.getElementById('conn-dot');
  const label = document.getElementById('conn-label');
  dot.className   = 'status-dot ' + (ok ? 'ok' : 'err');
  label.textContent = ok ? 'EN LÍNEA' : 'SIN CONEXIÓN';
}

function setBadge(el, estado) {
  const map = {
    adecuada: ['badge-ok', 'Adecuada'],
    baja:     ['badge-warn', 'Baja'],
    alta:     ['badge-danger', 'Alta'],
    poca:     ['badge-warn', 'Poca'],
  };
  const [cls, txt] = map[estado] || ['badge-warn', estado || '--'];
  el.className = `badge ${cls}`;
  el.textContent = txt;
}

// ── Gauge arc ──────────────────────────────────────────────────
function setGauge(arcId, valId, value, min, max, color) {
  const total = 188.5;
  const pct   = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const offset = total - pct * total;
  const arc   = document.getElementById(arcId);
  const valEl = document.getElementById(valId);
  arc.style.strokeDashoffset = offset;
  arc.setAttribute('stroke', color);
  valEl.textContent = value != null ? value : '--';
}

// ── Tabs ───────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'analisis') cargarAnalisis();
  });
});

// ── Chart.js defaults ──────────────────────────────────────────
Chart.defaults.color          = '#6b7a99';
Chart.defaults.borderColor    = '#1e2535';
Chart.defaults.font.family    = "'Share Tech Mono'";
Chart.defaults.font.size      = 11;

function makeLineChart(id, label, color) {
  return new Chart(document.getElementById(id).getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor: color,
        backgroundColor: color + '18',
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: color,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#1e2535' }, ticks: { maxTicksLimit: 8 } },
        y: { grid: { color: '#1e2535' }, beginAtZero: false }
      }
    }
  });
}

const chartTemp = makeLineChart('chartTemp', 'Temperatura °C', '#e74c3c');
const chartHum  = makeLineChart('chartHum',  'Humedad %',       '#3498db');

// ── Cargar datos (monitoreo) ───────────────────────────────────
// ── Cargar datos ───────────────────────────────────────────────
async function cargarDatos(device = selectedDevice) {
  try {
    const url = device 
      ? `${API}/api/datos?limite=20&device=${device}` 
      : `${API}/api/datos?limite=20`;

    const res  = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    const datos = json.datos || [];

    setStatus(true);
    document.getElementById('last-update').textContent =
      'Última actualización: ' + new Date().toLocaleTimeString('es-CO');

    if (!datos.length) return;

    // Más reciente primero → invertir para las gráficas (cronológico)
    const cronologico = [...datos].reverse();

    // Gráficas de línea
    const labels = cronologico.map(d => fmt(d.fecha));
    chartTemp.data.labels   = labels;
    chartTemp.data.datasets[0].data = cronologico.map(d => d.temperatura);
    chartTemp.update('none');

    chartHum.data.labels  = labels;
    chartHum.data.datasets[0].data = cronologico.map(d => d.humedad);
    chartHum.update('none');

    // Último dato para los indicadores
    const ultimo = datos[0];

    // Gauges
    const tempColor = ultimo.temperatura < 18 ? '#3498db' : ultimo.temperatura <= 30 ? '#2ecc71' : '#e74c3c';
    setGauge('gauge-temp-arc', 'gauge-temp-val', ultimo.temperatura, 0, 50, tempColor);

    const humColor = ultimo.humedad < 30 ? '#e74c3c' : ultimo.humedad <= 70 ? '#2ecc71' : '#e74c3c';
    setGauge('gauge-hum-arc', 'gauge-hum-val', ultimo.humedad, 0, 100, humColor);

    // Big values
    document.getElementById('val-temp').innerHTML =
      `<span>${ultimo.temperatura}</span><span class="unit">°C</span>`;
    document.getElementById('val-hum').innerHTML =
      `<span>${ultimo.humedad}</span><span class="unit">%</span>`;

    // Badges de estado
    setBadge(document.getElementById('badge-temp'), ultimo.estado_temp);
    setBadge(document.getElementById('badge-hum'),  ultimo.estado_hum);

    // Luz
    const esAdecuada = ultimo.estado_luz === 'adecuada';
    document.getElementById('luz-icon').className  = `luz-icon ${esAdecuada ? 'adecuada' : 'poca'}`;
    document.getElementById('luz-label').textContent = esAdecuada ? 'Adecuada' : 'Poca luz';

    // Alertas strip
    const strip = document.getElementById('alertas-strip');
    if (ultimo.alertas && ultimo.alertas.length > 0) {
      strip.innerHTML = ultimo.alertas.map(a =>
        `<div class="alert-strip warn" style="margin-bottom:6px;">
          <div class="alert-dot"></div><span>${a}</span>
        </div>`
      ).join('');
    } else {
      strip.innerHTML = `<div class="alert-strip ok">
        <div class="alert-dot"></div><span>Sin alertas</span>
      </div>`;
    }

    // Tabla de datos
    const tbody = document.getElementById('tabla-body');
    tbody.innerHTML = datos.map(d => `
      <tr>
        <td>${fmt(d.fecha)}</td>
        <td style="color:var(--accent2)">${d.device || '—'}</td>
        <td>${d.temperatura ?? '—'}</td>
        <td>${d.humedad ?? '—'}</td>
        <td>${d.estado_luz === 'adecuada' ? '💡 Adecuada' : '🌑 Poca'}</td>
        <td>${d.alertas && d.alertas.length ? d.alertas.join(', ') : '<span style="color:var(--text-dim)">Sin alertas</span>'}</td>
      </tr>
    `).join('');

  } catch (e) {
    setStatus(false);
    console.error('Error al cargar datos:', e);
  }
}

// ── Cargar análisis ────────────────────────────────────────────
let chartAlertas = null;
let chartEstados = null;

async function cargarAnalisis(device = selectedDevice) {
  try {
    const urlAnalisis = device 
      ? `${API}/api/analisis?device=${device}` 
      : `${API}/api/analisis`;

    const urlAlertas = device 
      ? `${API}/api/datos/alertas?device=${device}` 
      : `${API}/api/datos/alertas`;

    const [resAnalisis, resAlertasTab] = await Promise.all([
      fetch(urlAnalisis),
      fetch(urlAlertas),
    ]);

    const jsonA = await resAnalisis.json();
    const jsonAl = await resAlertasTab.json();
    const a = jsonA.analisis || {};

    // Stats generales
    document.getElementById('avg-temp').innerHTML =
      `${a.promedios?.temperatura ?? '--'}<span class="unit"> °C</span>`;
    document.getElementById('avg-hum').innerHTML =
      `${a.promedios?.humedad ?? '--'}<span class="unit"> %</span>`;
    document.getElementById('total-reg').textContent =
      a.promedios?.totalRegistros ?? '--';
    document.getElementById('total-devices').textContent =
      (a.porDispositivo || []).length;

    // Gráfica de frecuencia de alertas (bar)
    const freqLabels = (a.frecuenciaAlertas || []).map(f => f.alerta);
    const freqData   = (a.frecuenciaAlertas || []).map(f => f.cantidad);
    const maxFreq    = Math.max(...freqData, 1);

    if (chartAlertas) chartAlertas.destroy();
    chartAlertas = new Chart(
      document.getElementById('chartAlertas').getContext('2d'), {
      type: 'bar',
      data: {
        labels: freqLabels,
        datasets: [{
          data: freqData,
          backgroundColor: '#ff4d6d40',
          borderColor: '#ff4d6d',
          borderWidth: 1.5,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#1e2535' } },
          y: { grid: { color: '#1e2535' }, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Barras de frecuencia inline
    document.getElementById('freq-list').innerHTML =
      (a.frecuenciaAlertas || []).map(f => `
        <div class="freq-row">
          <div class="freq-row-top">
            <span>${f.alerta}</span>
            <span>${f.cantidad}</span>
          </div>
          <div class="freq-track">
            <div class="freq-fill" style="width:${(f.cantidad / maxFreq * 100).toFixed(1)}%"></div>
          </div>
        </div>
      `).join('') || '<p style="color:var(--text-dim);font-size:12px;">Sin alertas registradas</p>';

    // Por dispositivo
    document.getElementById('device-list').innerHTML =
      (a.porDispositivo || []).map(d => `
        <div class="device-row">
          <span class="device-name">${d.device}</span>
          <span style="font-size:12px; color:var(--text-muted)">${d.totalRegistros} reg · ${d.avgTemp}°C · ${d.avgHum}%</span>
        </div>
      `).join('') || '<p style="color:var(--text-dim);font-size:12px;">Sin dispositivos</p>';

    // Gráfica estados temp
    const estadoLabels = (a.estadosTemp || []).map(e => e.estado);
    const estadoData   = (a.estadosTemp || []).map(e => e.cantidad);
    const estadoColors = estadoLabels.map(e =>
      e === 'adecuada' ? '#2ecc71' : e === 'baja' ? '#3498db' : '#e74c3c'
    );

    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(
      document.getElementById('chartEstados').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: estadoLabels,
        datasets: [{
          data: estadoData,
          backgroundColor: estadoColors.map(c => c + '60'),
          borderColor: estadoColors,
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { padding: 12, boxWidth: 12, font: { size: 11 } }
          }
        }
      }
    });

    // Tabla alertas
    const alertas = jsonAl.alertas || [];
    document.getElementById('alertas-body').innerHTML =
      alertas.length
        ? alertas.map(d => `
          <tr>
            <td>${fmt(d.fecha)}</td>
            <td style="color:var(--accent2)">${d.device || '—'}</td>
            <td>${d.temperatura ?? '—'}</td>
            <td>${d.humedad ?? '—'}</td>
            <td style="color:var(--accent3)">${(d.alertas || []).join(', ')}</td>
          </tr>
        `).join('')
        : `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:20px;">Sin alertas registradas</td></tr>`;

  } catch (e) {
    console.error('Error al cargar análisis:', e);
    toast('Error al cargar análisis', 'err');
  }
}

// ── Control — Slider PWM ───────────────────────────────────────
const slider = document.getElementById('slider-luz');
slider.addEventListener('input', () => {
  const v = parseInt(slider.value);
  document.getElementById('pwm-display').textContent = v;
  document.getElementById('pwm-pct').textContent = Math.round(v / 255 * 100) + '% de brillo';
  document.getElementById('pwm-bar').style.width = (v / 255 * 100) + '%';
});

document.getElementById('btn-enviar-pwm').addEventListener('click', async () => {
  const v = parseInt(slider.value);
  if (!selectedDevice) {
    toast('Selecciona un dispositivo antes de enviar PWM', 'err');
    return;
  }
  try {
    const res = await fetch(`${API}/api/datos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperatura: 25,
        humedad: 50,
        luz1: v > 0 ? 1 : 0,
        device: selectedDevice
      })
    });
    const json = await res.json();
    if (json.ok) toast(`PWM ${v} enviado a ${selectedDevice}`, 'ok');
    else toast(json.error || 'Error al enviar', 'err');
  } catch (e) {
    toast('No se pudo conectar con la API', 'err');
  }
});

// ── Control — Limpiar BD ───────────────────────────────────────
document.getElementById('btn-limpiar').addEventListener('click', async () => {
  if (!confirm('¿Eliminar todos los registros con datos inválidos?')) return;
  try {
    const res  = await fetch(`${API}/api/datos/limpiar`, { method: 'DELETE' });
    const json = await res.json();
    if (json.ok) {
      document.getElementById('limpiar-result').textContent =
        `✓ ${json.eliminados} documento(s) eliminados`;
      toast(`Limpieza OK — ${json.eliminados} eliminados`, 'ok');
    } else {
      toast('Error en la limpieza', 'err');
    }
  } catch (e) {
    toast('No se pudo conectar con la API', 'err');
  }
});

async function cargarSelects() {
  try {
    const activos = await fetch(`${API}/api/datos/dispositivos/activos`)
      .then(r => r.json());

    const inactivos = await fetch(`${API}/api/datos/dispositivos/inactivos`)
      .then(r => r.json());

    const selActivos = document.getElementById('select-activos');
    const selInactivos = document.getElementById('select-inactivos');

    // Mantener opción por defecto
    selActivos.innerHTML = `
      <option value="all">Dispositivos activos</option>
      ${activos.dispositivos.map(d =>
        `<option value="${d}">${d}</option>`
      ).join('')}
    `;

    selInactivos.innerHTML = `
      <option value="all">Dispositivos inactivos</option>
      ${inactivos.dispositivos.map(d =>
        `<option value="${d}">${d}</option>`
      ).join('')}
    `;

  } catch (error) {
    console.error('Error cargando dispositivos:', error);
  }
}

function mostrarDatos(device = selectedDevice) {
  fetch(`${API}/api/datos?device=${device}`)
    .then(r => r.json())
    .then(json => {
      document.getElementById('datos-dispositivo').textContent = JSON.stringify(json.datos, null, 2);
    });
}

document.getElementById('busqueda').addEventListener('input', e => {
  const filtro = e.target.value.toLowerCase();
  ['select-activos','select-inactivos'].forEach(id => {
    const sel = document.getElementById(id);
    [...sel.options].forEach(opt => {
      opt.style.display = opt.value.toLowerCase().includes(filtro) ? '' : 'none';
    });
  });
});

cargarSelects();

// ── Select dispositivos ───────────────────────────────────────

const selectActivos = document.getElementById('select-activos');
const selectInactivos = document.getElementById('select-inactivos');

selectActivos.addEventListener('change', e => {

  const value = e.target.value;

  // Si vuelve a ALL
  if (value === 'all') {
    selectedDevice = null;

    cargarDatos();
    cargarAnalisis();

    return;
  }

  // Guardar dispositivo seleccionado
  selectedDevice = value;

  // Resetear el otro select
  selectInactivos.value = 'all';

  // Cargar SOLO ese dispositivo
  cargarDatos(selectedDevice);
  cargarAnalisis(selectedDevice);
});

selectInactivos.addEventListener('change', e => {

  const value = e.target.value;

  // Si vuelve a ALL
  if (value === 'all') {
    selectedDevice = null;

    cargarDatos();
    cargarAnalisis();

    return;
  }

  // Guardar dispositivo seleccionado
  selectedDevice = value;

  // Resetear el otro select
  selectActivos.value = 'all';

  // Cargar SOLO ese dispositivo
  cargarDatos(selectedDevice);
  cargarAnalisis(selectedDevice);
});

setInterval(() => {
  if (selectedDevice) {
    cargarDatos(selectedDevice);
    cargarAnalisis(selectedDevice);
  } else {
    cargarDatos();
    cargarAnalisis();
  }
}, POLL_MS);
