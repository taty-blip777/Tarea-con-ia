/**
 * AURUM POS — Calculations
 * Funciones de cálculo de valor del oro.
 */

const AurumCalc = (() => {
    /**
     * Calcula el peso neto = peso bruto - peso no aurífero.
     */
    function netWeight(grossWeight, nonGoldWeight) {
        const gw = parseFloat(grossWeight) || 0;
        const ngw = parseFloat(nonGoldWeight) || 0;
        return Math.max(0, gw - ngw);
    }

    /**
     * Calcula el peso de oro puro estimado = peso neto × (quilataje / 24).
     */
    function pureWeight(netWeightVal, karat) {
        const nw = parseFloat(netWeightVal) || 0;
        const k = parseFloat(karat) || 0;
        return nw * (k / 24);
    }

    /**
     * Calcula el valor estimado de compra:
     * valor = peso oro puro × precio por gramo × factor de compra
     */
    function purchaseValue(pureWeightVal, pricePerGram, purchaseFactor) {
        const pw = parseFloat(pureWeightVal) || 0;
        const ppg = parseFloat(pricePerGram) || 0;
        const pf = parseFloat(purchaseFactor) || 1;
        return pw * ppg * pf;
    }

    /**
     * Cálculo completo de compra.
     */
    function calculatePurchase(grossWeight, nonGoldWeight, karat, pricePerGram, purchaseFactor) {
        const nw = netWeight(grossWeight, nonGoldWeight);
        const pw = pureWeight(nw, karat);
        const value = purchaseValue(pw, pricePerGram, purchaseFactor);

        return {
            grossWeight: parseFloat(grossWeight) || 0,
            nonGoldWeight: parseFloat(nonGoldWeight) || 0,
            netWeight: nw,
            pureWeight: pw,
            pricePerGram: parseFloat(pricePerGram) || 0,
            purchaseFactor: parseFloat(purchaseFactor) || 1,
            estimatedValue: value,
        };
    }

    /**
     * Cálculo de venta.
     */
    function calculateSale(items, discount) {
        const subtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
        }, 0);
        const discountVal = parseFloat(discount) || 0;
        const total = Math.max(0, subtotal - discountVal);

        return { subtotal, discount: discountVal, total };
    }

    /**
     * Formato de moneda COP.
     */
    function formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    }

    /**
     * Formato de peso en gramos.
     */
    function formatWeight(value) {
        const num = parseFloat(value) || 0;
        return `${num.toFixed(3)} g`;
    }

    /**
     * Formato de fecha/hora local.
     */
    function formatDateTime(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    }

    /**
     * Formato de fecha.
     */
    function formatDate(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
        }).format(date);
    }

    return {
        netWeight,
        pureWeight,
        purchaseValue,
        calculatePurchase,
        calculateSale,
        formatCurrency,
        formatWeight,
        formatDateTime,
        formatDate,
    };
})();
