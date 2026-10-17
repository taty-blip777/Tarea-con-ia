/**
 * AURUM POS — History Module
 * Historial de operaciones.
 */

const HistoryModule = (() => {
    let filters = { search: '', type: '', dateFrom: '', dateTo: '' };

    function render() {
        const container = document.getElementById('page-history');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Historial de operaciones</h2>
                    <p class="section-header__desc">Operaciones registradas en la sesión de demostración</p>
                </div>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-box__icon" aria-hidden="true">🔍</span>
                    <input type="search" id="history-search" class="search-box__input"
                        placeholder="Buscar por operación o cliente..." aria-label="Buscar en historial">
                </div>
                <div class="filter-group">
                    <label for="history-filter-type" class="sr-only">Filtrar por tipo</label>
                    <select id="history-filter-type" class="filter-select">
                        <option value="">Todos los tipos</option>
                        <option value="compra">Compras</option>
                        <option value="venta">Ventas</option>
                    </select>
                </div>
            </div>

            <div id="history-results" class="results-indicator"></div>

            <div class="table-container" id="history-table-container">
                <table class="data-table" id="history-table">
                    <thead>
                        <tr>
                            <th>Operación</th>
                            <th>Fecha y hora</th>
                            <th>Tipo</th>
                            <th>Cliente</th>
                            <th>Importe</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="history-tbody"></tbody>
                </table>
            </div>

            <div id="history-empty" class="empty-state" style="display:none;">
                <div class="empty-state__icon">📋</div>
                <h3 class="empty-state__title">Sin operaciones</h3>
                <p class="empty-state__text">Aún no se han registrado operaciones en esta sesión de demostración.</p>
            </div>
        `;

        attachEvents();
        renderRows();
    }

    function getFilteredData() {
        let data = AurumState.getOperations();

        if (filters.search) {
            const q = filters.search.toLowerCase();
            data = data.filter(op =>
                op.id.toLowerCase().includes(q) ||
                (op.clientName || '').toLowerCase().includes(q)
            );
        }

        if (filters.type) {
            data = data.filter(op => op.type === filters.type);
        }

        return data;
    }

    function renderRows() {
        const tbody = document.getElementById('history-tbody');
        const emptyEl = document.getElementById('history-empty');
        const tableContainer = document.getElementById('history-table-container');
        const resultsEl = document.getElementById('history-results');
        if (!tbody) return;

        const data = getFilteredData();

        if (data.length === 0) {
            tableContainer.style.display = 'none';
            emptyEl.style.display = 'block';
            resultsEl.textContent = '';
            return;
        }

        tableContainer.style.display = 'block';
        emptyEl.style.display = 'none';
        resultsEl.textContent = `Mostrando ${data.length} operación${data.length !== 1 ? 'es' : ''}`;

        tbody.innerHTML = data.map(op => {
            const amount = op.type === 'compra' ? (op.estimatedValue || 0) : (op.total || 0);
            const typeBadge = op.type === 'compra'
                ? '<span class="badge badge--purchase"><span class="badge__dot"></span> Compra</span>'
                : '<span class="badge badge--sale"><span class="badge__dot"></span> Venta</span>';

            return `
                <tr>
                    <td><strong>${op.id}</strong></td>
                    <td>${AurumCalc.formatDateTime(op.date)}</td>
                    <td>${typeBadge}</td>
                    <td>${op.clientName || '—'}</td>
                    <td style="font-family:var(--font-mono); font-weight:600;">${AurumCalc.formatCurrency(amount)}</td>
                    <td><span class="badge badge--available"><span class="badge__dot"></span> ${op.status || 'completada'}</span></td>
                    <td>
                        <button class="btn btn--ghost btn--sm" onclick="HistoryModule.viewDetail('${op.id}', '${op.type}')" aria-label="Ver detalle de ${op.id}">
                            👁 Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function attachEvents() {
        document.getElementById('history-search')?.addEventListener('input', (e) => {
            filters.search = e.target.value;
            renderRows();
        });

        document.getElementById('history-filter-type')?.addEventListener('change', (e) => {
            filters.type = e.target.value;
            renderRows();
        });
    }

    function viewDetail(id, type) {
        const operations = AurumState.getOperations();
        const op = operations.find(o => o.id === id);
        if (!op) return;

        let content = '';

        if (op.type === 'compra') {
            const typeLabel = AurumState.PIECE_TYPES.find(t => t.value === op.pieceType)?.label || op.pieceType;
            content = `
                <div class="detail-grid">
                    <div class="detail-field">
                        <span class="detail-field__label">Operación</span>
                        <span class="detail-field__value">${op.id}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Fecha</span>
                        <span class="detail-field__value">${AurumCalc.formatDateTime(op.date)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Tipo</span>
                        <span class="detail-field__value"><span class="badge badge--purchase"><span class="badge__dot"></span> Compra</span></span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Cliente</span>
                        <span class="detail-field__value">${op.clientName || '—'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Pieza</span>
                        <span class="detail-field__value">${typeLabel}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Quilataje</span>
                        <span class="detail-field__value">${op.karat}K</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Peso neto</span>
                        <span class="detail-field__value">${AurumCalc.formatWeight(op.netWeight)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Peso puro estimado</span>
                        <span class="detail-field__value">${AurumCalc.formatWeight(op.pureWeight)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Valor estimado</span>
                        <span class="detail-field__value" style="font-size:var(--font-size-lg); color:var(--color-gold);">${AurumCalc.formatCurrency(op.estimatedValue)}</span>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="detail-grid">
                    <div class="detail-field">
                        <span class="detail-field__label">Operación</span>
                        <span class="detail-field__value">${op.id}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Fecha</span>
                        <span class="detail-field__value">${AurumCalc.formatDateTime(op.date)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Tipo</span>
                        <span class="detail-field__value"><span class="badge badge--sale"><span class="badge__dot"></span> Venta</span></span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Cliente</span>
                        <span class="detail-field__value">${op.clientName || '—'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-field__label">Método de pago</span>
                        <span class="detail-field__value">${AurumState.PAYMENT_METHODS.find(m => m.value === op.paymentMethod)?.label || op.paymentMethod}</span>
                    </div>
                </div>

                <h4 style="margin-top:var(--space-lg); margin-bottom:var(--space-md);">Piezas vendidas</h4>
                ${(op.items || []).map(item => `
                    <div style="display:flex; justify-content:space-between; padding:var(--space-sm); border-bottom:1px solid var(--color-border-light); font-size:var(--font-size-sm);">
                        <span>${item.name} (${item.id})</span>
                        <span style="font-family:var(--font-mono); font-weight:600;">${AurumCalc.formatCurrency(item.price)}</span>
                    </div>
                `).join('')}

                <div style="margin-top:var(--space-md); text-align:right;">
                    ${op.discount > 0 ? `<p style="font-size:var(--font-size-sm); color:var(--color-text-secondary);">Descuento: -${AurumCalc.formatCurrency(op.discount)}</p>` : ''}
                    <p style="font-size:var(--font-size-lg); font-weight:700; color:var(--color-gold);">Total: ${AurumCalc.formatCurrency(op.total)}</p>
                </div>
            `;
        }

        AurumApp.showModal(`Operación ${op.id}`, content);
    }

    return {
        render,
        renderRows,
        viewDetail,
    };
})();
