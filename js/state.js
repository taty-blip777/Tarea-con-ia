/**
 * AURUM POS — State Management
 * Gestión centralizada del estado de la aplicación.
 * Datos almacenados en memoria con opción de persistencia en localStorage.
 */

const AurumState = (() => {
    const STORAGE_KEY = 'aurum_pos_data';

    // Quilatajes disponibles
    const KARATS = [
        { value: 24, label: '24K', purity: 1.000 },
        { value: 22, label: '22K', purity: 22 / 24 },
        { value: 18, label: '18K', purity: 18 / 24 },
        { value: 14, label: '14K', purity: 14 / 24 },
        { value: 10, label: '10K', purity: 10 / 24 },
    ];

    // Tipos de pieza
    const PIECE_TYPES = [
        { value: 'anillo', label: 'Anillo', icon: '💍' },
        { value: 'cadena', label: 'Cadena', icon: '⛓' },
        { value: 'pulsera', label: 'Pulsera', icon: '📿' },
        { value: 'moneda', label: 'Moneda', icon: '🪙' },
        { value: 'lingote', label: 'Lingote', icon: '🟨' },
        { value: 'arete', label: 'Arete', icon: '✨' },
        { value: 'otro', label: 'Otro', icon: '📦' },
    ];

    // Métodos de pago
    const PAYMENT_METHODS = [
        { value: 'efectivo', label: 'Efectivo' },
        { value: 'transferencia', label: 'Transferencia bancaria' },
        { value: 'otro', label: 'Otro' },
    ];

    // Estado por defecto
    function getDefaultState() {
        return {
            config: {
                referencePrice: 280000,     // COP por gramo de oro puro (valor de prueba)
                currency: 'COP',
                weightUnit: 'gramos',
                purchaseFactor: 0.90,       // 90%
                allowedKarats: [24, 22, 18, 14, 10],
                referencePriceUpdated: new Date().toISOString(),
            },
            inventory: generateDemoInventory(),
            purchases: generateDemoPurchases(),
            sales: generateDemoSales(),
            clients: generateDemoClients(),
            nextPieceId: 100,
            nextOperationId: 200,
            nextClientId: 50,
        };
    }

    let state = getDefaultState();
    let listeners = [];

    // ---- Persistence ----
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Silenciar errores de almacenamiento
        }
    }

    function load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                state = { ...getDefaultState(), ...parsed };
                return true;
            }
        } catch (e) {
            // Silenciar errores
        }
        return false;
    }

    function reset() {
        state = getDefaultState();
        save();
        notifyAll();
    }

    // ---- Listeners ----
    function subscribe(fn) {
        listeners.push(fn);
        return () => {
            listeners = listeners.filter(l => l !== fn);
        };
    }

    function notifyAll() {
        listeners.forEach(fn => {
            try { fn(state); } catch (e) { console.error('State listener error:', e); }
        });
    }

    // ---- Config ----
    function getConfig() {
        return { ...state.config };
    }

    function updateConfig(updates) {
        state.config = { ...state.config, ...updates };
        save();
        notifyAll();
    }

    // ---- Inventory ----
    function getInventory() {
        return [...state.inventory];
    }

    function getAvailableInventory() {
        return state.inventory.filter(item => item.status === 'disponible');
    }

    function getInventoryItem(id) {
        return state.inventory.find(item => item.id === id) || null;
    }

    function addInventoryItem(item) {
        const newItem = {
            ...item,
            id: `P-${String(state.nextPieceId++).padStart(4, '0')}`,
            createdAt: new Date().toISOString(),
        };
        state.inventory.unshift(newItem);
        save();
        notifyAll();
        return newItem;
    }

    function updateInventoryItem(id, updates) {
        const idx = state.inventory.findIndex(item => item.id === id);
        if (idx !== -1) {
            state.inventory[idx] = { ...state.inventory[idx], ...updates };
            save();
            notifyAll();
            return state.inventory[idx];
        }
        return null;
    }

    // ---- Purchases ----
    function getPurchases() {
        return [...state.purchases];
    }

    function addPurchase(purchase) {
        const newPurchase = {
            ...purchase,
            id: `OP-${String(state.nextOperationId++).padStart(4, '0')}`,
            type: 'compra',
            date: new Date().toISOString(),
            status: 'completada',
        };
        state.purchases.unshift(newPurchase);

        // Agregar pieza al inventario automáticamente
        addInventoryItem({
            name: purchase.pieceName || `${purchase.pieceType} ${purchase.karat}K`,
            type: purchase.pieceType,
            karat: purchase.karat,
            weightGross: purchase.grossWeight,
            weightNet: purchase.netWeight,
            weightPure: purchase.pureWeight,
            estimatedPrice: purchase.estimatedValue,
            status: 'disponible',
            origin: 'compra',
            operationId: newPurchase.id,
            observations: purchase.observations || '',
        });

        save();
        notifyAll();
        return newPurchase;
    }

    // ---- Sales ----
    function getSales() {
        return [...state.sales];
    }

    function addSale(sale) {
        const newSale = {
            ...sale,
            id: `OP-${String(state.nextOperationId++).padStart(4, '0')}`,
            type: 'venta',
            date: new Date().toISOString(),
            status: 'completada',
        };
        state.sales.unshift(newSale);

        // Marcar piezas como vendidas
        if (sale.items && sale.items.length) {
            sale.items.forEach(item => {
                updateInventoryItem(item.id, { status: 'vendida' });
            });
        }

        save();
        notifyAll();
        return newSale;
    }

    // ---- Clients ----
    function getClients() {
        return [...state.clients];
    }

    function getClient(id) {
        return state.clients.find(c => c.id === id) || null;
    }

    function addClient(client) {
        const newClient = {
            ...client,
            id: `CL-${String(state.nextClientId++).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
        };
        state.clients.unshift(newClient);
        save();
        notifyAll();
        return newClient;
    }

    function updateClient(id, updates) {
        const idx = state.clients.findIndex(c => c.id === id);
        if (idx !== -1) {
            state.clients[idx] = { ...state.clients[idx], ...updates };
            save();
            notifyAll();
            return state.clients[idx];
        }
        return null;
    }

    // ---- Operations / History ----
    function getOperations() {
        const all = [
            ...state.purchases.map(p => ({ ...p, type: 'compra' })),
            ...state.sales.map(s => ({ ...s, type: 'venta' })),
        ];
        all.sort((a, b) => new Date(b.date) - new Date(a.date));
        return all;
    }

    // ---- Dashboard Stats ----
    function getStats() {
        const today = new Date().toDateString();

        const purchasesToday = state.purchases.filter(p =>
            new Date(p.date).toDateString() === today
        );

        const salesToday = state.sales.filter(s =>
            new Date(s.date).toDateString() === today
        );

        const totalPurchasesToday = purchasesToday.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
        const totalSalesToday = salesToday.reduce((sum, s) => sum + (s.total || 0), 0);

        return {
            purchasesCount: purchasesToday.length,
            purchasesTotal: totalPurchasesToday,
            salesCount: salesToday.length,
            salesTotal: totalSalesToday,
            operationsCount: purchasesToday.length + salesToday.length,
            inventoryCount: state.inventory.filter(i => i.status === 'disponible').length,
            recentOperations: getOperations().slice(0, 8),
        };
    }

    // ---- Demo Data Generators ----
    function generateDemoInventory() {
        return [
            { id: 'P-0001', name: 'Anillo solitario', type: 'anillo', karat: 18, weightGross: 4.5, weightNet: 4.5, weightPure: 3.375, estimatedPrice: 945000, status: 'disponible', origin: 'compra', createdAt: '2026-10-15T10:30:00', observations: '' },
            { id: 'P-0002', name: 'Cadena eslabón grueso', type: 'cadena', karat: 14, weightGross: 28.0, weightNet: 28.0, weightPure: 16.333, estimatedPrice: 4573333, status: 'disponible', origin: 'compra', createdAt: '2026-10-14T14:15:00', observations: 'Cadena de 60 cm' },
            { id: 'P-0003', name: 'Pulsera tejida', type: 'pulsera', karat: 18, weightGross: 12.3, weightNet: 12.3, weightPure: 9.225, estimatedPrice: 2583000, status: 'disponible', origin: 'compra', createdAt: '2026-10-14T09:00:00', observations: '' },
            { id: 'P-0004', name: 'Moneda Centenario', type: 'moneda', karat: 22, weightGross: 41.67, weightNet: 41.67, weightPure: 38.197, estimatedPrice: 10695250, status: 'reservada', origin: 'compra', createdAt: '2026-10-13T16:45:00', observations: 'Pieza de colección' },
            { id: 'P-0005', name: 'Lingote 10g', type: 'lingote', karat: 24, weightGross: 10.0, weightNet: 10.0, weightPure: 10.0, estimatedPrice: 2800000, status: 'disponible', origin: 'compra', createdAt: '2026-10-12T11:20:00', observations: 'Con certificado' },
            { id: 'P-0006', name: 'Aretes lágrima', type: 'arete', karat: 18, weightGross: 3.2, weightNet: 3.2, weightPure: 2.4, estimatedPrice: 672000, status: 'disponible', origin: 'compra', createdAt: '2026-10-12T08:30:00', observations: '' },
            { id: 'P-0007', name: 'Cadena cartier', type: 'cadena', karat: 10, weightGross: 15.0, weightNet: 15.0, weightPure: 6.25, estimatedPrice: 1750000, status: 'vendida', origin: 'compra', createdAt: '2026-10-10T15:00:00', observations: '' },
            { id: 'P-0008', name: 'Anillo alianza', type: 'anillo', karat: 14, weightGross: 5.8, weightNet: 5.8, weightPure: 3.383, estimatedPrice: 947333, status: 'disponible', origin: 'compra', createdAt: '2026-10-10T10:10:00', observations: 'Par de anillos' },
        ];
    }

    function generateDemoPurchases() {
        return [
            { id: 'OP-0001', type: 'compra', clientId: 'CL-001', clientName: 'Carlos Ramírez', pieceType: 'anillo', karat: 18, grossWeight: 4.5, nonGoldWeight: 0, netWeight: 4.5, pureWeight: 3.375, referencePrice: 280000, purchaseFactor: 0.90, estimatedValue: 850500, observations: '', date: '2026-10-15T10:30:00', status: 'completada' },
            { id: 'OP-0002', type: 'compra', clientId: 'CL-002', clientName: 'Ana Martínez', pieceType: 'cadena', karat: 14, grossWeight: 28.0, nonGoldWeight: 0, netWeight: 28.0, pureWeight: 16.333, referencePrice: 280000, purchaseFactor: 0.90, estimatedValue: 4116000, observations: 'Cadena 60cm', date: '2026-10-14T14:15:00', status: 'completada' },
            { id: 'OP-0003', type: 'compra', clientId: 'CL-003', clientName: 'Luis Torres', pieceType: 'lingote', karat: 24, grossWeight: 10.0, nonGoldWeight: 0, netWeight: 10.0, pureWeight: 10.0, referencePrice: 280000, purchaseFactor: 0.90, estimatedValue: 2520000, observations: 'Con certificado', date: '2026-10-12T11:20:00', status: 'completada' },
        ];
    }

    function generateDemoSales() {
        return [
            { id: 'OP-0004', type: 'venta', clientId: 'CL-004', clientName: 'María López', items: [{ id: 'P-0007', name: 'Cadena cartier', price: 1750000, quantity: 1 }], subtotal: 1750000, discount: 0, total: 1750000, paymentMethod: 'efectivo', date: '2026-10-16T14:00:00', status: 'completada' },
        ];
    }

    function generateDemoClients() {
        return [
            { id: 'CL-001', name: 'Carlos Ramírez', documentType: 'CC', documentNumber: '1234567890', phone: '3001234567', email: 'carlos@email.com', observations: '', createdAt: '2026-10-10T08:00:00' },
            { id: 'CL-002', name: 'Ana Martínez', documentType: 'CC', documentNumber: '9876543210', phone: '3109876543', email: '', observations: '', createdAt: '2026-10-11T09:00:00' },
            { id: 'CL-003', name: 'Luis Torres', documentType: 'CC', documentNumber: '5555555555', phone: '3205551234', email: 'luis.torres@email.com', observations: 'Cliente frecuente', createdAt: '2026-10-12T10:00:00' },
            { id: 'CL-004', name: 'María López', documentType: 'CC', documentNumber: '1111222233', phone: '3151112222', email: '', observations: '', createdAt: '2026-10-13T11:00:00' },
            { id: 'CL-005', name: 'Jorge Pérez', documentType: 'CE', documentNumber: '4444333322', phone: '3004443333', email: 'jorge.perez@email.com', observations: '', createdAt: '2026-10-14T12:00:00' },
        ];
    }

    // ---- Init ----
    function init() {
        if (!load()) {
            save();
        }
    }

    // Public API
    return {
        init,
        reset,
        subscribe,
        getConfig,
        updateConfig,
        getInventory,
        getAvailableInventory,
        getInventoryItem,
        addInventoryItem,
        updateInventoryItem,
        getPurchases,
        addPurchase,
        getSales,
        addSale,
        getClients,
        getClient,
        addClient,
        updateClient,
        getOperations,
        getStats,
        KARATS,
        PIECE_TYPES,
        PAYMENT_METHODS,
    };
})();
