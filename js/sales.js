/**
 * AURUM POS — Sales Module
 * Módulo de nueva venta.
 */

const SalesModule = (() => {
    let selectedItems = [];
    let discount = 0;

    function render() {
        const container = document.getElementById('page-sales');
        if (!container) return;

        selectedItems = [];
        discount = 0;

        const clients = AurumState.getClients();
        const available = AurumState.getAvailableInventory();

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Nueva venta</h2>
                    <p class="section-header__desc">Prepare una venta de piezas disponibles en inventario</p>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 380px; gap:var(--space-xl); align-items:start;">
                <div>
                    <!-- Cliente y método de pago -->
                    <div class="card" style="margin-bottom:var(--space-lg);">
                        <h3 class="card__title" style="margin-bottom:var(--space-md);">Datos de la venta</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="sale-client" class="form-label form-label--required">Cliente</label>
                                <select id="sale-client" name="clientId" class="form-select">
                                    <option value="">Seleccionar cliente...</option>
                                    ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="sale-payment" class="form-label">Método de pago</label>
                                <select id="sale-payment" name="paymentMethod" class="form-select">
                                    ${AurumState.PAYMENT_METHODS.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Selección de piezas -->
                    <div class="card">
                        <div class="card__header">
                            <h3 class="card__title">Seleccionar piezas</h3>
                            <span class="results-indicator" id="sale-available-count">${available.length} disponible${available.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div class="search-box" style="margin-bottom:var(--space-md);">
                            <span class="search-box__icon" aria-hidden="true">🔍</span>
                            <input type="search" id="sale-search" class="search-box__input"
                                placeholder="Buscar pieza por código o nombre..." aria-label="Buscar pieza para venta">
                        </div>

                        ${available.length === 0 ? `
                            <div class="empty-state">
                                <div class="empty-state__icon">📦</div>
                                <h3 class="empty-state__title">Sin piezas disponibles</h3>
                                <p class="empty-state__text">No hay piezas disponibles en el inventario de demostración.</p>
                            </div>
                        ` : `
                            <div id="sale-pieces-list" class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th style="width:40px"></th>
                                            <th>Código</th>
                                            <th>Pieza</th>
                                            <th>Quilataje</th>
                                            <th>Peso</th>
                                            <th>Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody id="sale-pieces-tbody">
                                        ${renderAvailablePieces(available)}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Panel de venta -->
                <div>
                    <div class="calc-display" id="sale-summary">
                        <div class="calc-display__title">🛒 Resumen de venta</div>
                        <div id="sale-selected-list" style="margin-bottom:var(--space-md);">
                            <p style="color:var(--color-text-muted); font-size:var(--font-size-sm);">
                                Seleccione piezas del inventario para agregarlas a la venta.
                            </p>
                        </div>

                        <div class="form-group" style="margin-bottom:var(--space-md);">
                            <label for="sale-discount" class="form-label">Descuento (COP)</label>
                            <input type="number" id="sale-discount" class="form-input" value="0" min="0" step="1000">
                        </div>

                        <div class="calc-display__row">
                            <span class="calc-display__label">Subtotal</span>
                            <span class="calc-display__value" id="sale-subtotal">$0</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Descuento</span>
                            <span class="calc-display__value" id="sale-discount-display">$0</span>
                        </div>
                        <div class="calc-display__row calc-display__total">
                            <span class="calc-display__label">Total</span>
                            <span class="calc-display__value" id="sale-total">$0</span>
                        </div>
                    </div>

                    <div class="actions-row" style="margin-top:var(--space-md);">
                        <button type="button" class="btn btn--secondary" onclick="SalesModule.clearSale()">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn--primary btn--lg" id="sale-confirm-btn" onclick="SalesModule.handleSubmit()" disabled>
                            📋 Confirmar venta
                        </button>
                    </div>

                    <div style="margin-top:var(--space-md); padding:var(--space-sm) var(--space-md); background:var(--color-warning-bg); border:1px solid var(--color-warning-border); border-radius:var(--radius-md); font-size:var(--font-size-xs); color:var(--color-warning);">
                        ⚠ Venta de demostración. No constituye una transacción financiera real.
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function renderAvailablePieces(items) {
        return items.map(item => {
            const isSelected = selectedItems.some(s => s.id === item.id);
            return `
                <tr class="${isSelected ? 'selected' : ''}">
                    <td>
                        <input type="checkbox" id="sale-check-${item.id}"
                            ${isSelected ? 'checked' : ''}
                            onchange="SalesModule.toggleItem('${item.id}')"
                            aria-label="Seleccionar ${item.name}">
                    </td>
                    <td><strong>${item.id}</strong></td>
                    <td>${item.name}</td>
                    <td>${item.karat}K</td>
                    <td style="font-family:var(--font-mono)">${AurumCalc.formatWeight(item.weightNet)}</td>
                    <td style="font-family:var(--font-mono)">${AurumCalc.formatCurrency(item.estimatedPrice)}</td>
                </tr>
            `;
        }).join('');
    }

    function attachEvents() {
        const searchInput = document.getElementById('sale-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterPieces(e.target.value);
            });
        }

        const discountInput = document.getElementById('sale-discount');
        if (discountInput) {
            discountInput.addEventListener('input', (e) => {
                discount = parseFloat(e.target.value) || 0;
                updateSummary();
            });
        }
    }

    function filterPieces(query) {
        const available = AurumState.getAvailableInventory();
        const q = query.toLowerCase();
        const filtered = available.filter(item =>
            item.id.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q)
        );

        const tbody = document.getElementById('sale-pieces-tbody');
        if (tbody) {
            tbody.innerHTML = renderAvailablePieces(filtered);
        }

        const countEl = document.getElementById('sale-available-count');
        if (countEl) {
            countEl.textContent = `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`;
        }
    }

    function toggleItem(id) {
        const idx = selectedItems.findIndex(s => s.id === id);
        if (idx !== -1) {
            selectedItems.splice(idx, 1);
        } else {
            const item = AurumState.getInventoryItem(id);
            if (item && item.status === 'disponible') {
                selectedItems.push({
                    id: item.id,
                    name: item.name,
                    price: item.estimatedPrice,
                    quantity: 1,
                });
            }
        }
        updateSummary();
    }

    function updateSummary() {
        const listEl = document.getElementById('sale-selected-list');
        const confirmBtn = document.getElementById('sale-confirm-btn');

        if (selectedItems.length === 0) {
            listEl.innerHTML = `
                <p style="color:var(--color-text-muted); font-size:var(--font-size-sm);">
                    Seleccione piezas del inventario para agregarlas a la venta.
                </p>
            `;
            if (confirmBtn) confirmBtn.disabled = true;
        } else {
            listEl.innerHTML = selectedItems.map(item => `
                <div style="display:flex; justify-content:space-between; padding:var(--space-xs) 0; font-size:var(--font-size-sm); border-bottom:1px solid var(--color-gold-border);">
                    <span>${item.name}</span>
                    <span style="font-family:var(--font-mono); font-weight:600;">${AurumCalc.formatCurrency(item.price)}</span>
                </div>
            `).join('');
            if (confirmBtn) confirmBtn.disabled = false;
        }

        const calc = AurumCalc.calculateSale(selectedItems, discount);
        document.getElementById('sale-subtotal').textContent = AurumCalc.formatCurrency(calc.subtotal);
        document.getElementById('sale-discount-display').textContent = AurumCalc.formatCurrency(calc.discount);
        document.getElementById('sale-total').textContent = AurumCalc.formatCurrency(calc.total);
    }

    function handleSubmit() {
        const clientId = document.getElementById('sale-client')?.value;
        const paymentMethod = document.getElementById('sale-payment')?.value;

        if (!clientId) {
            AurumApp.showToast('Cliente requerido', 'Seleccione un cliente para la venta.', 'error');
            return;
        }

        if (selectedItems.length === 0) {
            AurumApp.showToast('Sin piezas', 'Seleccione al menos una pieza para la venta.', 'error');
            return;
        }

        const client = AurumState.getClient(clientId);
        const calc = AurumCalc.calculateSale(selectedItems, discount);

        AurumApp.showModal('Confirmar venta', `
            <div class="summary-panel">
                <div class="summary-panel__title">📋 Resumen de venta</div>

                <div class="summary-panel__row">
                    <span class="summary-panel__label">Cliente</span>
                    <span class="summary-panel__value">${client ? client.name : '—'}</span>
                </div>
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Método de pago</span>
                    <span class="summary-panel__value">${AurumState.PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label || paymentMethod}</span>
                </div>

                <hr class="summary-panel__divider">

                ${selectedItems.map(item => `
                    <div class="summary-panel__row">
                        <span class="summary-panel__label">${item.name} (${item.id})</span>
                        <span class="summary-panel__value">${AurumCalc.formatCurrency(item.price)}</span>
                    </div>
                `).join('')}

                <hr class="summary-panel__divider">

                <div class="summary-panel__row">
                    <span class="summary-panel__label">Subtotal</span>
                    <span class="summary-panel__value">${AurumCalc.formatCurrency(calc.subtotal)}</span>
                </div>
                ${calc.discount > 0 ? `
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Descuento</span>
                    <span class="summary-panel__value">-${AurumCalc.formatCurrency(calc.discount)}</span>
                </div>` : ''}

                <div class="summary-panel__total">
                    <span>Total</span>
                    <span>${AurumCalc.formatCurrency(calc.total)}</span>
                </div>
            </div>

            <p style="margin-top:var(--space-md); font-size:var(--font-size-xs); color:var(--color-text-muted);">
                ⚠ Esta es una operación de demostración. No genera comprobantes fiscales.
            </p>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: '✓ Confirmar venta', class: 'btn btn--success', action: () => {
                confirmSale(clientId, client, paymentMethod, calc);
            }},
        ]);
    }

    function confirmSale(clientId, client, paymentMethod, calc) {
        AurumState.addSale({
            clientId: clientId,
            clientName: client ? client.name : '—',
            items: [...selectedItems],
            subtotal: calc.subtotal,
            discount: calc.discount,
            total: calc.total,
            paymentMethod: paymentMethod,
        });

        AurumApp.closeModal();
        AurumApp.showToast('Venta registrada', `Se registró la venta por ${AurumCalc.formatCurrency(calc.total)}.`, 'success');
        clearSale();
        render(); // Re-render to update available pieces
    }

    function clearSale() {
        selectedItems = [];
        discount = 0;
    }

    return {
        render,
        toggleItem,
        handleSubmit,
        clearSale,
    };
})();
