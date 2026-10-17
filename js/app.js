/**
 * AURUM POS — Main Application
 * Orquestación de módulos, navegación, dashboard, clientes y configuración.
 */

const AurumApp = (() => {
    let currentPage = 'dashboard';

    // ---- Init ----
    function init() {
        AurumState.init();
        if (typeof AuthModule !== 'undefined') {
            AuthModule.init();
        }
        setupNavigation();
        setupSidebar();
        renderPage('dashboard');
        updateHeaderPrice();

        // Subscribe to state changes
        AurumState.subscribe(() => {
            updateHeaderPrice();
            if (currentPage === 'dashboard') renderDashboard();
        });
    }

    // ---- Navigation ----
    function setupNavigation() {
        // Event delegation to seamlessly support dynamic navigation items (auth/profile/logout)
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item[data-page]');
            if (navItem) {
                const page = navItem.dataset.page;
                navigateTo(page);
            }
        });
    }

    function navigateTo(page) {
        // Enforce lock screen if no user is authenticated
        if (typeof AuthModule !== 'undefined' && !AuthModule.getCurrentUser()) {
            return;
        }

        // Enforce role-based access control
        if (typeof AuthModule !== 'undefined' && !AuthModule.canAccess(page)) {
            const user = AuthModule.getCurrentUser();
            showToast('Acceso Denegado', `Tu rango (${user ? user.roleLabel : 'Invitado'}) no cuenta con permisos para el módulo de ${page}.`, 'warning');
            page = 'dashboard';
        }

        currentPage = page;

        // Update nav items
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update header title
        const titles = {
            dashboard: 'Dashboard',
            purchases: 'Nueva compra',
            sales: 'Nueva venta',
            inventory: 'Inventario',
            clients: 'Clientes',
            history: 'Historial',
            settings: 'Configuración',
            users: 'Gestión de Roles (CEO)',
            profile: 'Mi Perfil de Usuario',
        };
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = titles[page] || 'Dashboard';

        // Hide all pages, show current
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) targetPage.classList.add('active');

        // Render page content
        renderPage(page);

        // Close sidebar on mobile
        closeSidebar();
    }

    function renderPage(page) {
        switch (page) {
            case 'dashboard': renderDashboard(); break;
            case 'purchases': PurchasesModule.render(); break;
            case 'sales': SalesModule.render(); break;
            case 'inventory': InventoryModule.render(); break;
            case 'clients': renderClients(); break;
            case 'history': HistoryModule.render(); break;
            case 'settings': renderSettings(); break;
            case 'users': if (typeof AuthModule !== 'undefined') AuthModule.render('users'); break;
            case 'profile': if (typeof AuthModule !== 'undefined') AuthModule.render('profile'); break;
        }
    }

    // ---- Sidebar (mobile) ----
    function setupSidebar() {
        const menuBtn = document.getElementById('menu-btn');
        const overlay = document.getElementById('sidebar-overlay');

        if (menuBtn) {
            menuBtn.addEventListener('click', toggleSidebar);
        }
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('active');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
    }

    // ---- Header ----
    function updateHeaderPrice() {
        const config = AurumState.getConfig();
        const el = document.getElementById('header-ref-price');
        if (el) {
            el.textContent = AurumCalc.formatCurrency(config.referencePrice) + '/g';
        }
    }

    // ---- Dashboard ----
    function renderDashboard() {
        const container = document.getElementById('page-dashboard');
        if (!container) return;

        const stats = AurumState.getStats();
        const config = AurumState.getConfig();

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Dashboard</h2>
                    <p class="section-header__desc">Resumen de actividad del día</p>
                </div>
                <div style="display:flex; gap:var(--space-sm);">
                    <button class="btn btn--primary" onclick="AurumApp.navigateTo('purchases')">+ Nueva compra</button>
                    <button class="btn btn--secondary" onclick="AurumApp.navigateTo('sales')">+ Nueva venta</button>
                </div>
            </div>

            <!-- Stat Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--green">📥</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Compras hoy</div>
                        <div class="stat-card__value">${stats.purchasesCount}</div>
                        <div class="stat-card__change">${AurumCalc.formatCurrency(stats.purchasesTotal)}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--blue">📤</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Ventas hoy</div>
                        <div class="stat-card__value">${stats.salesCount}</div>
                        <div class="stat-card__change">${AurumCalc.formatCurrency(stats.salesTotal)}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--gold">📊</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Operaciones hoy</div>
                        <div class="stat-card__value">${stats.operationsCount}</div>
                        <div class="stat-card__change">compras + ventas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--gold">📦</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Piezas disponibles</div>
                        <div class="stat-card__value">${stats.inventoryCount}</div>
                        <div class="stat-card__change">en inventario</div>
                    </div>
                </div>
            </div>

            <!-- Reference price indicator -->
            <div class="card card--gold" style="margin-top:var(--space-lg);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md);">
                    <div>
                        <div style="font-size:var(--font-size-sm); color:var(--color-gold); font-weight:600;">💰 Precio de referencia (valor de prueba)</div>
                        <div style="font-size:var(--font-size-2xl); font-weight:700; color:var(--color-text); margin-top:4px;">${AurumCalc.formatCurrency(config.referencePrice)} <span style="font-size:var(--font-size-sm); font-weight:400; color:var(--color-text-secondary);">por gramo de oro puro</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:var(--font-size-xs); color:var(--color-text-muted);">Última actualización</div>
                        <div style="font-size:var(--font-size-sm); color:var(--color-text-secondary);">${AurumCalc.formatDateTime(config.referencePriceUpdated)}</div>
                        <div class="sidebar__demo-badge" style="margin-top:var(--space-xs);">⚠ Valor de prueba</div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card" style="margin-top:var(--space-lg);">
                <div class="card__header">
                    <h3 class="card__title">Movimientos recientes</h3>
                    <button class="btn btn--ghost btn--sm" onclick="AurumApp.navigateTo('history')">Ver todo →</button>
                </div>
                ${stats.recentOperations.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state__icon">📋</div>
                        <h3 class="empty-state__title">Sin movimientos</h3>
                        <p class="empty-state__text">Registre una compra o venta para ver los movimientos aquí.</p>
                    </div>
                ` : `
                    <div class="activity-list">
                        ${stats.recentOperations.map(op => {
                            const isCompra = op.type === 'compra';
                            const amount = isCompra ? (op.estimatedValue || 0) : (op.total || 0);
                            const iconBg = isCompra ? 'background:var(--color-success-bg); color:var(--color-success);' : 'background:var(--color-info-bg); color:var(--color-info);';
                            return `
                                <div class="activity-item">
                                    <div class="activity-item__icon" style="${iconBg}">
                                        ${isCompra ? '📥' : '📤'}
                                    </div>
                                    <div class="activity-item__info">
                                        <div class="activity-item__title">${op.id} — ${isCompra ? 'Compra' : 'Venta'}</div>
                                        <div class="activity-item__meta">${op.clientName || '—'} · ${AurumCalc.formatDateTime(op.date)}</div>
                                    </div>
                                    <div class="activity-item__amount" style="color:${isCompra ? 'var(--color-success)' : 'var(--color-info)'}">
                                        ${isCompra ? '-' : '+'}${AurumCalc.formatCurrency(amount)}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    // ---- Clients ----
    function renderClients() {
        const container = document.getElementById('page-clients');
        if (!container) return;

        if (typeof AuthModule !== 'undefined' && !AuthModule.canAccess('clients')) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:var(--space-2xl); max-width:650px; margin: var(--space-xl) auto;">
                    <div style="font-size:3rem; margin-bottom:var(--space-md);">👥</div>
                    <h3>Directorio de Clientes Restringido</h3>
                    <p style="color:var(--color-text-secondary); margin-top:var(--space-sm); font-size:var(--font-size-sm);">
                        El acceso al registro de clientes de mostrador está reservado para <strong>Vendedor / Cajero</strong>, <strong>Administrador</strong> y <strong>CEO</strong>.
                        Tu rol actual es: <strong>${AuthModule.getCurrentUser() ? AuthModule.getCurrentUser().roleLabel : 'Personal de Inventario'}</strong>.
                    </p>
                </div>
            `;
            return;
        }

        const clients = AurumState.getClients();

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Clientes</h2>
                    <p class="section-header__desc">Gestión de información básica de clientes</p>
                </div>
                <button class="btn btn--primary" onclick="AurumApp.showNewClientForm()">+ Nuevo cliente</button>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-box__icon" aria-hidden="true">🔍</span>
                    <input type="search" id="clients-search" class="search-box__input"
                        placeholder="Buscar por nombre, documento o teléfono..." aria-label="Buscar cliente">
                </div>
            </div>

            <div id="clients-results" class="results-indicator">Mostrando ${clients.length} cliente${clients.length !== 1 ? 's' : ''}</div>

            ${clients.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state__icon">👥</div>
                    <h3 class="empty-state__title">Sin clientes registrados</h3>
                    <p class="empty-state__text">Agregue un cliente para empezar.</p>
                    <button class="btn btn--primary" onclick="AurumApp.showNewClientForm()">+ Nuevo cliente</button>
                </div>
            ` : `
                <div class="table-container" id="clients-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Documento</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Fecha registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="clients-tbody">
                            ${renderClientRows(clients)}
                        </tbody>
                    </table>
                </div>
            `}
        `;

        // Search event
        document.getElementById('clients-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = AurumState.getClients().filter(c =>
                c.name.toLowerCase().includes(q) ||
                (c.documentNumber || '').includes(q) ||
                (c.phone || '').includes(q)
            );
            const tbody = document.getElementById('clients-tbody');
            const resultsEl = document.getElementById('clients-results');
            if (tbody) tbody.innerHTML = renderClientRows(filtered);
            if (resultsEl) resultsEl.textContent = `Mostrando ${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`;
        });
    }

    function renderClientRows(clients) {
        return clients.map(c => `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td>${c.name}</td>
                <td>${c.documentType ? c.documentType + ' ' : ''}${c.documentNumber || '—'}</td>
                <td>${c.phone || '—'}</td>
                <td>${c.email || '—'}</td>
                <td>${AurumCalc.formatDate(c.createdAt)}</td>
                <td>
                    <button class="btn btn--ghost btn--sm" onclick="AurumApp.viewClient('${c.id}')" aria-label="Ver detalle de ${c.name}">
                        👁 Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function showNewClientForm() {
        showModal('Nuevo cliente', `
            <form id="new-client-form" novalidate>
                <div class="form-group">
                    <label for="client-name" class="form-label form-label--required">Nombre completo</label>
                    <input type="text" id="client-name" name="name" class="form-input" placeholder="Nombre del cliente">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="client-doc-type" class="form-label">Tipo de documento</label>
                        <select id="client-doc-type" name="documentType" class="form-select">
                            <option value="CC">Cédula de ciudadanía (CC)</option>
                            <option value="CE">Cédula de extranjería (CE)</option>
                            <option value="NIT">NIT</option>
                            <option value="PP">Pasaporte</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="client-doc-number" class="form-label">Número de documento</label>
                        <input type="text" id="client-doc-number" name="documentNumber" class="form-input" placeholder="Número">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="client-phone" class="form-label form-label--required">Teléfono</label>
                        <input type="tel" id="client-phone" name="phone" class="form-input" placeholder="300 123 4567">
                    </div>
                    <div class="form-group">
                        <label for="client-email" class="form-label">Correo electrónico</label>
                        <input type="email" id="client-email" name="email" class="form-input" placeholder="correo@ejemplo.com">
                    </div>
                </div>
                <div class="form-group">
                    <label for="client-observations" class="form-label">Observaciones</label>
                    <textarea id="client-observations" name="observations" class="form-textarea" placeholder="Notas..."></textarea>
                </div>
                <p style="font-size:var(--font-size-xs); color:var(--color-text-muted); margin-top:var(--space-sm);">
                    Los datos se almacenan localmente como demostración. En producción, el manejo de datos personales debe cumplir la normativa de protección de datos.
                </p>
            </form>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: '✓ Guardar cliente', class: 'btn btn--primary', action: () => {
                saveNewClient();
            }},
        ]);
    }

    function saveNewClient() {
        const form = document.getElementById('new-client-form');
        const data = Object.fromEntries(new FormData(form));

        const validation = AurumValidation.validateForm(data, {
            name: { required: true, minLength: 2, requiredMessage: 'Ingrese el nombre del cliente.' },
            phone: { required: true, type: 'phone', requiredMessage: 'Ingrese un teléfono.' },
            email: { type: 'email' },
        });

        if (!validation.valid) {
            AurumValidation.showFormErrors(form, validation.errors);
            return;
        }

        AurumState.addClient(data);
        closeModal();
        showToast('Cliente registrado', `Se registró a ${data.name}.`, 'success');
        renderClients();
    }

    function viewClient(id) {
        const c = AurumState.getClient(id);
        if (!c) return;

        showModal(`Cliente ${c.name}`, `
            <div class="detail-grid">
                <div class="detail-field">
                    <span class="detail-field__label">ID</span>
                    <span class="detail-field__value">${c.id}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Nombre</span>
                    <span class="detail-field__value">${c.name}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Documento</span>
                    <span class="detail-field__value">${c.documentType ? c.documentType + ' ' : ''}${c.documentNumber || '—'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Teléfono</span>
                    <span class="detail-field__value">${c.phone || '—'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Email</span>
                    <span class="detail-field__value">${c.email || '—'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Registro</span>
                    <span class="detail-field__value">${AurumCalc.formatDate(c.createdAt)}</span>
                </div>
                ${c.observations ? `
                <div class="detail-field" style="grid-column: 1 / -1;">
                    <span class="detail-field__label">Observaciones</span>
                    <span class="detail-field__value">${c.observations}</span>
                </div>` : ''}
            </div>
        `);
    }

    // ---- Settings ----
    function renderSettings() {
        const container = document.getElementById('page-settings');
        if (!container) return;

        const activeUser = typeof AuthModule !== 'undefined' ? AuthModule.getCurrentUser() : null;
        if (!activeUser || (activeUser.role !== 'ceo' && activeUser.role !== 'admin')) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:var(--space-2xl); max-width:650px; margin: var(--space-xl) auto;">
                    <div style="font-size:3rem; margin-bottom:var(--space-md);">🔒</div>
                    <h3>Acceso Restringido</h3>
                    <p style="color:var(--color-text-secondary); margin-top:var(--space-sm); font-size:var(--font-size-sm);">
                        La configuración de parámetros financieros, precios de referencia y quilatajes requiere rango <strong>Administrador</strong> o <strong>CEO</strong>.
                        Tu rango actual es: <strong>${activeUser ? activeUser.roleLabel : 'Invitado'}</strong>.
                    </p>
                </div>
            `;
            return;
        }

        const config = AurumState.getConfig();

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Configuración</h2>
                    <p class="section-header__desc">Ajustes de demostración (configuraciones locales, no oficiales)</p>
                </div>
            </div>

            <div class="card" style="max-width:700px;">
                <h3 class="card__title" style="margin-bottom:var(--space-lg);">Parámetros generales</h3>

                <form id="settings-form" novalidate>
                    <div class="form-group">
                        <label for="setting-ref-price" class="form-label">Precio de referencia por gramo de oro puro (COP)</label>
                        <input type="number" id="setting-ref-price" name="referencePrice" class="form-input"
                            value="${config.referencePrice}" min="1" step="1000" style="max-width:300px;">
                        <span class="form-hint">Valor de prueba — no es una cotización oficial del mercado.</span>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="setting-currency" class="form-label">Moneda de presentación</label>
                            <select id="setting-currency" name="currency" class="form-select" disabled>
                                <option value="COP" selected>COP — Peso colombiano</option>
                            </select>
                            <span class="form-hint">Fijo en esta versión de demostración.</span>
                        </div>
                        <div class="form-group">
                            <label for="setting-weight-unit" class="form-label">Unidad de peso</label>
                            <select id="setting-weight-unit" name="weightUnit" class="form-select" disabled>
                                <option value="gramos" selected>Gramos (g)</option>
                            </select>
                            <span class="form-hint">Fijo en esta versión de demostración.</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="setting-purchase-factor" class="form-label">Factor comercial de compra</label>
                        <input type="number" id="setting-purchase-factor" name="purchaseFactor" class="form-input"
                            value="${config.purchaseFactor}" min="0.01" max="1" step="0.01" style="max-width:200px;">
                        <span class="form-hint">Decimal entre 0.01 y 1.00. Ejemplo: 0.90 = 90%.</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Quilatajes permitidos</label>
                        <div style="display:flex; gap:var(--space-md); flex-wrap:wrap;">
                            ${AurumState.KARATS.map(k => `
                                <label style="display:flex; align-items:center; gap:var(--space-xs); font-size:var(--font-size-sm); cursor:pointer;">
                                    <input type="checkbox" name="allowedKarats" value="${k.value}"
                                        ${config.allowedKarats.includes(k.value) ? 'checked' : ''}>
                                    ${k.label}
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="actions-row">
                        <button type="submit" class="btn btn--primary">💾 Guardar cambios</button>
                    </div>
                </form>
            </div>
        `;

        // Reset Demo (Solo CEO)
        const user = typeof AuthModule !== 'undefined' ? AuthModule.getCurrentUser() : null;
        const isCeo = user && user.role === 'ceo';

        container.innerHTML += `
            <div class="card" style="max-width:700px; margin-top:var(--space-lg); border-color:var(--color-error-border);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h3 class="card__title" style="color:var(--color-error); margin-bottom:var(--space-sm);">⚠ Restablecer datos de demostración</h3>
                    <span class="badge ${isCeo ? 'badge--ceo' : 'badge--sold'}">${isCeo ? '👑 Autorizado para CEO' : '🔒 Requiere Rango CEO'}</span>
                </div>
                <p style="font-size:var(--font-size-sm); color:var(--color-text-secondary); margin-bottom:var(--space-md);">
                    Esta acción eliminará todos los datos registrados en la sesión y restaurará los valores de demostración originales.
                    ${isCeo ? 'Como CEO, tienes la autorización para ejecutar el restablecimiento maestro.' : 'Privilegio reservado exclusivamente para la Dirección General (CEO).'}
                </p>
                <button class="btn btn--danger" ${isCeo ? '' : 'disabled title="Función exclusiva del CEO"'} onclick="AurumApp.confirmReset()">
                    🗑 Restablecer demo ${isCeo ? '' : '(Bloqueado)'}
                </button>
            </div>
        `;

        // Form submit
        document.getElementById('settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const data = Object.fromEntries(new FormData(form));

            // Get allowed karats
            const karatCheckboxes = form.querySelectorAll('input[name="allowedKarats"]:checked');
            const allowedKarats = Array.from(karatCheckboxes).map(cb => parseInt(cb.value));

            AurumState.updateConfig({
                referencePrice: parseFloat(data.referencePrice) || 280000,
                purchaseFactor: parseFloat(data.purchaseFactor) || 0.90,
                allowedKarats: allowedKarats,
                referencePriceUpdated: new Date().toISOString(),
            });

            showToast('Configuración guardada', 'Los parámetros se actualizaron correctamente.', 'success');
        });
    }

    function confirmReset() {
        const user = typeof AuthModule !== 'undefined' ? AuthModule.getCurrentUser() : null;
        if (!user || user.role !== 'ceo') {
            showToast('Acción Bloqueada', 'Solo el usuario con rango CEO tiene privilegios para restablecer la base de datos.', 'error');
            return;
        }

        showModal('Confirmar restablecimiento maestro', `
            <div style="text-align:center; padding:var(--space-lg) 0;">
                <div style="font-size:3rem; margin-bottom:var(--space-md);">👑</div>
                <h3 style="margin-bottom:var(--space-md);">¿Restablecer todos los datos del POS?</h3>
                <p style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">
                    Acción autorizada por el CEO: <strong>${user.name}</strong>.
                    Se eliminarán todas las operaciones, clientes e inventario registrados en esta sesión y se restaurarán los valores de fábrica.
                    Esta acción no se puede deshacer.
                </p>
            </div>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: '🗑 Sí, restablecer todo', class: 'btn btn--danger', action: () => {
                AurumState.reset();
                closeModal();
                showToast('Datos restablecidos', 'Se restauraron los datos de demostración.', 'success');
                navigateTo('dashboard');
            }},
        ]);
    }

    // ---- Modal System ----
    function showModal(title, bodyHtml, buttons) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;

        let footerHtml = '';
        if (buttons && buttons.length) {
            footerHtml = `<div class="modal__footer">
                ${buttons.map((btn, i) => {
                    if (btn.action === 'close') {
                        return `<button class="${btn.class}" onclick="AurumApp.closeModal()">${btn.label}</button>`;
                    }
                    return `<button class="${btn.class}" id="modal-action-${i}">${btn.label}</button>`;
                }).join('')}
            </div>`;
        }

        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal__header">
                    <h3 class="modal__title" id="modal-title">${title}</h3>
                    <button class="modal__close" onclick="AurumApp.closeModal()" aria-label="Cerrar">✕</button>
                </div>
                <div class="modal__body">${bodyHtml}</div>
                ${footerHtml}
            </div>
        `;

        overlay.classList.add('active');

        // Attach button actions
        if (buttons) {
            buttons.forEach((btn, i) => {
                if (typeof btn.action === 'function') {
                    document.getElementById(`modal-action-${i}`)?.addEventListener('click', btn.action);
                }
            });
        }

        // Focus trap
        const modal = overlay.querySelector('.modal');
        if (modal) {
            const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length) focusable[0].focus();
        }

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    function closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.innerHTML = '';
        }
    }

    // ---- Toast System ----
    function showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠',
            info: 'ℹ',
        };

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <span class="toast__icon">${icons[type] || icons.info}</span>
            <div class="toast__content">
                <div class="toast__title">${title}</div>
                <div class="toast__message">${message}</div>
            </div>
            <button class="toast__close" aria-label="Cerrar notificación">✕</button>
        `;

        container.appendChild(toast);

        // Close on click
        toast.querySelector('.toast__close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto-remove after 5s
        setTimeout(() => removeToast(toast), 5000);
    }

    function removeToast(toast) {
        if (!toast || !toast.parentElement) return;
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }

    // Public API
    return {
        init,
        navigateTo,
        showModal,
        closeModal,
        showToast,
        showNewClientForm,
        viewClient,
        confirmReset,
    };
})();

// Boot
document.addEventListener('DOMContentLoaded', AurumApp.init);
