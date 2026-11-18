// Controlador de vistas y navegación del sistema

let vistaActual = 'dashboard';
let graficasInstanciadas = {};

function alternarSidebar() {
  const sidebar = document.getElementById('sidebar-menu');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('abierto');
  if (overlay) overlay.classList.toggle('activo');
}

function obtenerVistaDesdeRuta() {
  const ruta = window.location.pathname.replace(/^\//, '');
  const rutasValidas = ['dashboard', 'nueva-venta', 'historial-ventas', 'inventario', 'mermas', 'historial-regional', 'cortes', 'clientes'];
  return rutasValidas.includes(ruta) ? ruta : 'dashboard';
}

function irA(e, vista) {
  if (e) e.preventDefault();
  window.history.pushState({ vista }, '', `/${vista}`);
  navegar(vista, false);
}

window.addEventListener('popstate', (e) => {
  const vista = (e.state && e.state.vista) ? e.state.vista : obtenerVistaDesdeRuta();
  navegar(vista, false);
});

async function iniciarApp() {
  verificarSalud();
  setInterval(verificarSalud, 10000);
  const vistaInicial = obtenerVistaDesdeRuta();
  navegar(vistaInicial, false);
}

async function verificarSalud() {
  try {
    const res = await fetch('/api/salud').then(r => r.json());
    const badge = document.getElementById('estado-sistema');
    const texto = document.getElementById('texto-salud');
    if (res.mysql === 'ok' && res.mongodb === 'ok') {
      texto.innerText = 'MySQL & MongoDB Conectados • Monitoreando en tiempo real';
      badge.querySelector('.punto-indicador').style.backgroundColor = '#38A169';
    } else if (res.mongodb === 'ok') {
      texto.innerText = 'MongoDB Activo (MySQL Local / Demo) • Monitoreando en tiempo real';
      badge.querySelector('.punto-indicador').style.backgroundColor = '#38A169';
    } else {
      texto.innerText = `MySQL: ${res.mysql} | Mongo: ${res.mongodb} • Monitoreando en tiempo real`;
      badge.querySelector('.punto-indicador').style.backgroundColor = '#DD6B20';
    }
  } catch (e) {
    document.getElementById('texto-salud').innerText = 'Servidor activo • Monitoreando en tiempo real';
    document.querySelector('.punto-indicador').style.backgroundColor = '#38A169';
  }
}

function navegar(vista, actualizarUrl = true) {
  vistaActual = vista;
  if (actualizarUrl) {
    window.history.pushState({ vista }, '', `/${vista}`);
  }

  // Cerrar sidebar en dispositivos móviles al navegar
  const sidebar = document.getElementById('sidebar-menu');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('abierto');
  if (overlay) overlay.classList.remove('activo');

  document.querySelectorAll('nav.menu a').forEach(a => {
    a.classList.remove('activo');
    if (a.getAttribute('href') === `/${vista}`) {
      a.classList.add('activo');
    }
  });
  
  // Destruir gráficos anteriores para evitar fugas de memoria
  Object.values(graficasInstanciadas).forEach(g => g.destroy());
  graficasInstanciadas = {};

  const contenedor = document.getElementById('contenido-vista');
  const titulo = document.getElementById('vista-titulo');

  switch (vista) {
    case 'dashboard':
      titulo.innerText = 'Dashboard y Resumen Ejecutivo';
      renderizarDashboard(contenedor);
      break;
    case 'nueva-venta':
      titulo.innerText = 'Registrar Nueva Venta';
      renderizarNuevaVenta(contenedor);
      break;
    case 'historial-ventas':
      titulo.innerText = 'Historial de Ventas';
      renderizarHistorialVentas(contenedor);
      break;
    case 'inventario':
      titulo.innerText = 'Control de Inventario por Lotes (FIFO)';
      renderizarInventario(contenedor);
      break;
    case 'mermas':
      titulo.innerText = 'Registro y Control de Mermas';
      renderizarMermas(contenedor);
      break;
    case 'historial-regional':
      titulo.innerText = 'Historial Regional Acumulado';
      renderizarHistorialRegional(contenedor);
      break;
    case 'cortes':
      titulo.innerText = 'Catálogo de Cortes de Carne';
      renderizarCortes(contenedor);
      break;
    case 'clientes':
      titulo.innerText = 'Gestión de Clientes';
      renderizarClientes(contenedor);
      break;
  }
}

// 1. Dashboard
async function renderizarDashboard(c) {
  c.innerHTML = `
    <div class="grid-kpis" id="kpis-contenedor">
      <div class="tarjeta-kpi"><span class="titulo">Ingresos Totales</span><h3 class="valor" id="kpi-ingresos">...</h3></div>
      <div class="tarjeta-kpi"><span class="titulo">Kilos Vendidos</span><h3 class="valor" id="kpi-kg">...</h3></div>
      <div class="tarjeta-kpi"><span class="titulo">Transacciones</span><h3 class="valor" id="kpi-ventas">...</h3></div>
      <div class="tarjeta-kpi"><span class="titulo">Costo en Mermas</span><h3 class="valor" id="kpi-mermas">...</h3></div>
      <div class="tarjeta-kpi"><span class="titulo">Ganancia Neta Est.</span><h3 class="valor" id="kpi-ganancia">...</h3></div>
    </div>

    <div class="grid-graficas">
      <div class="tarjeta-grafica">
        <h4>Ingresos Mensuales</h4>
        <canvas id="grafica-meses"></canvas>
      </div>
      <div class="tarjeta-grafica">
        <h4>Ventas por Región</h4>
        <canvas id="grafica-regiones"></canvas>
      </div>
      <div class="tarjeta-grafica">
        <h4>Top Cortes Más Vendidos</h4>
        <canvas id="grafica-cortes"></canvas>
      </div>
    </div>
  `;

  try {
    const [resumen, ventasMes, ventasRegion, topCortes] = await Promise.all([
      API.get('/api/reportes/resumen'),
      API.get('/api/reportes/ventas-por-mes'),
      API.get('/api/reportes/ventas-por-region'),
      API.get('/api/reportes/cortes-mas-vendidos?limite=5')
    ]);

    const k = resumen.datos;
    if (!document.getElementById('kpi-ingresos')) return;
    const formatoMonedaKPI = (valor) => API.formatoMoneda(valor).replace(' MXN', '<span class="etiqueta-moneda">MXN</span>');
    document.getElementById('kpi-ingresos').innerHTML = formatoMonedaKPI(k.ingresos);
    document.getElementById('kpi-kg').innerText = API.formatoKg(k.kg_vendidos);
    document.getElementById('kpi-ventas').innerText = k.num_ventas;
    document.getElementById('kpi-mermas').innerHTML = formatoMonedaKPI(k.costo_merma);
    document.getElementById('kpi-ganancia').innerHTML = formatoMonedaKPI(k.ganancia_estimada);

    // Gráfica Meses
    const ctxMeses = document.getElementById('grafica-meses').getContext('2d');
    graficasInstanciadas.meses = new Chart(ctxMeses, {
      type: 'line',
      data: {
        labels: ventasMes.datos.map(m => `Mes ${m.mes}/${m.anio}`),
        datasets: [{
          label: 'Ingresos ($ MXN)',
          data: ventasMes.datos.map(m => m.ingresos),
          borderColor: '#8B0000',
          backgroundColor: 'rgba(139, 0, 0, 0.1)',
          fill: true,
          tension: 0.3
        }]
      }
    });

    // Gráfica Regiones
    const ctxRegiones = document.getElementById('grafica-regiones').getContext('2d');
    graficasInstanciadas.regiones = new Chart(ctxRegiones, {
      type: 'doughnut',
      data: {
        labels: ventasRegion.datos.map(r => r.region),
        datasets: [{
          data: ventasRegion.datos.map(r => r.ingresos),
          backgroundColor: ['#8B0000', '#C53030', '#E53E3E', '#DD6B20', '#3182CE', '#38A169']
        }]
      }
    });

    // Gráfica Cortes
    const ctxCortes = document.getElementById('grafica-cortes').getContext('2d');
    graficasInstanciadas.cortes = new Chart(ctxCortes, {
      type: 'bar',
      data: {
        labels: topCortes.datos.map(c => c.corte),
        datasets: [{
          label: 'Kg Vendidos',
          data: topCortes.datos.map(c => c.kg_totales),
          backgroundColor: '#C53030'
        }]
      }
    });
  } catch (e) {
    console.error('Error cargando datos del dashboard:', e);
  }
}

// 2. Nueva Venta
let carritoVenta = [];
let catalogoCortesCache = [];

async function renderizarNuevaVenta(c) {
  c.innerHTML = `
    <div class="grid-venta-responsive" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div class="tarjeta-tabla" style="padding: 20px;">
        <h4 style="margin-bottom: 16px;">1. Datos de la Operación</h4>
        <div style="margin-bottom: 12px;">
          <label style="font-weight: 600; font-size: 0.85rem;">Sucursal emisora:</label>
          <select id="sel-sucursal" class="form-control" style="margin-top: 4px;"></select>
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-weight: 600; font-size: 0.85rem;">Cliente:</label>
          <select id="sel-cliente" class="form-control" style="margin-top: 4px;"></select>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-weight: 600; font-size: 0.85rem;">Método de Pago:</label>
          <select id="sel-pago" class="form-control" style="margin-top: 4px;">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
            <option value="transferencia">Transferencia Bancaria</option>
          </select>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--color-borde); margin: 20px 0;">

        <h4 style="margin-bottom: 12px;">2. Agregar Corte al Carrito</h4>
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <select id="sel-corte" class="form-control" style="flex: 2;"></select>
          <input type="number" id="inp-kg" class="form-control" placeholder="Kilos (ej. 2.5)" step="0.1" min="0.1" style="flex: 1;">
          <button class="btn btn-primario" onclick="agregarAlCarrito()">+ Añadir</button>
        </div>
      </div>

      <div class="tarjeta-tabla" style="padding: 20px; display: flex; flex-direction: column;">
        <h4 style="margin-bottom: 16px;">3. Resumen de la Venta en Vivo</h4>
        <table style="flex: 1;">
          <thead>
            <tr>
              <th>Corte</th>
              <th>Precio/Kg</th>
              <th>Kilos</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="carrito-cuerpo">
            <tr><td colspan="5" style="text-align: center; color: var(--color-texto-mutado);">El carrito está vacío</td></tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid var(--color-borde); display: flex; justify-content: space-between; align-items: center;">
          <h3>Total: <span id="lbl-total-venta" style="color: var(--color-primario);">$0.00 MXN</span></h3>
          <button class="btn btn-primario" style="font-size: 1rem; padding: 10px 24px;" onclick="finalizarVenta()">Finalizar Venta</button>
        </div>
      </div>
    </div>
  `;

  carritoVenta = [];
  try {
    const [sucursales, clientes, cortes] = await Promise.all([
      API.get('/api/sucursales'),
      API.get('/api/clientes'),
      API.get('/api/cortes')
    ]);

    catalogoCortesCache = cortes.datos;

    const selSuc = document.getElementById('sel-sucursal');
    if (!selSuc) return;
    selSuc.innerHTML = sucursales.datos.map(s => `<option value="${s.id}">${s.nombre} (${s.region_nombre})</option>`).join('');

    const selCli = document.getElementById('sel-cliente');
    selCli.innerHTML = clientes.datos.map(c => `<option value="${c.id}">${c.nombre} [${c.tipo}]</option>`).join('');

    const selCor = document.getElementById('sel-corte');
    selCor.innerHTML = cortes.datos.filter(c => c.activo).map(c => `<option value="${c.id}">${c.nombre} - ${API.formatoMoneda(c.precio_kg)}/kg (${c.tipo_carne})</option>`).join('');
  } catch (e) {
    console.error(e);
  }
}

function agregarAlCarrito() {
  const corteId = parseInt(document.getElementById('sel-corte').value, 10);
  const kg = parseFloat(document.getElementById('inp-kg').value);

  if (!kg || kg <= 0) {
    API.mostrarToast('Por favor introduce una cantidad de kilos válida', 'error');
    return;
  }

  const corte = catalogoCortesCache.find(c => c.id === corteId);
  const subtotal = Math.round(kg * corte.precio_kg * 100) / 100;

  carritoVenta.push({
    corte_id: corte.id,
    corte: corte.nombre,
    tipo_carne: corte.tipo_carne,
    precio_kg: corte.precio_kg,
    kg,
    subtotal
  });

  document.getElementById('inp-kg').value = '';
  actualizarTablaCarrito();
}

function actualizarTablaCarrito() {
  const tbody = document.getElementById('carrito-cuerpo');
  if (carritoVenta.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-texto-mutado);">El carrito está vacío</td></tr>';
    document.getElementById('lbl-total-venta').innerText = '$0.00 MXN';
    return;
  }

  let total = 0;
  tbody.innerHTML = carritoVenta.map((item, idx) => {
    total += item.subtotal;
    return `
      <tr>
        <td><strong>${item.corte}</strong></td>
        <td>${API.formatoMoneda(item.precio_kg)}</td>
        <td>${item.kg} kg</td>
        <td><strong>${API.formatoMoneda(item.subtotal)}</strong></td>
        <td><button onclick="eliminarDelCarrito(${idx})" style="background: none; border: none; cursor: pointer; color: var(--color-peligro);">&times;</button></td>
      </tr>
    `;
  }).join('');

  document.getElementById('lbl-total-venta').innerText = API.formatoMoneda(total);
}

