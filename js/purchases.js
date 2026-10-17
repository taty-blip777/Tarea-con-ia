/**
 * AURUM POS — Purchases Module
 * Formulario de nueva compra de oro.
 */

const PurchasesModule = (() => {

    function render() {
        const container = document.getElementById('page-purchases');
        if (!container) return;

        const config = AurumState.getConfig();
        const clients = AurumState.getClients();

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Nueva compra de oro</h2>
                    <p class="section-header__desc">Registre la recepción de oro de un cliente</p>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 380px; gap:var(--space-xl); align-items:start;">
                <div class="card">
                    <form id="purchase-form" novalidate>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="purchase-client" class="form-label form-label--required">Cliente</label>
                                <select id="purchase-client" name="clientId" class="form-select">
                                    <option value="">Seleccionar cliente...</option>
                                    ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="purchase-piece-type" class="form-label form-label--required">Tipo de pieza</label>
                                <select id="purchase-piece-type" name="pieceType" class="form-select">
                                    <option value="">Seleccionar tipo...</option>
                                    ${AurumState.PIECE_TYPES.map(t => `<option value="${t.value}">${t.icon} ${t.label}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="purchase-piece-name" class="form-label">Nombre o descripción de la pieza</label>
                            <input type="text" id="purchase-piece-name" name="pieceName" class="form-input"
                                placeholder="Ej: Anillo solitario con diamante">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="purchase-karat" class="form-label form-label--required">Quilataje</label>
                                <select id="purchase-karat" name="karat" class="form-select">
                                    <option value="">Seleccionar...</option>
                                    ${AurumState.KARATS.map(k => `<option value="${k.value}">${k.label}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="purchase-gross-weight" class="form-label form-label--required">Peso bruto (g)</label>
                                <input type="number" id="purchase-gross-weight" name="grossWeight" class="form-input"
                                    step="0.001" min="0.001" placeholder="0.000">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="purchase-non-gold" class="form-label">Peso no aurífero (g)</label>
                                <input type="number" id="purchase-non-gold" name="nonGoldWeight" class="form-input"
                                    step="0.001" min="0" value="0" placeholder="0.000">
                                <span class="form-hint">Peso de elementos que no son oro (piedras, otros metales).</span>
                            </div>
                            <div class="form-group">
                                <label for="purchase-ref-price" class="form-label form-label--required">Precio ref. por gramo (COP)</label>
                                <input type="number" id="purchase-ref-price" name="referencePrice" class="form-input"
                                    step="1" min="1" value="${config.referencePrice}">
                                <span class="form-hint">Valor de prueba — no es cotización oficial.</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="purchase-factor" class="form-label form-label--required">Factor de compra</label>
                            <input type="number" id="purchase-factor" name="purchaseFactor" class="form-input"
                                step="0.01" min="0.01" max="1" value="${config.purchaseFactor}"
                                style="max-width:180px;">
                            <span class="form-hint">Decimal entre 0.01 y 1.00. Ej: 0.90 = 90%.</span>
                        </div>

                        <div class="form-group">
                            <label for="purchase-observations" class="form-label">Observaciones</label>
                            <textarea id="purchase-observations" name="observations" class="form-textarea"
                                placeholder="Notas adicionales sobre la pieza..."></textarea>
                        </div>

                        <div class="actions-row">
                            <button type="button" class="btn btn--secondary" onclick="PurchasesModule.clearForm()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn--primary btn--lg">
                                📋 Revisar y confirmar
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Panel de cálculo en tiempo real -->
                <div>
                    <div class="calc-display" id="purchase-calc">
                        <div class="calc-display__title">💰 Cálculo estimado</div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Peso bruto</span>
                            <span class="calc-display__value" id="calc-gross">0.000 g</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Peso no aurífero</span>
                            <span class="calc-display__value" id="calc-nongold">0.000 g</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Peso neto</span>
                            <span class="calc-display__value" id="calc-net">0.000 g</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Quilataje</span>
                            <span class="calc-display__value" id="calc-karat">—</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Peso oro puro est.</span>
                            <span class="calc-display__value" id="calc-pure">0.000 g</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Precio ref./gramo</span>
                            <span class="calc-display__value" id="calc-refprice">$0</span>
                        </div>
                        <div class="calc-display__row">
                            <span class="calc-display__label">Factor de compra</span>
                            <span class="calc-display__value" id="calc-factor">0.90</span>
                        </div>
                        <div class="calc-display__row calc-display__total">
                            <span class="calc-display__label">Valor estimado</span>
                            <span class="calc-display__value" id="calc-total">$0</span>
                        </div>
                    </div>
                    <div style="margin-top:var(--space-md); padding:var(--space-sm) var(--space-md); background:var(--color-warning-bg); border:1px solid var(--color-warning-border); border-radius:var(--radius-md); font-size:var(--font-size-xs); color:var(--color-warning);">
                        ⚠ Los valores son estimados de demostración. No representan cotizaciones oficiales ni transacciones reales.
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function attachEvents() {
        const form = document.getElementById('purchase-form');
        if (!form) return;

        // Real-time calculation
        const calcInputs = ['purchase-gross-weight', 'purchase-non-gold', 'purchase-karat', 'purchase-ref-price', 'purchase-factor'];
        calcInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateCalculation);
                el.addEventListener('change', updateCalculation);
            }
        });

        // Form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSubmit();
        });
    }

    function updateCalculation() {
        const grossWeight = document.getElementById('purchase-gross-weight')?.value || 0;
        const nonGoldWeight = document.getElementById('purchase-non-gold')?.value || 0;
        const karat = document.getElementById('purchase-karat')?.value || 0;
        const refPrice = document.getElementById('purchase-ref-price')?.value || 0;
        const factor = document.getElementById('purchase-factor')?.value || 0;

        const calc = AurumCalc.calculatePurchase(grossWeight, nonGoldWeight, karat, refPrice, factor);

        document.getElementById('calc-gross').textContent = AurumCalc.formatWeight(calc.grossWeight);
        document.getElementById('calc-nongold').textContent = AurumCalc.formatWeight(calc.nonGoldWeight);
        document.getElementById('calc-net').textContent = AurumCalc.formatWeight(calc.netWeight);
        document.getElementById('calc-karat').textContent = karat ? `${karat}K` : '—';
        document.getElementById('calc-pure').textContent = AurumCalc.formatWeight(calc.pureWeight);
        document.getElementById('calc-refprice').textContent = AurumCalc.formatCurrency(calc.pricePerGram);
        document.getElementById('calc-factor').textContent = calc.purchaseFactor.toFixed(2);
        document.getElementById('calc-total').textContent = AurumCalc.formatCurrency(calc.estimatedValue);
    }

    function handleSubmit() {
        const form = document.getElementById('purchase-form');
        const data = Object.fromEntries(new FormData(form));

        // Validation schema
        const schema = {
            clientId: { required: true, requiredMessage: 'Seleccione un cliente.' },
            pieceType: { required: true, requiredMessage: 'Seleccione el tipo de pieza.' },
            karat: { required: true, requiredMessage: 'Seleccione el quilataje.' },
            grossWeight: { required: true, type: 'number', positive: true, requiredMessage: 'Ingrese el peso bruto.' },
            referencePrice: { required: true, type: 'number', positive: true, requiredMessage: 'Ingrese el precio de referencia.' },
            purchaseFactor: { required: true, type: 'number', min: 0.01, max: 1, requiredMessage: 'Ingrese el factor de compra.' },
        };

        const validation = AurumValidation.validateForm(data, schema);

        if (!validation.valid) {
            AurumValidation.showFormErrors(form, validation.errors);
            AurumApp.showToast('Formulario incompleto', 'Revise los campos marcados.', 'error');
            return;
        }

        AurumValidation.clearFormErrors(form);

        // Calculate
        const calc = AurumCalc.calculatePurchase(
            data.grossWeight, data.nonGoldWeight || 0, data.karat, data.referencePrice, data.purchaseFactor
        );

        const client = AurumState.getClient(data.clientId);

        // Show confirmation
        showConfirmation(data, calc, client);
    }

    function showConfirmation(data, calc, client) {
        const typeLabel = AurumState.PIECE_TYPES.find(t => t.value === data.pieceType)?.label || data.pieceType;

        AurumApp.showModal('Confirmar compra', `
            <div class="summary-panel">
                <div class="summary-panel__title">📋 Resumen de la operación</div>

                <div class="summary-panel__row">
                    <span class="summary-panel__label">Cliente</span>
                    <span class="summary-panel__value">${client ? client.name : '—'}</span>
                </div>
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Tipo de pieza</span>
                    <span class="summary-panel__value">${typeLabel}</span>
                </div>
                ${data.pieceName ? `
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Descripción</span>
                    <span class="summary-panel__value">${data.pieceName}</span>
                </div>` : ''}
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Quilataje</span>
                    <span class="summary-panel__value">${data.karat}K</span>
                </div>

                <hr class="summary-panel__divider">

                <div class="summary-panel__row">
                    <span class="summary-panel__label">Peso bruto</span>
                    <span class="summary-panel__value">${AurumCalc.formatWeight(calc.grossWeight)}</span>
                </div>
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Peso no aurífero</span>
                    <span class="summary-panel__value">${AurumCalc.formatWeight(calc.nonGoldWeight)}</span>
                </div>
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Peso neto</span>
                    <span class="summary-panel__value">${AurumCalc.formatWeight(calc.netWeight)}</span>
                </div>
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Peso oro puro estimado</span>
                    <span class="summary-panel__value">${AurumCalc.formatWeight(calc.pureWeight)}</span>
                </div>

                <hr class="summary-panel__divider">

                <div class="summary-panel__row">
                    <span class="summary-panel__label">Precio ref./gramo</span>
                    <span class="summary-panel__value">${AurumCalc.formatCurrency(calc.pricePerGram)}</span>
                </div>
                <div class="summary-panel__row">
                    <span class="summary-panel__label">Factor de compra</span>
                    <span class="summary-panel__value">${calc.purchaseFactor.toFixed(2)} (${(calc.purchaseFactor * 100).toFixed(0)}%)</span>
                </div>

                <div class="summary-panel__total">
                    <span>Valor estimado a pagar</span>
                    <span>${AurumCalc.formatCurrency(calc.estimatedValue)}</span>
                </div>
            </div>

            <p style="margin-top:var(--space-md); font-size:var(--font-size-xs); color:var(--color-text-muted);">
                ⚠ Esta es una operación de demostración. No genera comprobantes fiscales ni registros contables.
            </p>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: '✓ Confirmar compra', class: 'btn btn--success', action: () => {
                confirmPurchase(data, calc);
            }},
        ]);
    }

    function confirmPurchase(data, calc) {
        const client = AurumState.getClient(data.clientId);

        AurumState.addPurchase({
            clientId: data.clientId,
            clientName: client ? client.name : '—',
            pieceType: data.pieceType,
            pieceName: data.pieceName || '',
            karat: parseInt(data.karat),
            grossWeight: calc.grossWeight,
            nonGoldWeight: calc.nonGoldWeight,
            netWeight: calc.netWeight,
            pureWeight: calc.pureWeight,
            referencePrice: calc.pricePerGram,
            purchaseFactor: calc.purchaseFactor,
            estimatedValue: calc.estimatedValue,
            observations: data.observations || '',
        });

        AurumApp.closeModal();
        AurumApp.showToast('Compra registrada', `Se registró la compra por ${AurumCalc.formatCurrency(calc.estimatedValue)}.`, 'success');
        clearForm();
    }

    function clearForm() {
        const form = document.getElementById('purchase-form');
        if (form) {
            form.reset();
            AurumValidation.clearFormErrors(form);
            // Restore defaults
            const config = AurumState.getConfig();
            const refPriceEl = document.getElementById('purchase-ref-price');
            const factorEl = document.getElementById('purchase-factor');
            if (refPriceEl) refPriceEl.value = config.referencePrice;
            if (factorEl) factorEl.value = config.purchaseFactor;
            updateCalculation();
        }
    }

    return {
        render,
        clearForm,
    };
})();
