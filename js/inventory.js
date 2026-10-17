/**
 * AURUM POS — Inventory Module
 * Renderizado y gestión del módulo de inventario.
 */

const InventoryModule = (() => {
    let currentSort = { field: null, direction: 'asc' };
    let filters = { search: '', type: '', karat: '', status: '' };

    function render() {
        const container = document.getElementById('page-inventory');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Inventario</h2>
                    <p class="section-header__desc">Consulta y gestión de piezas disponibles</p>
                </div>
            </div>

            <div class="toolbar">
                <div class="search-box">
                    <span class="search-box__icon" aria-hidden="true">🔍</span>
                    <input type="search" id="inv-search" class="search-box__input"
                        placeholder="Buscar por código o descripción..." aria-label="Buscar en inventario">
                </div>
                <div class="filter-group">
                    <label for="inv-filter-type" class="sr-only">Filtrar por tipo</label>
                    <select id="inv-filter-type" class="filter-select">
                        <option value="">Todos los tipos</option>
                        ${AurumState.PIECE_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                    </select>
                    <label for="inv-filter-karat" class="sr-only">Filtrar por quilataje</label>
                    <select id="inv-filter-karat" class="filter-select">
                        <option value="">Todo quilataje</option>
                        ${AurumState.KARATS.map(k => `<option value="${k.value}">${k.label}</option>`).join('')}
                    </select>
                    <label for="inv-filter-status" class="sr-only">Filtrar por estado</label>
                    <select id="inv-filter-status" class="filter-select">
                        <option value="">Todos los estados</option>
                        <option value="disponible">Disponible</option>
                        <option value="reservada">Reservada</option>
                        <option value="vendida">Vendida</option>
                    </select>
                </div>
            </div>

            <div id="inv-results" class="results-indicator"></div>

            <div class="table-container">
                <table class="data-table" id="inv-table">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="id">Código</th>
                            <th class="sortable" data-sort="name">Descripción</th>
                            <th>Tipo</th>
                            <th class="sortable" data-sort="karat">Quilataje</th>
                            <th class="sortable" data-sort="weightNet">Peso (g)</th>
                            <th class="sortable" data-sort="estimatedPrice">Precio Est.</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="inv-tbody"></tbody>
                </table>
            </div>

            <div id="inv-empty" class="empty-state" style="display:none;">
                <div class="empty-state__icon">📦</div>
                <h3 class="empty-state__title">Sin resultados</h3>
                <p class="empty-state__text">No se encontraron piezas con los filtros aplicados.</p>
            </div>
        `;

        attachEvents();
        renderTableRows();
    }

    function getFilteredData() {
        let data = AurumState.getInventory();

        if (filters.search) {
            const q = filters.search.toLowerCase();
            data = data.filter(item =>
                item.id.toLowerCase().includes(q) ||
                item.name.toLowerCase().includes(q)
            );
        }

        if (filters.type) {
            data = data.filter(item => item.type === filters.type);
        }

        if (filters.karat) {
            data = data.filter(item => item.karat === parseInt(filters.karat));
        }

        if (filters.status) {
            data = data.filter(item => item.status === filters.status);
        }

        // Sort
        if (currentSort.field) {
            data.sort((a, b) => {
                let va = a[currentSort.field];
                let vb = b[currentSort.field];
                if (typeof va === 'string') va = va.toLowerCase();
                if (typeof vb === 'string') vb = vb.toLowerCase();
                if (va < vb) return currentSort.direction === 'asc' ? -1 : 1;
                if (va > vb) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }

    function renderTableRows() {
        const tbody = document.getElementById('inv-tbody');
        const emptyEl = document.getElementById('inv-empty');
        const resultsEl = document.getElementById('inv-results');
        const tableContainer = document.querySelector('#page-inventory .table-container');
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
        resultsEl.textContent = `Mostrando ${data.length} pieza${data.length !== 1 ? 's' : ''}`;

        const statusBadge = (status) => {
            const map = {
                'disponible': { class: 'badge--available', label: '● Disponible' },
                'reservada': { class: 'badge--reserved', label: '◐ Reservada' },
                'vendida': { class: 'badge--sold', label: '○ Vendida' },
            };
            const s = map[status] || map['disponible'];
            return `<span class="badge ${s.class}">${s.label}</span>`;
        };

        const typeIcon = (type) => {
            const t = AurumState.PIECE_TYPES.find(pt => pt.value === type);
            return t ? t.icon : '📦';
        };

        tbody.innerHTML = data.map(item => `
            <tr>
                <td><strong>${item.id}</strong></td>
                <td>${typeIcon(item.type)} ${item.name}</td>
                <td>${AurumState.PIECE_TYPES.find(t => t.value === item.type)?.label || item.type}</td>
                <td>${item.karat}K</td>
                <td style="font-family:var(--font-mono)">${AurumCalc.formatWeight(item.weightNet)}</td>
                <td style="font-family:var(--font-mono)">${AurumCalc.formatCurrency(item.estimatedPrice)}</td>
                <td>${statusBadge(item.status)}</td>
                <td>
                    <button class="btn btn--ghost btn--sm" onclick="InventoryModule.viewDetail('${item.id}')" title="Ver detalle" aria-label="Ver detalle de ${item.name}">
                        👁 Ver
                    </button>
                </td>
            </tr>
        `).join('');

        // Update sort indicators
        document.querySelectorAll('#inv-table th.sortable').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            if (th.dataset.sort === currentSort.field) {
                th.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });
    }

    function attachEvents() {
        const searchInput = document.getElementById('inv-search');
        const typeFilter = document.getElementById('inv-filter-type');
        const karatFilter = document.getElementById('inv-filter-karat');
        const statusFilter = document.getElementById('inv-filter-status');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filters.search = e.target.value;
                renderTableRows();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                filters.type = e.target.value;
                renderTableRows();
            });
        }

        if (karatFilter) {
            karatFilter.addEventListener('change', (e) => {
                filters.karat = e.target.value;
                renderTableRows();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                filters.status = e.target.value;
                renderTableRows();
            });
        }

        // Sort headers
        document.querySelectorAll('#inv-table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (currentSort.field === field) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.direction = 'asc';
                }
                renderTableRows();
            });
        });
    }

    function viewDetail(id) {
        const item = AurumState.getInventoryItem(id);
        if (!item) return;

        const typeLabel = AurumState.PIECE_TYPES.find(t => t.value === item.type)?.label || item.type;

        const statusBadge = (status) => {
            const map = {
                'disponible': { class: 'badge--available', label: '● Disponible' },
                'reservada': { class: 'badge--reserved', label: '◐ Reservada' },
                'vendida': { class: 'badge--sold', label: '○ Vendida' },
            };
            const s = map[status] || map['disponible'];
            return `<span class="badge ${s.class}">${s.label}</span>`;
        };

        AurumApp.showModal('Detalle de pieza', `
            <div class="detail-grid">
                <div class="detail-field">
                    <span class="detail-field__label">Código</span>
                    <span class="detail-field__value">${item.id}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Nombre</span>
                    <span class="detail-field__value">${item.name}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Tipo</span>
                    <span class="detail-field__value">${typeLabel}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Quilataje</span>
                    <span class="detail-field__value">${item.karat}K</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Peso bruto</span>
                    <span class="detail-field__value">${AurumCalc.formatWeight(item.weightGross)}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Peso neto</span>
                    <span class="detail-field__value">${AurumCalc.formatWeight(item.weightNet)}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Peso puro estimado</span>
                    <span class="detail-field__value">${AurumCalc.formatWeight(item.weightPure)}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Precio estimado</span>
                    <span class="detail-field__value">${AurumCalc.formatCurrency(item.estimatedPrice)}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Estado</span>
                    <span class="detail-field__value">${statusBadge(item.status)}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-field__label">Fecha de registro</span>
                    <span class="detail-field__value">${AurumCalc.formatDateTime(item.createdAt)}</span>
                </div>
                ${item.observations ? `
                <div class="detail-field" style="grid-column: 1 / -1">
                    <span class="detail-field__label">Observaciones</span>
                    <span class="detail-field__value">${item.observations}</span>
                </div>` : ''}
            </div>
        `, (() => {
            const activeUser = typeof AuthModule !== 'undefined' ? AuthModule.getCurrentUser() : null;
            const canManage = activeUser && (activeUser.role === 'ceo' || activeUser.role === 'admin' || activeUser.role === 'inventario');
            const buttons = [
                { label: 'Cerrar', class: 'btn btn--secondary', action: 'close' }
            ];

            if (canManage && item.status !== 'vendida') {
                const nextStatus = item.status === 'disponible' ? 'reservada' : 'disponible';
                const label = item.status === 'disponible' ? '◐ Marcar como Reservada' : '● Marcar como Disponible';
                buttons.push({
                    label,
                    class: 'btn btn--primary',
                    action: () => {
                        AurumState.updateInventoryItem(item.id, { status: nextStatus });
                        AurumApp.closeModal();
                        AurumApp.showToast('Estado Actualizado', `La pieza ${item.id} se actualizó a estado: ${nextStatus}.`, 'success');
                        renderTableRows();
                    }
                });
            }
            return buttons;
        })());
    }

    return {
        render,
        renderTableRows,
        viewDetail,
    };
})();