function eliminarDelCarrito(idx) {
  carritoVenta.splice(idx, 1);
  actualizarTablaCarrito();
}

async function finalizarVenta() {
  if (carritoVenta.length === 0) {
    API.mostrarToast('Agrega al menos un corte para concretar la venta', 'error');
    return;
  }

  const payload = {
    sucursal_id: parseInt(document.getElementById('sel-sucursal').value, 10),
    cliente_id: parseInt(document.getElementById('sel-cliente').value, 10),
    metodo_pago: document.getElementById('sel-pago').value,
    items: carritoVenta.map(i => ({ corte_id: i.corte_id, kg: i.kg }))
  };

  try {
    const res = await API.post('/api/ventas', payload);
    API.mostrarToast(`¡Venta registrada con éxito! Folio: ${res.datos.folio}`, 'exito');
    navegar('historial-ventas');
  } catch (e) {
    // Manejo de error de stock
    if (e.message && e.message.includes('Stock insuficiente')) {
      alert(`ALERTA DE INVENTARIO:\n${e.message}\nPor favor registra un lote de inventario o reduce los kg.`);
    }
  }
}

// 3. Historial de Ventas
async function renderizarHistorialVentas(c) {
  c.innerHTML = `
    <div class="tarjeta-tabla">
      <div class="tabla-header">
        <input type="text" id="busq-venta" placeholder="Buscar por folio o cliente..." class="form-control" style="max-width: 300px;" oninput="cargarVentasFiltradas()">
        <button class="btn btn-primario" onclick="navegar('nueva-venta')">+ Nueva Venta</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Sucursal / Región</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estatus</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-ventas-cuerpo">
          <tr><td colspan="8" style="text-align: center;">Cargando ventas...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  cargarVentasFiltradas();
}

async function cargarVentasFiltradas() {
  const q = document.getElementById('busq-venta') ? document.getElementById('busq-venta').value : '';
  try {
    const res = await API.get(`/api/ventas?q=${encodeURIComponent(q)}&limite=20`);
    const tbody = document.getElementById('tabla-ventas-cuerpo');
    if (!tbody) return;
    if (!res.datos.ventas.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron ventas.</td></tr>';
      return;
    }

    tbody.innerHTML = res.datos.ventas.map(v => `
      <tr>
        <td><strong>${v.folio}</strong></td>
        <td>${API.formatoFecha(v.fecha_venta)}</td>
        <td>${v.cliente.nombre}</td>
        <td>${v.sucursal.nombre} <br><small style="color: var(--color-texto-mutado);">${v.sucursal.region}</small></td>
        <td><small>${v.items.map(i => `${i.corte} (${i.kg}kg)`).join(', ')}</small></td>
        <td><strong>${API.formatoMoneda(v.pago.total)}</strong></td>
        <td>
          <span style="padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; background: ${v.estatus === 'completada' ? '#C6F6D5' : '#FED7D7'}; color: ${v.estatus === 'completada' ? '#22543D' : '#742A2A'};">
            ${v.estatus.toUpperCase()}
          </span>
        </td>
        <td>
          ${v.estatus === 'completada' ? `<button class="btn btn-peligro" style="padding: 4px 8px; font-size: 0.75rem;" onclick="cancelarVenta('${v._id}')">Cancelar</button>` : '-'}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function cancelarVenta(id) {
  if (!confirm('¿Estás seguro de cancelar esta venta? El stock se devolverá a los lotes y se restará del historial regional.')) return;
  try {
    await API.patch(`/api/ventas/${id}/cancelar`, {});
    API.mostrarToast('Venta cancelada y stock restaurado en Mongo', 'exito');
    cargarVentasFiltradas();
  } catch (e) {
    console.error(e);
  }
}

// 4. Inventario
async function renderizarInventario(c) {
  c.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <label style="font-weight: 600;">Sucursal:</label>
        <select id="sel-inv-sucursal" class="form-control" onchange="cargarInventarioSucursal()" style="min-width: 250px;"></select>
      </div>
      <button class="btn btn-primario" onclick="abrirModalLote()">+ Registrar Entrada de Lote</button>
    </div>

    <div class="tarjeta-tabla">
      <table>
        <thead>
          <tr>
            <th>Corte</th>
            <th>Stock Total Disponible</th>
            <th>Lotes Activos (FIFO)</th>
            <th>Alerta de Caducidad</th>
          </tr>
        </thead>
        <tbody id="tabla-inv-cuerpo">
          <tr><td colspan="4" style="text-align: center;">Seleccione una sucursal para ver inventario...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const sucursales = await API.get('/api/sucursales');
    const sel = document.getElementById('sel-inv-sucursal');
    if (!sel) return;
    sel.innerHTML = sucursales.datos.map(s => `<option value="${s.id}">${s.nombre} (${s.region_nombre})</option>`).join('');
    cargarInventarioSucursal();
  } catch (e) {
    console.error(e);
  }
}

