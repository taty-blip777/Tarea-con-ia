/**
 * AURUM POS — Authentication & Role-Based Access Control (RBAC) Module
 * Control de acceso por rangos: CEO, Administrador, Responsable de Inventario, Vendedor/Cajero.
 * Reglas de seguridad:
 * - Pantalla de bloqueo obligatoria: no se muestra el POS sin iniciar sesión o registrarse.
 * - Registro con rol protegido: asignado por el CEO / Administración.
 * - Validación de contraseña: 4-16 caracteres, mín. 1 mayúscula, mín. 1 carácter especial.
 * - Usuario CEO con privilegios absolutos para editar cualquier parámetro y reasignar roles.
 */

const AuthModule = (() => {
    const STORAGE_USERS_KEY = 'aurum_pos_users';
    const STORAGE_AUTH_KEY = 'aurum_pos_auth_user';

    // Reglas de contraseña
    const PASSWORD_RULES = {
        min: 4,
        max: 16,
        hasUppercase: /[A-Z]/,
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/
    };

    // Definición de Roles y Permisos en el POS
    const ROLES = {
        ceo: {
            id: 'ceo',
            label: 'CEO / Director General',
            badgeClass: 'badge--ceo',
            icon: '👑',
            allowedPages: ['dashboard', 'purchases', 'sales', 'inventory', 'clients', 'history', 'settings', 'users', 'profile'],
            canEditConfig: true,
            canResetData: true,
            canManageRoles: true,
            canEditInventory: true,
            canTransact: true,
            description: 'Acceso y control absoluto sobre todos los módulos, parámetros, finanzas y asignación de rangos de personal.'
        },
        admin: {
            id: 'admin',
            label: 'Administrador General',
            badgeClass: 'badge--gold',
            icon: '🛡️',
            allowedPages: ['dashboard', 'purchases', 'sales', 'inventory', 'clients', 'history', 'settings', 'profile'],
            canEditConfig: true,
            canResetData: false,
            canManageRoles: false,
            canEditInventory: true,
            canTransact: true,
            description: 'Gestión operativa, auditoría, configuración de precios de referencia y control de clientes e inventario.'
        },
        inventario: {
            id: 'inventario',
            label: 'Responsable de Inventario',
            badgeClass: 'badge--info',
            icon: '📦',
            allowedPages: ['dashboard', 'inventory', 'history', 'profile'],
            canEditConfig: false,
            canResetData: false,
            canManageRoles: false,
            canEditInventory: true,
            canTransact: false,
            description: 'Control de bóveda, clasificación de piezas, pesaje, quilatajes y trazabilidad del catálogo de oro.'
        },
        cajero: {
            id: 'cajero',
            label: 'Vendedor / Cajero',
            badgeClass: 'badge--success',
            icon: '👤',
            allowedPages: ['dashboard', 'purchases', 'sales', 'inventory', 'clients', 'history', 'profile'],
            canEditConfig: false,
            canResetData: false,
            canManageRoles: false,
            canEditInventory: false,
            canTransact: true,
            description: 'Atención directa en mostrador, compra de oro, cálculo de tasación, liquidación de ventas y clientes.'
        }
    };

    // Usuarios predeterminados con claves conformes a las reglas (4-16 chars, 1 mayúscula, 1 carácter especial)
    const DEFAULT_USERS = [
        {
            id: 'USR-000',
            name: 'Alexander Gold',
            email: 'ceo@aurumpos.com',
            password: 'Ceo@2026',
            role: 'ceo',
            roleLabel: 'CEO / Director General',
            documentType: 'CC',
            documentNumber: '1000000001',
            phone: '300 999 8888',
            avatar: '👑',
            badgeClass: 'badge--ceo',
            icon: '👑',
            createdAt: '2026-01-01T08:00:00Z',
            permissions: [
                'Permisos absolutos para editar cualquier parámetro del sistema',
                'Gestión y reasignación de roles de cualquier usuario',
                'Modificación del precio de referencia de oro y factores de compra',
                'Aprobación, anulación y auditoría de todas las operaciones',
                'Control total de inventario y restablecimiento de datos'
            ]
        },
        {
            id: 'USR-001',
            name: 'Sofía Valenzuela',
            email: 'admin@aurumpos.com',
            password: 'Admin@123',
            role: 'admin',
            roleLabel: 'Administradora General',
            documentType: 'CC',
            documentNumber: '1023456789',
            phone: '310 987 6543',
            avatar: 'SV',
            badgeClass: 'badge--gold',
            icon: '🛡️',
            createdAt: '2026-08-15T09:30:00Z',
            permissions: [
                'Supervisión y control administrativo del POS',
                'Modificación del precio de referencia de oro puro',
                'Ajuste del factor comercial de compra y quilatajes',
                'Auditoría y consulta completa de movimientos'
            ]
        },
        {
            id: 'USR-002',
            name: 'Carlos Mendoza',
            email: 'cajero@aurumpos.com',
            password: 'Cajero@123',
            role: 'cajero',
            roleLabel: 'Vendedor / Cajero',
            documentType: 'CC',
            documentNumber: '1098765432',
            phone: '301 234 5678',
            avatar: 'CM',
            badgeClass: 'badge--success',
            icon: '👤',
            createdAt: '2026-09-01T08:00:00Z',
            permissions: [
                'Recepción y compra de oro en mostrador',
                'Registro y liquidación de operaciones de venta',
                'Alta y consulta de clientes de mostrador',
                'Consulta de piezas disponibles en catálogo'
            ]
        },
        {
            id: 'USR-003',
            name: 'Mateo Ríos',
            email: 'inventario@aurumpos.com',
            password: 'Stock@123',
            role: 'inventario',
            roleLabel: 'Responsable de Inventario',
            documentType: 'CC',
            documentNumber: '1034567890',
            phone: '315 789 0123',
            avatar: 'MR',
            badgeClass: 'badge--info',
            icon: '📦',
            createdAt: '2026-09-10T11:00:00Z',
            permissions: [
                'Custodia de bóveda y pesaje de piezas',
                'Gestión de piezas, quilataje y estados de inventario',
                'Reserva y actualización del catálogo de inventario',
                'Historial de trazabilidad de compras y ventas'
            ]
        }
    ];

    let users = [];
    let currentUser = null;
    let currentAuthTab = 'login'; // 'login' | 'register'

    // ---- Validación de Contraseña ----
    function validatePassword(password) {
        const pass = String(password || '');
        const hasMin = pass.length >= PASSWORD_RULES.min;
        const hasMax = pass.length <= PASSWORD_RULES.max;
        const hasUpper = PASSWORD_RULES.hasUppercase.test(pass);
        const hasSpec = PASSWORD_RULES.hasSpecial.test(pass);

        const valid = hasMin && hasMax && hasUpper && hasSpec;
        const errors = [];
        if (!hasMin) errors.push(`Mínimo ${PASSWORD_RULES.min} caracteres.`);
        if (!hasMax) errors.push(`Máximo ${PASSWORD_RULES.max} caracteres.`);
        if (!hasUpper) errors.push('Al menos 1 letra mayúscula (A-Z).');
        if (!hasSpec) errors.push('Al menos 1 carácter especial (!@#$%^&*...).');

        return {
            valid,
            errors,
            hasLength: hasMin && hasMax,
            hasUppercase: hasUpper,
            hasSpecial: hasSpec
        };
    }

    // ---- Inicialización y Carga ----
    function init() {
        loadUsers();
        loadSession();
        enforceAccessControl();
    }

    function loadUsers() {
        try {
            const raw = localStorage.getItem(STORAGE_USERS_KEY);
            if (raw) {
                users = JSON.parse(raw);
                // Asegurar que el usuario CEO y claves actualizadas existan siempre
                let updated = false;
                DEFAULT_USERS.forEach(defUser => {
                    const existingIdx = users.findIndex(u => u.email.toLowerCase() === defUser.email.toLowerCase());
                    if (existingIdx === -1) {
                        users.unshift(defUser);
                        updated = true;
                    } else if (users[existingIdx].role === defUser.role && users[existingIdx].password !== defUser.password) {
                        users[existingIdx].password = defUser.password;
                        updated = true;
                    }
                });
                if (updated) saveUsers();
            } else {
                users = [...DEFAULT_USERS];
                saveUsers();
            }
        } catch (e) {
            console.error('Error cargando usuarios:', e);
            users = [...DEFAULT_USERS];
        }
    }

    function saveUsers() {
        try {
            localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        } catch (e) {
            console.error('Error guardando usuarios:', e);
        }
    }

    function loadSession() {
        try {
            const raw = localStorage.getItem(STORAGE_AUTH_KEY);
            if (raw) {
                currentUser = JSON.parse(raw);
                // Sincronizar datos por si su rol fue modificado por el CEO
                const refreshed = users.find(u => u.id === currentUser.id || u.email === currentUser.email);
                if (refreshed) {
                    currentUser = refreshed;
                    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(refreshed));
                }
            } else {
                currentUser = null;
            }
        } catch (e) {
            currentUser = null;
        }
    }

    function saveSession(user) {
        currentUser = user;
        try {
            if (user) {
                localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(STORAGE_AUTH_KEY);
            }
        } catch (e) {
            console.error('Error guardando sesión:', e);
        }
        enforceAccessControl();
    }

    // ---- Control de Acceso y Visibilidad de Pantalla ----
    function enforceAccessControl() {
        const portal = document.getElementById('auth-portal');
        const appShell = document.getElementById('app-shell');

        if (!currentUser) {
            // BLOQUEO TOTAL: No muestra el POS sin registrarse o loguearse
            if (appShell) appShell.style.display = 'none';
            if (portal) {
                portal.style.display = 'flex';
                renderAuthPortal(portal);
            }
        } else {
            // Usuario autenticado: Mostrar POS y ocultar portal de bloqueo
            if (portal) portal.style.display = 'none';
            if (appShell) appShell.style.display = 'flex';
            applyRolePermissionsToUI();
            updateSidebarUserWidget();
            updateHeaderUserBadge();
        }
    }

    // ---- Aplicación de Permisos por Rol en Menú y UI ----
    function applyRolePermissionsToUI() {
        if (!currentUser) return;
        const roleConfig = ROLES[currentUser.role] || ROLES.cajero;

        // Visibilidad de botones en sidebar
        const navPurchases = document.getElementById('nav-purchases');
        const navSales = document.getElementById('nav-sales');
        const navClients = document.getElementById('nav-clients');
        const navInventory = document.getElementById('nav-inventory');
        const navHistory = document.getElementById('nav-history');
        const navSettings = document.getElementById('nav-settings');
        const navUsers = document.getElementById('nav-users');

        // Sección títulos
        const titleOps = document.getElementById('section-title-ops');
        const titleMgmt = document.getElementById('section-title-mgmt');
        const titleSys = document.getElementById('section-title-sys');

        // Compras y Ventas (Solo CEO, Admin y Vendedor)
        const canTransact = roleConfig.canTransact;
        if (navPurchases) navPurchases.style.display = canTransact ? 'flex' : 'none';
        if (navSales) navSales.style.display = canTransact ? 'flex' : 'none';
        if (titleOps) titleOps.style.display = canTransact ? 'block' : 'none';

        // Clientes (Solo CEO, Admin y Vendedor)
        if (navClients) navClients.style.display = (currentUser.role !== 'inventario') ? 'flex' : 'none';

        // Inventario e Historial (Todos los roles acceden)
        if (navInventory) navInventory.style.display = 'flex';
        if (navHistory) navHistory.style.display = 'flex';

        // Configuración (Solo CEO y Admin)
        const canConfig = roleConfig.canEditConfig;
        if (navSettings) navSettings.style.display = canConfig ? 'flex' : 'none';

        // Gestión de Roles (EXCLUSIVO DEL CEO)
        const isCeo = currentUser.role === 'ceo';
        if (navUsers) navUsers.style.display = isCeo ? 'flex' : 'none';

        if (titleSys) titleSys.style.display = (canConfig || isCeo) ? 'block' : 'none';

        // Enlazar evento de logout en sidebar
        const logoutBtn = document.getElementById('nav-logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.stopPropagation();
                confirmLogout();
            };
        }
    }

    function canAccess(page) {
        if (!currentUser) return false;
        const roleConfig = ROLES[currentUser.role] || ROLES.cajero;
        return roleConfig.allowedPages.includes(page);
    }

    function getCurrentUser() {
        return currentUser;
    }

    function getUsers() {
        return [...users];
    }

    // ---- Métodos de Autenticación ----
    function login(email, password) {
        const cleanEmail = String(email || '').trim().toLowerCase();
        const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

        if (!user) {
            return {
                success: false,
                message: 'Credenciales inválidas. Comprueba tu correo y contraseña.'
            };
        }

        saveSession(user);
        return { success: true, user };
    }

    function quickLogin(email) {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            saveSession(user);
            AurumApp.showToast('Acceso Autorizado', `Bienvenido, ${user.name} (${user.roleLabel})`, 'success');
            AurumApp.navigateTo('dashboard');
            return true;
        }
        return false;
    }

    function logout() {
        const prev = currentUser;
        saveSession(null);
        AurumApp.showToast('Sesión Finalizada', prev ? `Hasta luego, ${prev.name}.` : 'Has salido del sistema.', 'info');
    }

    function confirmLogout() {
        AurumApp.showModal('Cerrar Sesión', `
            <div style="text-align:center; padding:var(--space-md) 0;">
                <div style="font-size:2.5rem; margin-bottom:var(--space-sm);">🚪</div>
                <h4 style="margin-bottom:var(--space-sm);">¿Confirmas el cierre de tu sesión?</h4>
                <p style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">
                    Usuario activo: <strong>${currentUser ? currentUser.name : ''}</strong> (${currentUser ? currentUser.roleLabel : ''}).
                    La pantalla se bloqueará hasta que vuelvas a autenticarte.
                </p>
            </div>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: 'Cerrar sesión', class: 'btn btn--danger', action: () => {
                AurumApp.closeModal();
                logout();
            }}
        ]);
    }

    // ---- Registro de Usuario (Rol protegido: nadie puede elegir su rol) ----
    function register(userData) {
        const cleanEmail = String(userData.email || '').trim().toLowerCase();

        if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
            return {
                success: false,
                message: 'Ya existe una cuenta registrada con este correo electrónico.'
            };
        }

        // Validación estricta de contraseña
        const passCheck = validatePassword(userData.password);
        if (!passCheck.valid) {
            return {
                success: false,
                message: 'La contraseña no cumple los requisitos: ' + passCheck.errors.join(' ')
            };
        }

        if (userData.password !== userData.confirmPassword) {
            return {
                success: false,
                message: 'Las contraseñas no coinciden.'
            };
        }

        // REQUISITO: "que no te deje elejir cual es tu rol. eso lo elije otra persona."
        // Por defecto, cualquier registro nuevo inicia como Vendedor / Operador base
        const assignedRole = 'cajero';
        const roleInfo = ROLES[assignedRole];

        const nameParts = userData.name.trim().split(' ');
        const avatar = nameParts.length > 1
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
            : userData.name.substring(0, 2).toUpperCase();

        const newUser = {
            id: `USR-${String(users.length + 1).padStart(3, '0')}`,
            name: userData.name.trim(),
            email: cleanEmail,
            password: userData.password,
            role: assignedRole,
            roleLabel: roleInfo.label,
            documentType: userData.documentType || 'CC',
            documentNumber: userData.documentNumber || '',
            phone: userData.phone || '',
            avatar: avatar,
            badgeClass: roleInfo.badgeClass,
            icon: roleInfo.icon,
            createdAt: new Date().toISOString(),
            permissions: [
                'Recepción y compra de oro en mostrador',
                'Registro y liquidación de operaciones de venta',
                'Alta y consulta de clientes de mostrador',
                'Consulta de piezas disponibles en catálogo'
            ]
        };

        users.push(newUser);
        saveUsers();
        saveSession(newUser);
        return { success: true, user: newUser };
    }

    // ---- Gestión de Roles por el CEO ----
    function changeUserRole(userId, newRole) {
        if (!currentUser || currentUser.role !== 'ceo') {
            AurumApp.showToast('Acceso Denegado', 'Solo el CEO tiene autorización para cambiar los roles de los usuarios.', 'error');
            return false;
        }

        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) return false;

        const roleConfig = ROLES[newRole];
        if (!roleConfig) return false;

        // Evitar que el CEO se auto-despoje del rol si no hay otro CEO
        if (targetUser.id === currentUser.id && newRole !== 'ceo') {
            const otherCeos = users.filter(u => u.role === 'ceo' && u.id !== currentUser.id);
            if (otherCeos.length === 0) {
                AurumApp.showToast('Acción no permitida', 'Debe existir al menos un CEO activo en el sistema.', 'warning');
                return false;
            }
        }

        targetUser.role = newRole;
        targetUser.roleLabel = roleConfig.label;
        targetUser.badgeClass = roleConfig.badgeClass;
        targetUser.icon = roleConfig.icon;
        targetUser.avatar = newRole === 'ceo' ? '👑' : targetUser.avatar;

        saveUsers();

        // Si se cambió el rol del usuario en sesión actual, actualizar sesión
        if (currentUser.id === targetUser.id) {
            currentUser = targetUser;
            localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(targetUser));
            applyRolePermissionsToUI();
            updateSidebarUserWidget();
            updateHeaderUserBadge();
        }

        AurumApp.showToast('Rol Actualizado', `El rol de ${targetUser.name} ha sido cambiado a: ${roleConfig.label}.`, 'success');
        renderUsersManagement();
        return true;
    }

    function resetUserPassword(userId) {
        if (!currentUser || currentUser.role !== 'ceo') return;
        const target = users.find(u => u.id === userId);
        if (!target) return;

        const tempPass = 'Aurum@2026';
        target.password = tempPass;
        saveUsers();
        AurumApp.showModal('Contraseña Restablecida', `
            <div style="text-align:center; padding:var(--space-md) 0;">
                <div style="font-size:2.5rem; margin-bottom:var(--space-sm);">🔑</div>
                <h4 style="margin-bottom:var(--space-xs);">Clave temporal asignada</h4>
                <p style="font-size:var(--font-size-sm); color:var(--color-text-secondary); margin-bottom:var(--space-md);">
                    Para el usuario <strong>${target.name}</strong> (${target.email}):
                </p>
                <div style="font-family:var(--font-mono); font-size:1.3rem; font-weight:700; color:var(--color-gold); background:var(--color-gold-bg); padding:var(--space-sm); border-radius:var(--radius-md); border:1px dashed var(--color-gold-border);">
                    ${tempPass}
                </div>
                <p style="font-size:var(--font-size-xs); color:var(--color-text-muted); margin-top:var(--space-sm);">
                    Cumple con los requisitos de seguridad (Mayúscula, especial, 10 caracteres).
                </p>
            </div>
        `, [
            { label: 'Entendido', class: 'btn btn--primary', action: 'close' }
        ]);
    }

    function deleteUser(userId) {
        if (!currentUser || currentUser.role !== 'ceo') return;
        if (userId === currentUser.id) {
            AurumApp.showToast('Operación no permitida', 'No puedes eliminar tu propia cuenta en sesión.', 'warning');
            return;
        }

        const target = users.find(u => u.id === userId);
        if (!target) return;

        AurumApp.showModal('Eliminar Operador', `
            <p>¿Estás seguro de que deseas eliminar permanentemente a <strong>${target.name}</strong> (${target.roleLabel})?</p>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: 'Eliminar', class: 'btn btn--danger', action: () => {
                users = users.filter(u => u.id !== userId);
                saveUsers();
                AurumApp.closeModal();
                AurumApp.showToast('Usuario Eliminado', `Se retiró a ${target.name} del sistema.`, 'info');
                renderUsersManagement();
            }}
        ]);
    }

    // ---- Renderizado del Portal de Bloqueo / Autenticación ----
    function renderAuthPortal(container) {
        container.innerHTML = `
            <div class="auth-layout" style="width: 100%; max-width: 1100px;">
                <div class="auth-card">
                    <!-- Cabecera de Marca -->
                    <div class="auth-header">
                        <div class="auth-header__logo">Au</div>
                        <div class="auth-header__title">AURUM POS</div>
                        <div class="auth-header__subtitle">Control de Acceso y Seguridad de Operaciones</div>
                    </div>

                    <!-- Selector de Pestañas -->
                    <div class="auth-tabs" role="tablist">
                        <button type="button" class="auth-tab ${currentAuthTab === 'login' ? 'active' : ''}" id="portal-tab-login">
                            <span>🔑 Iniciar Sesión</span>
                        </button>
                        <button type="button" class="auth-tab ${currentAuthTab === 'register' ? 'active' : ''}" id="portal-tab-register">
                            <span>📝 Registrarse</span>
                        </button>
                    </div>

                    <!-- Formulario Activo -->
                    <div class="auth-body" id="portal-auth-body">
                        ${currentAuthTab === 'login' ? getLoginFormHtml() : getRegisterFormHtml()}
                    </div>
                </div>

                <!-- Panel Lateral: Perfiles Demo Autorizados -->
                <div class="demo-profiles-panel">
                    <div class="demo-profiles-panel__header">
                        <div class="demo-profiles-panel__badge">⚡ ACCESO DEMOSTRATIVO DIRECTO</div>
                        <h3 class="demo-profiles-panel__title">Perfiles con Roles Diferenciados</h3>
                        <p class="demo-profiles-panel__desc">Haz clic en cualquier rango para probar de inmediato las funciones y restricciones de cada perfil:</p>
                    </div>

                    <div class="demo-profiles-list">
                        ${DEFAULT_USERS.map(u => `
                            <div class="demo-profile-card" onclick="AuthModule.quickLogin('${u.email}')" role="button" tabindex="0">
                                <div class="demo-profile-card__avatar ${u.role === 'ceo' ? 'user-cell__avatar--ceo' : ''}">${u.avatar}</div>
                                <div class="demo-profile-card__info">
                                    <div class="demo-profile-card__name">${u.name}</div>
                                    <div class="demo-profile-card__meta">
                                        <span class="badge ${u.badgeClass}">${u.roleLabel}</span>
                                        <span class="demo-profile-card__email">${u.email}</span>
                                    </div>
                                    <div class="demo-profile-card__note">Clave: <code>${u.password}</code> — ${u.permissions[0]}</div>
                                </div>
                                <div class="demo-profile-card__action">
                                    <span class="btn btn--sm ${u.role === 'ceo' ? 'btn--primary' : 'btn--secondary'}">Entrar →</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="demo-profiles-panel__footer">
                        <p>🔒 <strong>Seguridad activa:</strong> Todas las contraseñas cumplen la regla: entre 4 y 16 caracteres, mínimo 1 mayúscula y 1 carácter especial.</p>
                    </div>
                </div>
            </div>
        `;

        setupPortalEvents(container);
    }

    function getLoginFormHtml() {
        return `
            <form id="portal-login-form" class="auth-form" novalidate>
                <div class="auth-notice" id="login-alert" style="display:none;" role="alert"></div>

                <div class="form-group">
                    <label for="login-email" class="form-label form-label--required">Correo electrónico de operador</label>
                    <div class="input-with-icon">
                        <span class="input-icon">✉️</span>
                        <input type="email" id="login-email" name="email" class="form-input" placeholder="ejemplo@aurumpos.com" required autocomplete="username">
                    </div>
                </div>

                <div class="form-group">
                    <div class="form-label-row">
                        <label for="login-password" class="form-label form-label--required">Contraseña</label>
                        <button type="button" class="btn-link" onclick="AuthModule.showForgotPasswordModal()">¿Olvidaste tu clave?</button>
                    </div>
                    <div class="input-with-icon password-input-wrap">
                        <span class="input-icon">🔒</span>
                        <input type="password" id="login-password" name="password" class="form-input" placeholder="Ingresa tu contraseña" required autocomplete="current-password">
                        <button type="button" class="password-toggle-btn" onclick="AuthModule.togglePasswordVisibility('login-password', this)">👁️</button>
                    </div>
                </div>

                <button type="submit" class="btn btn--primary btn--full btn--lg auth-submit-btn">
                    <span>Desbloquear y Acceder al POS</span>
                    <span aria-hidden="true">→</span>
                </button>

                <div class="auth-switch-prompt">
                    <span>¿No tienes cuenta de operador?</span>
                    <button type="button" class="btn-link font-bold" onclick="AuthModule.switchTab('register')">Solicitar registro aquí</button>
                </div>
            </form>
        `;
    }

    function getRegisterFormHtml() {
        return `
            <form id="portal-register-form" class="auth-form" novalidate>
                <div class="auth-notice" id="register-alert" style="display:none;" role="alert"></div>

                <!-- Notificación de rol asignado externamente -->
                <div class="auth-role-notice">
                    <span class="auth-role-notice__icon">🛡️</span>
                    <div>
                        <div class="auth-role-notice__title">Asignación de Rol Protegida</div>
                        <div class="auth-role-notice__text">
                            Por políticas de seguridad de AURUM POS, los operadores no eligen su rango.
                            Tu registro iniciará con el perfil base <strong>Vendedor / Cajero</strong>.
                            El <strong>CEO</strong> o Administrador gestionará y elevará tu rol posteriormente desde el panel directivo.
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="reg-name" class="form-label form-label--required">Nombre completo</label>
                    <div class="input-with-icon">
                        <span class="input-icon">👤</span>
                        <input type="text" id="reg-name" name="name" class="form-input" placeholder="Ej: Marcela Trujillo" required autocomplete="name">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="reg-email" class="form-label form-label--required">Correo corporativo</label>
                        <div class="input-with-icon">
                            <span class="input-icon">✉️</span>
                            <input type="email" id="reg-email" name="email" class="form-input" placeholder="marcela@aurumpos.com" required autocomplete="email">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reg-phone" class="form-label">Teléfono</label>
                        <div class="input-with-icon">
                            <span class="input-icon">📱</span>
                            <input type="tel" id="reg-phone" name="phone" class="form-input" placeholder="300 123 4567" autocomplete="tel">
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="reg-doc-type" class="form-label form-label--required">Documento</label>
                        <select id="reg-doc-type" name="documentType" class="form-select">
                            <option value="CC" selected>Cédula de Ciudadanía (CC)</option>
                            <option value="CE">Cédula de Extranjería (CE)</option>
                            <option value="PAS">Pasaporte</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reg-doc-number" class="form-label form-label--required">Número</label>
                        <input type="text" id="reg-doc-number" name="documentNumber" class="form-input" placeholder="Ej: 1088765432" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="reg-password" class="form-label form-label--required">Contraseña</label>
                        <div class="input-with-icon password-input-wrap">
                            <span class="input-icon">🔒</span>
                            <input type="password" id="reg-password" name="password" class="form-input" placeholder="4 a 16 caracteres" required autocomplete="new-password">
                            <button type="button" class="password-toggle-btn" onclick="AuthModule.togglePasswordVisibility('reg-password', this)">👁️</button>
                        </div>

                        <!-- Lista de verificación en vivo de requisitos -->
                        <div class="password-rules-box" id="reg-rules-box">
                            <div class="password-rules-title">Requisitos obligatorios:</div>
                            <ul class="password-rules-list">
                                <li id="rule-length" class="rule-item">
                                    <span class="rule-icon">○</span>
                                    <span>Entre 4 y 16 caracteres</span>
                                </li>
                                <li id="rule-upper" class="rule-item">
                                    <span class="rule-icon">○</span>
                                    <span>Mínimo 1 letra mayúscula (A-Z)</span>
                                </li>
                                <li id="rule-special" class="rule-item">
                                    <span class="rule-icon">○</span>
                                    <span>Mínimo 1 carácter especial (!@#$%^&*...)</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="reg-confirm" class="form-label form-label--required">Confirmar contraseña</label>
                        <div class="input-with-icon password-input-wrap">
                            <span class="input-icon">🔒</span>
                            <input type="password" id="reg-confirm" name="confirmPassword" class="form-input" placeholder="Repite la contraseña" required autocomplete="new-password">
                            <button type="button" class="password-toggle-btn" onclick="AuthModule.togglePasswordVisibility('reg-confirm', this)">👁️</button>
                        </div>
                        <span class="form-hint" id="reg-match-msg"></span>
                    </div>
                </div>

                <div class="form-group form-check-row">
                    <label class="custom-checkbox">
                        <input type="checkbox" id="reg-terms" name="terms" required>
                        <span class="checkbox-box"></span>
                        <span class="checkbox-label">Declaro conocer los protocolos de custodia, arqueo y pesaje de AURUM POS</span>
                    </label>
                </div>

                <button type="submit" class="btn btn--primary btn--full btn--lg auth-submit-btn" id="reg-submit-btn">
                    <span>Crear Cuenta de Operador</span>
                    <span aria-hidden="true">✓</span>
                </button>

                <div class="auth-switch-prompt">
                    <span>¿Ya dispones de una cuenta?</span>
                    <button type="button" class="btn-link font-bold" onclick="AuthModule.switchTab('login')">Inicia sesión aquí</button>
                </div>
            </form>
        `;
    }

    function setupPortalEvents(container) {
        const tabLogin = container.querySelector('#portal-tab-login');
        const tabRegister = container.querySelector('#portal-tab-register');

        tabLogin?.addEventListener('click', () => switchTab('login'));
        tabRegister?.addEventListener('click', () => switchTab('register'));

        // Eventos de formulario de Login
        const loginForm = container.querySelector('#portal-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = loginForm.email.value.trim();
                const password = loginForm.password.value;
                const alertBox = loginForm.querySelector('#login-alert');

                if (!email || !password) {
                    showNotice(alertBox, 'Por favor ingresa tu correo y contraseña.', 'error');
                    return;
                }

                const res = login(email, password);
                if (res.success) {
                    AurumApp.showToast('Acceso Correcto', `Bienvenido, ${res.user.name}. Rango: ${res.user.roleLabel}`, 'success');
                    AurumApp.navigateTo('dashboard');
                } else {
                    showNotice(alertBox, res.message, 'error');
                }
            });
        }

        // Eventos de formulario de Registro con validación interactiva
        const regForm = container.querySelector('#portal-register-form');
        if (regForm) {
            const passInput = regForm.querySelector('#reg-password');
            const confirmInput = regForm.querySelector('#reg-confirm');

            const updateValidationUI = () => {
                const pass = passInput?.value || '';
                const confirm = confirmInput?.value || '';
                const check = validatePassword(pass);

                const itemLength = container.querySelector('#rule-length');
                const itemUpper = container.querySelector('#rule-upper');
                const itemSpecial = container.querySelector('#rule-special');
                const rulesBox = container.querySelector('#reg-rules-box');

                if (itemLength) {
                    itemLength.className = `rule-item ${check.hasLength ? 'valid' : ''}`;
                    itemLength.querySelector('.rule-icon').textContent = check.hasLength ? '✓' : '○';
                }
                if (itemUpper) {
                    itemUpper.className = `rule-item ${check.hasUppercase ? 'valid' : ''}`;
                    itemUpper.querySelector('.rule-icon').textContent = check.hasUppercase ? '✓' : '○';
                }
                if (itemSpecial) {
                    itemSpecial.className = `rule-item ${check.hasSpecial ? 'valid' : ''}`;
                    itemSpecial.querySelector('.rule-icon').textContent = check.hasSpecial ? '✓' : '○';
                }
                if (rulesBox) {
                    rulesBox.classList.toggle('all-valid', check.valid);
                }

                const matchMsg = container.querySelector('#reg-match-msg');
                if (matchMsg && confirm) {
                    if (pass === confirm) {
                        matchMsg.textContent = '✓ Las contraseñas coinciden';
                        matchMsg.style.color = 'var(--color-success)';
                    } else {
                        matchMsg.textContent = '✗ Las contraseñas no coinciden';
                        matchMsg.style.color = 'var(--color-error)';
                    }
                } else if (matchMsg) {
                    matchMsg.textContent = '';
                }
            };

            passInput?.addEventListener('input', updateValidationUI);
            confirmInput?.addEventListener('input', updateValidationUI);

            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const alertBox = regForm.querySelector('#register-alert');
                const name = regForm.name.value.trim();
                const email = regForm.email.value.trim();
                const phone = regForm.phone.value.trim();
                const documentType = regForm.documentType.value;
                const documentNumber = regForm.documentNumber.value.trim();
                const password = regForm.password.value;
                const confirmPassword = regForm.confirmPassword.value;
                const terms = regForm.terms.checked;

                if (!name || !email || !documentNumber || !password) {
                    showNotice(alertBox, 'Por favor diligencia todos los campos obligatorios (*).', 'error');
                    return;
                }

                const passCheck = validatePassword(password);
                if (!passCheck.valid) {
                    showNotice(alertBox, 'La contraseña no cumple los requisitos: ' + passCheck.errors.join(' '), 'error');
                    return;
                }

                if (password !== confirmPassword) {
                    showNotice(alertBox, 'Las contraseñas no coinciden.', 'error');
                    return;
                }

                if (!terms) {
                    showNotice(alertBox, 'Debes aceptar los protocolos operativos para continuar.', 'warning');
                    return;
                }

                const res = register({
                    name, email, phone, documentType, documentNumber, password, confirmPassword
                });

                if (res.success) {
                    AurumApp.showToast('Cuenta Creada', `Bienvenido(a), ${res.user.name}. Tu rol inicial es Vendedor.`, 'success');
                    AurumApp.navigateTo('dashboard');
                } else {
                    showNotice(alertBox, res.message, 'error');
                }
            });
        }
    }

    function switchTab(tab) {
        currentAuthTab = tab;
        const portal = document.getElementById('auth-portal');
        if (portal) renderAuthPortal(portal);
    }

    function showNotice(box, msg, type = 'error') {
        if (!box) return;
        box.className = `auth-notice auth-notice--${type}`;
        box.textContent = msg;
        box.style.display = 'block';
    }

    function togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁️';
    }

    function showForgotPasswordModal() {
        AurumApp.showModal('Recuperación de Clave', `
            <div style="text-align:center; padding:var(--space-md) 0;">
                <div style="font-size:2.5rem; margin-bottom:var(--space-md);">🔑</div>
                <h4 style="margin-bottom:var(--space-sm);">Claves de Demostración</h4>
                <p style="color:var(--color-text-secondary); font-size:var(--font-size-sm); margin-bottom:var(--space-md);">
                    En este entorno, cada perfil de prueba tiene su contraseña configurada con los requisitos de seguridad:
                </p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm); text-align:left; font-size:var(--font-size-xs);">
                    <div style="background:var(--color-surface-alt); padding:var(--space-sm); border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <strong>CEO:</strong> <code>Ceo@2026</code>
                    </div>
                    <div style="background:var(--color-surface-alt); padding:var(--space-sm); border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <strong>Admin:</strong> <code>Admin@123</code>
                    </div>
                    <div style="background:var(--color-surface-alt); padding:var(--space-sm); border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <strong>Vendedor:</strong> <code>Cajero@123</code>
                    </div>
                    <div style="background:var(--color-surface-alt); padding:var(--space-sm); border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <strong>Inventario:</strong> <code>Stock@123</code>
                    </div>
                </div>
            </div>
        `, [
            { label: 'Entendido', class: 'btn btn--primary', action: 'close' }
        ]);
    }

    // ---- Actualizaciones de UI en Sidebar y Header ----
    function updateSidebarUserWidget() {
        const widget = document.getElementById('sidebar-user-widget');
        if (!widget || !currentUser) return;

        widget.innerHTML = `
            <div class="sidebar-user-card" onclick="AurumApp.navigateTo('profile')" role="button" tabindex="0" title="Ver perfil de ${currentUser.name}">
                <div class="sidebar-user-card__avatar ${currentUser.role === 'ceo' ? 'user-cell__avatar--ceo' : ''}">${currentUser.avatar}</div>
                <div class="sidebar-user-card__info">
                    <div class="sidebar-user-card__name">${currentUser.name}</div>
                    <div class="sidebar-user-card__role">
                        <span class="badge ${currentUser.badgeClass}">${currentUser.roleLabel}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function updateHeaderUserBadge() {
        const badge = document.getElementById('header-user-badge');
        if (!badge || !currentUser) return;

        badge.innerHTML = `
            <button type="button" class="header-user-pill" onclick="AurumApp.navigateTo('profile')" title="Usuario: ${currentUser.name} (${currentUser.roleLabel})">
                <span class="header-user-pill__avatar ${currentUser.role === 'ceo' ? 'user-cell__avatar--ceo' : ''}">${currentUser.avatar}</span>
                <span class="header-user-pill__name">${currentUser.name.split(' ')[0]}</span>
                <span class="badge ${currentUser.badgeClass} header-user-pill__role">${currentUser.role === 'ceo' ? '👑 CEO' : (currentUser.role === 'admin' ? 'Admin' : (currentUser.role === 'cajero' ? 'Ventas' : 'Stock'))}</span>
            </button>
        `;
    }

    // ---- Panel de Gestión de Roles y Usuarios (EXCLUSIVO CEO) ----
    function renderUsersManagement() {
        const container = document.getElementById('page-users');
        if (!container) return;

        if (!currentUser || currentUser.role !== 'ceo') {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:var(--space-2xl);">
                    <div style="font-size:3rem; margin-bottom:var(--space-md);">⛔</div>
                    <h3>Acceso Restringido</h3>
                    <p style="color:var(--color-text-secondary); margin-top:var(--space-sm);">
                        Solo el usuario con rango <strong>CEO</strong> tiene autorización para gestionar usuarios y modificar sus roles.
                    </p>
                </div>
            `;
            return;
        }

        const counts = {
            total: users.length,
            ceo: users.filter(u => u.role === 'ceo').length,
            admin: users.filter(u => u.role === 'admin').length,
            inventario: users.filter(u => u.role === 'inventario').length,
            cajero: users.filter(u => u.role === 'cajero').length
        };

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Gestión de Roles y Permisos — Dirección General</h2>
                    <p class="section-header__desc">Panel de control exclusivo del CEO: asigna y reasigna los roles de cualquier operador del sistema.</p>
                </div>
                <div class="section-header__actions">
                    <button type="button" class="btn btn--primary" onclick="AuthModule.showCreateUserModal()">
                        <span>➕ Asignar Nuevo Operador</span>
                    </button>
                </div>
            </div>

            <!-- Métricas de Personal -->
            <div class="stats-grid" style="margin-bottom:var(--space-xl);">
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--gold">👑</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Dirección (CEO)</div>
                        <div class="stat-card__value">${counts.ceo}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--gold">🛡️</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Administradores</div>
                        <div class="stat-card__value">${counts.admin}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--blue">📦</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Resp. Inventario</div>
                        <div class="stat-card__value">${counts.inventario}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__icon stat-card__icon--green">👤</div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Vendedores / Caja</div>
                        <div class="stat-card__value">${counts.cajero}</div>
                    </div>
                </div>
            </div>

            <!-- Tabla de Operadores con Cambio de Rol en Vivo -->
            <div class="users-table-wrap">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Operador</th>
                            <th>ID & Documento</th>
                            <th>Rango / Rol Actual</th>
                            <th>Asignar Nuevo Rol (CEO)</th>
                            <th>Fecha Alta</th>
                            <th style="text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>
                                    <div class="user-cell">
                                        <div class="user-cell__avatar ${u.role === 'ceo' ? 'user-cell__avatar--ceo' : ''}">${u.avatar}</div>
                                        <div>
                                            <div class="user-cell__name">
                                                ${u.name} ${u.id === currentUser.id ? '<span class="badge badge--success" style="font-size:0.6rem;">(Tú)</span>' : ''}
                                            </div>
                                            <div class="user-cell__email">${u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="font-mono" style="font-size:var(--font-size-xs);">${u.id}</span>
                                    <div style="font-size:var(--font-size-xs); color:var(--color-text-muted);">${u.documentType} ${u.documentNumber || '—'}</div>
                                </td>
                                <td>
                                    <span class="badge ${u.badgeClass}">${u.roleLabel}</span>
                                </td>
                                <td>
                                    <select class="form-select form-select--sm" onchange="AuthModule.changeUserRole('${u.id}', this.value)" style="max-width:230px; font-weight:600;">
                                        <option value="ceo" ${u.role === 'ceo' ? 'selected' : ''}>👑 CEO / Director</option>
                                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>🛡️ Administrador</option>
                                        <option value="inventario" ${u.role === 'inventario' ? 'selected' : ''}>📦 Resp. Inventario</option>
                                        <option value="cajero" ${u.role === 'cajero' ? 'selected' : ''}>👤 Vendedor / Cajero</option>
                                    </select>
                                </td>
                                <td>
                                    <span style="font-size:var(--font-size-xs); color:var(--color-text-secondary);">${AurumCalc.formatDate(u.createdAt)}</span>
                                </td>
                                <td style="text-align:right;">
                                    <div style="display:inline-flex; gap:var(--space-xs);">
                                        <button type="button" class="btn btn--sm btn--secondary" onclick="AuthModule.resetUserPassword('${u.id}')" title="Restablecer clave temporal">
                                            🔑
                                        </button>
                                        ${u.id !== currentUser.id ? `
                                            <button type="button" class="btn btn--sm btn--danger" onclick="AuthModule.deleteUser('${u.id}')" title="Eliminar operador">
                                                🗑
                                            </button>
                                        ` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function showCreateUserModal() {
        AurumApp.showModal('Asignar Nuevo Operador con Rango Directo', `
            <form id="ceo-create-user-form" style="display:flex; flex-direction:column; gap:var(--space-md);">
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label form-label--required">Nombre Completo</label>
                    <input type="text" name="name" class="form-input" placeholder="Ej: Patricia Bermúdez" required>
                </div>
                <div class="form-row" style="margin-bottom:0;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label form-label--required">Correo Corporativo</label>
                        <input type="email" name="email" class="form-input" placeholder="patricia@aurumpos.com" required>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label form-label--required">Rango Asignado por el CEO</label>
                        <select name="role" class="form-select" required>
                            <option value="cajero" selected>👤 Vendedor / Cajero</option>
                            <option value="inventario">📦 Responsable de Inventario</option>
                            <option value="admin">🛡️ Administrador General</option>
                            <option value="ceo">👑 CEO / Co-Director</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label form-label--required">Contraseña de Acceso</label>
                    <input type="text" name="password" class="form-input" value="Aurum@2026" required>
                    <span class="form-hint">Debe cumplir: 4 a 16 caracteres, 1 mayúscula y 1 carácter especial.</span>
                </div>
            </form>
        `, [
            { label: 'Cancelar', class: 'btn btn--secondary', action: 'close' },
            { label: 'Crear Operador', class: 'btn btn--primary', action: () => {
                const form = document.getElementById('ceo-create-user-form');
                if (!form) return;
                const name = form.name.value.trim();
                const email = form.email.value.trim().toLowerCase();
                const role = form.role.value;
                const password = form.password.value;

                if (!name || !email || !password) {
                    AurumApp.showToast('Campos Incompletos', 'Completa nombre, correo y contraseña.', 'warning');
                    return;
                }

                const passCheck = validatePassword(password);
                if (!passCheck.valid) {
                    AurumApp.showToast('Contraseña Inválida', passCheck.errors.join(' '), 'error');
                    return;
                }

                if (users.some(u => u.email.toLowerCase() === email)) {
                    AurumApp.showToast('Correo Duplicado', 'Ya existe un usuario con este correo.', 'error');
                    return;
                }

                const roleInfo = ROLES[role];
                const nameParts = name.split(' ');
                const avatar = role === 'ceo' ? '👑' : (nameParts.length > 1 ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase());

                const created = {
                    id: `USR-${String(users.length + 1).padStart(3, '0')}`,
                    name,
                    email,
                    password,
                    role,
                    roleLabel: roleInfo.label,
                    documentType: 'CC',
                    documentNumber: '1099001122',
                    phone: '',
                    avatar,
                    badgeClass: roleInfo.badgeClass,
                    icon: roleInfo.icon,
                    createdAt: new Date().toISOString(),
                    permissions: [roleInfo.description]
                };

                users.push(created);
                saveUsers();
                AurumApp.closeModal();
                AurumApp.showToast('Operador Asignado', `${name} ha sido dado de alta como ${roleInfo.label}.`, 'success');
                renderUsersManagement();
            }}
        ]);
    }

    // ---- Renderizado de Perfil de Usuario ----
    function renderProfileView(container) {
        if (!currentUser) return;
        const roleInfo = ROLES[currentUser.role] || ROLES.cajero;

        container.innerHTML = `
            <div class="section-header">
                <div class="section-header__info">
                    <h2 class="section-header__title">Mi Perfil de Operador</h2>
                    <p class="section-header__desc">Identidad de usuario, privilegios asignados y alcances en AURUM POS</p>
                </div>
                <div class="section-header__actions">
                    <button type="button" class="btn btn--secondary" onclick="AuthModule.confirmLogout()">
                        <span>🚪 Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            <div class="profile-grid">
                <!-- Tarjeta Principal de Identidad -->
                <div class="card profile-user-card">
                    <div class="profile-user-card__header">
                        <div class="profile-user-card__avatar ${currentUser.role === 'ceo' ? 'user-cell__avatar--ceo' : ''}">${currentUser.avatar}</div>
                        <div class="profile-user-card__titles">
                            <h3 class="profile-user-card__name">${currentUser.name}</h3>
                            <div class="profile-user-card__role">
                                <span class="badge ${currentUser.badgeClass} badge--lg">${currentUser.roleLabel}</span>
                                <span class="badge badge--success">● En línea</span>
                            </div>
                        </div>
                    </div>

                    <hr class="summary-panel__divider">

                    <div class="detail-grid">
                        <div class="detail-field">
                            <span class="detail-field__label">ID de Operador</span>
                            <span class="detail-field__value font-mono">${currentUser.id}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-field__label">Correo Electrónico</span>
                            <span class="detail-field__value">${currentUser.email}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-field__label">Documento</span>
                            <span class="detail-field__value">${currentUser.documentType} ${currentUser.documentNumber || '—'}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-field__label">Teléfono</span>
                            <span class="detail-field__value">${currentUser.phone || '—'}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-field__label">Fecha de Alta</span>
                            <span class="detail-field__value">${AurumCalc.formatDate(currentUser.createdAt)}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-field__label">Seguridad de Clave</span>
                            <span class="detail-field__value" style="color:var(--color-success); font-weight:600;">✓ Conforme (4-16 chars + Mayús + Esp.)</span>
                        </div>
                    </div>
                </div>

                <!-- Alcance y Permisos del Rango -->
                <div class="card profile-permissions-card">
                    <h3 class="card__title" style="margin-bottom:var(--space-md);">Privilegios Operativos de tu Rango</h3>
                    <p style="font-size:var(--font-size-sm); color:var(--color-text-secondary); margin-bottom:var(--space-md);">
                        ${roleInfo.description}
                    </p>

                    <ul class="profile-permissions-list">
                        ${currentUser.permissions ? currentUser.permissions.map(p => `
                            <li>
                                <span class="permission-icon">✓</span>
                                <span>${p}</span>
                            </li>
                        `).join('') : `
                            <li><span class="permission-icon">✓</span> Funciones generales autorizadas</li>
                        `}
                    </ul>

                    <div class="profile-quick-actions">
                        <h4 style="font-size:var(--font-size-sm); margin-bottom:var(--space-sm); color:var(--color-text);">Accesos autorizados según tu rango:</h4>
                        <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
                            <button type="button" class="btn btn--sm btn--secondary" onclick="AurumApp.navigateTo('dashboard')">📊 Dashboard</button>
                            ${roleInfo.canTransact ? `<button type="button" class="btn btn--sm btn--primary" onclick="AurumApp.navigateTo('purchases')">📥 Nueva Compra</button>` : ''}
                            ${roleInfo.canTransact ? `<button type="button" class="btn btn--sm btn--secondary" onclick="AurumApp.navigateTo('sales')">📤 Nueva Venta</button>` : ''}
                            <button type="button" class="btn btn--sm btn--secondary" onclick="AurumApp.navigateTo('inventory')">📦 Inventario</button>
                            ${roleInfo.canEditConfig ? `<button type="button" class="btn btn--sm btn--secondary" onclick="AurumApp.navigateTo('settings')">⚙️ Configuración</button>` : ''}
                            ${currentUser.role === 'ceo' ? `<button type="button" class="btn btn--sm btn--primary" onclick="AurumApp.navigateTo('users')">👑 Gestión de Roles</button>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Cambio Rápido entre perfiles demostrativos -->
                <div class="card profile-switch-card" style="grid-column: 1 / -1;">
                    <div class="card__header">
                        <div>
                            <h3 class="card__title">Probar la plataforma bajo otro rango</h3>
                            <div class="card__subtitle">Alterna de operador para validar cómo cambian los permisos y las vistas</div>
                        </div>
                    </div>

                    <div class="demo-profiles-list horizontal-profiles">
                        ${DEFAULT_USERS.filter(u => u.email !== currentUser.email).map(u => `
                            <div class="demo-profile-card demo-profile-card--compact" onclick="AuthModule.quickLogin('${u.email}')" role="button" tabindex="0">
                                <div class="demo-profile-card__avatar ${u.role === 'ceo' ? 'user-cell__avatar--ceo' : ''}">${u.avatar}</div>
                                <div class="demo-profile-card__info">
                                    <div class="demo-profile-card__name">${u.name}</div>
                                    <span class="badge ${u.badgeClass}">${u.roleLabel}</span>
                                </div>
                                <span class="btn btn--sm btn--secondary">Cambiar →</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Public API
    return {
        init,
        getCurrentUser,
        getUsers,
        login,
        quickLogin,
        logout,
        confirmLogout,
        register,
        canAccess,
        changeUserRole,
        resetUserPassword,
        deleteUser,
        switchTab,
        togglePasswordVisibility,
        showForgotPasswordModal,
        showCreateUserModal,
        renderUsersManagement,
        renderProfileView,
        render: (target) => {
            if (target === 'users') {
                renderUsersManagement();
            } else if (target === 'profile') {
                const p = document.getElementById('page-profile');
                if (p) renderProfileView(p);
            }
        }
    };
})();