async function cargarInventarioSucursal() {
  const selectSucursal = document.getElementById('sel-inv-sucursal');
  if (!selectSucursal) return;
  const sucursalId = selectSucursal.value;
  try {
    const res = await API.get(`/api/inventario?sucursal_id=${sucursalId}`);
    const tbody = document.getElementById('tabla-inv-cuerpo');
    if (!tbody) return;
    if (!res.datos.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay lotes con stock en esta sucursal. Registre una entrada.</td></tr>';
      return;
    }

    tbody.innerHTML = res.datos.map(item => `
      <tr>
        <td><strong>${item.corte}</strong></td>
        <td><strong style="color: var(--color-primario); font-size: 1.1rem;">${API.formatoKg(item.total_kg)}</strong></td>
        <td>
          <ul style="padding-left: 16px; font-size: 0.85rem;">
            ${item.lotes.map(l => `
              <li>${l.kg_disponibles} kg (Costo: ${API.formatoMoneda(l.costo_kg)}/kg) - Vence: ${new Date(l.fecha_caducidad).toLocaleDateString()}
              ${l.caduca_pronto ? '<span style="color: var(--color-peligro); font-weight: bold;">[VENCE PRONTO]</span>' : ''}</li>
            `).join('')}
          </ul>
        </td>
        <td>
          ${item.alerta_caducidad ? 
            '<span style="background: #FED7D7; color: #742A2A; padding: 4px 8px; border-radius: 4px; font-weight: 600;">Lote por vencer (≤ 3 días)</span>' : 
            '<span style="color: var(--color-exito); font-weight: 600;">Óptimo</span>'}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

// 5. Mermas
async function renderizarMermas(c) {
  c.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem;">Pérdidas y Mermas Operativas</h3>
      <button class="btn btn-primario" onclick="abrirModalMerma()">+ Registrar Merma</button>
    </div>

    <div class="tarjeta-tabla">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sucursal / Región</th>
            <th>Corte</th>
            <th>Kilos Mermados</th>
            <th>Motivo</th>
            <th>Costo Perdido</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody id="tabla-mermas-cuerpo">
          <tr><td colspan="7" style="text-align: center;">Cargando mermas...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const res = await API.get('/api/mermas?limite=30');
    const tbody = document.getElementById('tabla-mermas-cuerpo');
    if (!tbody) return;
    if (!res.datos.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay mermas registradas.</td></tr>';
      return;
    }

    tbody.innerHTML = res.datos.map(m => `
      <tr>
        <td>${API.formatoFecha(m.fecha)}</td>
        <td>${m.sucursal.nombre}</td>
        <td><strong>${m.corte}</strong></td>
        <td>${API.formatoKg(m.kg)}</td>
        <td><span style="text-transform: capitalize; background: #EDF2F7; padding: 2px 6px; border-radius: 4px;">${m.motivo.replace('_', ' ')}</span></td>
        <td><strong style="color: var(--color-peligro);">${API.formatoMoneda(m.costo_perdido)}</strong></td>
        <td><small>${m.notas || '-'}</small></td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

// 6. Historial Regional
async function renderizarHistorialRegional(c) {
  c.innerHTML = `
    <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
      <div>
        <label style="font-size: 0.85rem; font-weight: 600;">Región:</label>
        <select id="filtro-hist-region" class="form-control" onchange="cargarHistorialRegional()">
          <option value="">Todas las regiones</option>
        </select>
      </div>
      <div>
        <label style="font-size: 0.85rem; font-weight: 600;">Tipo de Carne:</label>
        <select id="filtro-hist-tipo" class="form-control" onchange="cargarHistorialRegional()">
          <option value="">Todos los tipos</option>
          <option value="res">Res</option>
          <option value="cerdo">Cerdo</option>
          <option value="pollo">Pollo</option>
          <option value="cordero">Cordero</option>
          <option value="embutido">Embutido</option>
        </select>
      </div>
    </div>

    <div class="tarjeta-grafica" style="margin-bottom: 24px;">
      <h4>Matriz de Consumo: ¿Qué tipo de carne se vende en cada región?</h4>
      <canvas id="grafica-consumo-regional" style="max-height: 350px;"></canvas>
    </div>

    <div class="tarjeta-tabla">
      <div class="tabla-header">
        <h4>Resumen Acumulado en MongoDB (historial_regional)</h4>
      </div>
      <table>
        <thead>
          <tr>
            <th>Año/Mes</th>
            <th>Región</th>
            <th>Corte</th>
            <th>Tipo</th>
            <th>Kg Vendidos</th>
            <th>Ingresos Acumulados</th>
            <th>Kg en Merma</th>
          </tr>
        </thead>
        <tbody id="tabla-historial-cuerpo">
          <tr><td colspan="7" style="text-align: center;">Cargando historial regional...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const [regiones, matriz] = await Promise.all([
      API.get('/api/regiones'),
      API.get('/api/reportes/tipo-carne-por-region')
    ]);

    const selReg = document.getElementById('filtro-hist-region');
    if (!selReg) return;
    selReg.innerHTML += regiones.datos.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');

    // Gráfica de barras agrupadas por región y tipo de carne
    const ctx = document.getElementById('grafica-consumo-regional').getContext('2d');
    const nombresRegiones = [...new Set(matriz.datos.map(d => d.region))];
    const tipos = ['res', 'cerdo', 'pollo', 'cordero', 'embutido'];
    const colores = { res: '#8B0000', cerdo: '#ED8936', pollo: '#ECC94B', cordero: '#805AD5', embutido: '#E53E3E' };

    const datasets = tipos.map(tipo => ({
      label: tipo.toUpperCase(),
      backgroundColor: colores[tipo],
      data: nombresRegiones.map(reg => {
        const item = matriz.datos.find(d => d.region === reg && d.tipo_carne === tipo);
        return item ? item.kg_totales : 0;
      })
    }));

    graficasInstanciadas.consumoRegional = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: nombresRegiones,
        datasets
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: false },
          y: { title: { display: true, text: 'Kilos Vendidos' } }
        }
      }
    });

    cargarHistorialRegional();
  } catch (e) {
    console.error(e);
  }
}

async function cargarHistorialRegional() {
  const regionId = document.getElementById('filtro-hist-region').value;
  const tipo = document.getElementById('filtro-hist-tipo').value;

  let url = '/api/reportes/historial-regional?';
  if (regionId) url += `region_id=${regionId}&`;
  if (tipo) url += `tipo_carne=${tipo}&`;

  try {
    const res = await API.get(url);
    const tbody = document.getElementById('tabla-historial-cuerpo');
    if (!tbody) return;
    if (!res.datos.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay registros acumulados para este filtro.</td></tr>';
      return;
    }

    tbody.innerHTML = res.datos.slice(0, 50).map(h => `
      <tr>
        <td><strong>${h.anio} / ${String(h.mes).padStart(2, '0')}</strong></td>
        <td>${h.region}</td>
        <td>${h.corte}</td>
        <td><span style="text-transform: capitalize;">${h.tipo_carne}</span></td>
        <td><strong>${API.formatoKg(h.kg_vendidos)}</strong></td>
        <td>${API.formatoMoneda(h.ingresos)}</td>
        <td style="color: var(--color-peligro);">${API.formatoKg(h.kg_merma)}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

// 7. Cortes (CRUD MySQL)
async function renderizarCortes(c) {
  c.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem;">Catálogo Oficial de Cortes</h3>
      <button class="btn btn-primario" onclick="abrirModalCorte()">+ Nuevo Corte</button>
    </div>

    <div class="tarjeta-tabla">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre del Corte</th>
            <th>Tipo de Carne</th>
            <th>Precio por Kg</th>
            <th>Fecha de Alta</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-cortes-cuerpo">
          <tr><td colspan="7" style="text-align: center;">Cargando cortes...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const res = await API.get('/api/cortes');
    const tbody = document.getElementById('tabla-cortes-cuerpo');
    if (!tbody) return;
    tbody.innerHTML = res.datos.map(corte => `
      <tr>
        <td>${corte.id}</td>
        <td><strong>${corte.nombre}</strong></td>
        <td><span style="text-transform: capitalize; background: #EDF2F7; padding: 2px 6px; border-radius: 4px;">${corte.tipo_carne}</span></td>
        <td><strong>${API.formatoMoneda(corte.precio_kg)}</strong></td>
        <td>${API.formatoFecha(corte.creado_en || '-')}</td>
        <td>${corte.activo ? '<span style="color: var(--color-exito);">Activo</span>' : '<span style="color: var(--color-peligro);">Inactivo</span>'}</td>
        <td>
          <button class="btn btn-peligro" style="padding: 4px 8px; font-size: 0.75rem;" onclick="desactivarCorte(${corte.id})">Desactivar</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function desactivarCorte(id) {
  if (!confirm('¿Desea desactivar este corte del catálogo?')) return;
  try {
    await API.delete(`/api/cortes/${id}`);
    API.mostrarToast('Corte desactivado', 'exito');
    renderizarCortes(document.getElementById('contenido-vista'));
  } catch (e) {
    console.error(e);
  }
}

// 8. Clientes (CRUD MySQL)
async function renderizarClientes(c) {
  c.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem;">Directorio de Clientes</h3>
      <button class="btn btn-primario" onclick="abrirModalCliente()">+ Registrar Cliente</button>
    </div>

    <div class="tarjeta-tabla">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Ciudad / Región</th>
            <th>Fecha de Registro</th>
          </tr>
        </thead>
        <tbody id="tabla-clientes-cuerpo">
          <tr><td colspan="7" style="text-align: center;">Cargando clientes...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const res = await API.get('/api/clientes');
    const tbody = document.getElementById('tabla-clientes-cuerpo');
    if (!tbody) return;
    tbody.innerHTML = res.datos.map(cli => `
      <tr>
        <td>${cli.id}</td>
        <td><strong>${cli.nombre}</strong></td>
        <td><span style="text-transform: capitalize; font-weight: 600;">${cli.tipo}</span></td>
        <td>${cli.telefono || '-'}</td>
        <td>${cli.correo || '-'}</td>
        <td>${cli.ciudad || '-'} (${cli.region_nombre || 'Sin región'})</td>
        <td>${API.formatoFecha(cli.creado_en || '-')}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

// Utilidades de modal
function cerrarModal() {
  document.getElementById('modal-global').classList.remove('abierto');
}

function abrirModalCorte() {
  const modal = document.getElementById('modal-cuerpo');
  modal.innerHTML = `
    <h3 style="margin-bottom: 16px;">Registrar Nuevo Corte de Carne</h3>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Nombre del Corte:</label>
      <input type="text" id="m-corte-nombre" class="form-control" placeholder="Ej. Picaña Prime">
    </div>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Tipo de Carne:</label>
      <select id="m-corte-tipo" class="form-control">
        <option value="res">Res</option>
        <option value="cerdo">Cerdo</option>
        <option value="pollo">Pollo</option>
        <option value="cordero">Cordero</option>
        <option value="embutido">Embutido</option>
      </select>
    </div>
    <div style="margin-bottom: 20px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Precio por Kg (MXN):</label>
      <input type="number" id="m-corte-precio" class="form-control" placeholder="Ej. 280.00" step="0.5">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primario" onclick="guardarNuevoCorte()">Guardar Corte</button>
    </div>
  `;
  document.getElementById('modal-global').classList.add('abierto');
}

async function guardarNuevoCorte() {
  const nombre = document.getElementById('m-corte-nombre').value.trim();
  const tipo_carne = document.getElementById('m-corte-tipo').value;
  const precio_kg = parseFloat(document.getElementById('m-corte-precio').value);

  if (!nombre || !precio_kg) {
    API.mostrarToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  try {
    await API.post('/api/cortes', { nombre, tipo_carne, precio_kg });
    API.mostrarToast('Corte guardado exitosamente', 'exito');
    cerrarModal();
    renderizarCortes(document.getElementById('contenido-vista'));
  } catch (e) {
    console.error(e);
  }
}

// Modales adicionales para Inventario, Mermas y Clientes
function abrirModalLote() {
  const modal = document.getElementById('modal-cuerpo');
  modal.innerHTML = `
    <h3 style="margin-bottom: 16px;">Registrar Entrada de Lote (Inventario)</h3>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Sucursal:</label>
      <select id="m-lote-sucursal" class="form-control"></select>
    </div>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Corte:</label>
      <select id="m-lote-corte" class="form-control"></select>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
      <div style="flex: 1;">
        <label style="font-size: 0.85rem; font-weight: 600;">Kilos:</label>
        <input type="number" id="m-lote-kg" class="form-control" placeholder="Ej. 50" step="0.5">
      </div>
      <div style="flex: 1;">
        <label style="font-size: 0.85rem; font-weight: 600;">Costo/Kg:</label>
        <input type="number" id="m-lote-costo" class="form-control" placeholder="Ej. 160" step="0.5">
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Fecha de Caducidad:</label>
      <input type="date" id="m-lote-caducidad" class="form-control">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primario" onclick="guardarNuevoLote()">Guardar Lote</button>
    </div>
  `;

  API.get('/api/sucursales').then(s => {
    const sel = document.getElementById('m-lote-sucursal');
    if (!sel) return;
    sel.innerHTML = s.datos.map(suc => `<option value="${suc.id}">${suc.nombre}</option>`).join('');
  });
  API.get('/api/cortes').then(c => {
    const sel = document.getElementById('m-lote-corte');
    if (!sel) return;
    sel.innerHTML = c.datos.filter(co => co.activo).map(co => `<option value="${co.id}">${co.nombre}</option>`).join('');
  });

  // Fecha de caducidad por defecto a 14 días
  const cadDefecto = new Date();
  cadDefecto.setDate(cadDefecto.getDate() + 14);
  document.getElementById('m-lote-caducidad').value = cadDefecto.toISOString().split('T')[0];

  document.getElementById('modal-global').classList.add('abierto');
}

async function guardarNuevoLote() {
  const sucursal_id = parseInt(document.getElementById('m-lote-sucursal').value, 10);
  const corte_id = parseInt(document.getElementById('m-lote-corte').value, 10);
  const kg_iniciales = parseFloat(document.getElementById('m-lote-kg').value);
  const costo_kg = parseFloat(document.getElementById('m-lote-costo').value);
  const fecha_caducidad = document.getElementById('m-lote-caducidad').value;

  if (!kg_iniciales || !costo_kg || !fecha_caducidad) {
    API.mostrarToast('Por favor completa los campos del lote', 'error');
    return;
  }

  try {
    await API.post('/api/inventario/lotes', {
      sucursal_id,
      corte_id,
      proveedor_id: 1,
      kg_iniciales,
      costo_kg,
      fecha_caducidad
    });
    API.mostrarToast('Lote registrado en MongoDB exitosamente', 'exito');
    cerrarModal();
    cargarInventarioSucursal();
  } catch (e) {
    console.error(e);
  }
}

function abrirModalMerma() {
  const modal = document.getElementById('modal-cuerpo');
  modal.innerHTML = `
    <h3 style="margin-bottom: 16px;">Registrar Merma Operativa</h3>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Sucursal:</label>
      <select id="m-merma-sucursal" class="form-control" onchange="cargarLotesParaMerma()"></select>
    </div>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Lote con Stock:</label>
      <select id="m-merma-lote" class="form-control"></select>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
      <div style="flex: 1;">
        <label style="font-size: 0.85rem; font-weight: 600;">Kilos a Mermar:</label>
        <input type="number" id="m-merma-kg" class="form-control" placeholder="Ej. 1.5" step="0.1">
      </div>
      <div style="flex: 1;">
        <label style="font-size: 0.85rem; font-weight: 600;">Motivo:</label>
        <select id="m-merma-motivo" class="form-control">
          <option value="caducidad">Caducidad</option>
          <option value="mal_corte">Mal Corte</option>
          <option value="descongelado">Descongelado</option>
          <option value="contaminacion">Contaminación</option>
          <option value="otro">Otro</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Notas u Observaciones:</label>
      <input type="text" id="m-merma-notas" class="form-control" placeholder="Detalle de la pérdida">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primario" onclick="guardarMerma()">Registrar Pérdida</button>
    </div>
  `;

  API.get('/api/sucursales').then(s => {
    const sel = document.getElementById('m-merma-sucursal');
    if (!sel) return;
    sel.innerHTML = s.datos.map(suc => `<option value="${suc.id}">${suc.nombre}</option>`).join('');
    cargarLotesParaMerma();
  });

  document.getElementById('modal-global').classList.add('abierto');
}

async function cargarLotesParaMerma() {
  const selectSucursal = document.getElementById('m-merma-sucursal');
  if (!selectSucursal) return;
  const sucursalId = selectSucursal.value;
  try {
    const res = await API.get(`/api/inventario?sucursal_id=${sucursalId}`);
    const selLotes = document.getElementById('m-merma-lote');
    if (!selLotes) return;
    const opciones = [];
    res.datos.forEach(c => {
      c.lotes.forEach(l => {
        opciones.push(`<option value="${l._id}">${c.corte} - ${l.kg_disponibles} kg disponibles (Vence: ${new Date(l.fecha_caducidad).toLocaleDateString()})</option>`);
      });
    });
    selLotes.innerHTML = opciones.length ? opciones.join('') : '<option value="">No hay lotes con stock en esta sucursal</option>';
  } catch (e) {
    console.error(e);
  }
}

async function guardarMerma() {
  const lote_id = document.getElementById('m-merma-lote').value;
  const kg = parseFloat(document.getElementById('m-merma-kg').value);
  const motivo = document.getElementById('m-merma-motivo').value;
  const notas = document.getElementById('m-merma-notas').value;

  if (!lote_id || !kg || kg <= 0) {
    API.mostrarToast('Selecciona un lote válido y especifica los kg', 'error');
    return;
  }

  try {
    await API.post('/api/mermas', { lote_id, kg, motivo, notas });
    API.mostrarToast('Merma registrada y stock descontado', 'exito');
    cerrarModal();
    renderizarMermas(document.getElementById('contenido-vista'));
  } catch (e) {
    console.error(e);
  }
}

function abrirModalCliente() {
  const modal = document.getElementById('modal-cuerpo');
  modal.innerHTML = `
    <h3 style="margin-bottom: 16px;">Registrar Nuevo Cliente</h3>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Nombre Completo o Empresa:</label>
      <input type="text" id="m-cli-nombre" class="form-control" placeholder="Ej. Asador de Carnes del Valle">
    </div>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Tipo de Cliente:</label>
      <select id="m-cli-tipo" class="form-control">
        <option value="mostrador">Mostrador (Público General)</option>
        <option value="restaurante">Restaurante / Negocio</option>
        <option value="mayorista">Mayorista / Distribuidor</option>
      </select>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
      <div style="flex: 1;">
        <label style="font-size: 0.85rem; font-weight: 600;">Teléfono:</label>
        <input type="text" id="m-cli-telefono" class="form-control" placeholder="667-000-0000">
      </div>
      <div style="flex: 1;">
        <label style="font-size: 0.85rem; font-weight: 600;">Correo Electrónico:</label>
        <input type="email" id="m-cli-correo" class="form-control" placeholder="cliente@correo.com">
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <label style="font-size: 0.85rem; font-weight: 600;">Ciudad:</label>
      <input type="text" id="m-cli-ciudad" class="form-control" placeholder="Ej. Culiacán">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primario" onclick="guardarCliente()">Guardar Cliente</button>
    </div>
  `;
  document.getElementById('modal-global').classList.add('abierto');
}

async function guardarCliente() {
  const nombre = document.getElementById('m-cli-nombre').value.trim();
  const tipo = document.getElementById('m-cli-tipo').value;
  const telefono = document.getElementById('m-cli-telefono').value.trim();
  const correo = document.getElementById('m-cli-correo').value.trim();
  const ciudad = document.getElementById('m-cli-ciudad').value.trim();

  if (!nombre) {
    API.mostrarToast('El nombre del cliente es obligatorio', 'error');
    return;
  }

  try {
    await API.post('/api/clientes', { nombre, tipo, telefono, correo, ciudad, region_id: 1 });
    API.mostrarToast('Cliente guardado exitosamente', 'exito');
    cerrarModal();
    renderizarClientes(document.getElementById('contenido-vista'));
  } catch (e) {
    console.error(e);
  }
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', iniciarApp);


