/**
 * AURUM POS — Validation
 * Validación de formularios.
 */

const AurumValidation = (() => {
    /**
     * Valida un campo individual.
     * @returns {{ valid: boolean, message: string }}
     */
    function validateField(value, rules) {
        if (rules.required && (!value || String(value).trim() === '')) {
            return { valid: false, message: rules.requiredMessage || 'Este campo es obligatorio.' };
        }

        if (rules.type === 'number') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, message: 'Debe ser un número válido.' };
            }
            if (rules.min !== undefined && num < rules.min) {
                return { valid: false, message: `El valor mínimo es ${rules.min}.` };
            }
            if (rules.max !== undefined && num > rules.max) {
                return { valid: false, message: `El valor máximo es ${rules.max}.` };
            }
            if (rules.positive && num <= 0) {
                return { valid: false, message: 'El valor debe ser positivo.' };
            }
        }

        if (rules.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return { valid: false, message: 'El formato de correo no es válido.' };
            }
        }

        if (rules.type === 'phone' && value) {
            const cleaned = value.replace(/[\s\-()]/g, '');
            if (cleaned.length < 7 || cleaned.length > 15) {
                return { valid: false, message: 'El número de teléfono no parece válido.' };
            }
        }

        if (rules.minLength && String(value).length < rules.minLength) {
            return { valid: false, message: `Mínimo ${rules.minLength} caracteres.` };
        }

        if (rules.maxLength && String(value).length > rules.maxLength) {
            return { valid: false, message: `Máximo ${rules.maxLength} caracteres.` };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valida un formulario completo.
     * @param {Object} data - Datos del formulario { campo: valor }
     * @param {Object} schema - Reglas { campo: { required, type, ... } }
     * @returns {{ valid: boolean, errors: Object }}
     */
    function validateForm(data, schema) {
        const errors = {};
        let valid = true;

        for (const field in schema) {
            const result = validateField(data[field], schema[field]);
            if (!result.valid) {
                errors[field] = result.message;
                valid = false;
            }
        }

        return { valid, errors };
    }

    /**
     * Muestra error en un campo del DOM.
     */
    function showFieldError(inputEl, message) {
        if (!inputEl) return;
        inputEl.classList.add('error');
        inputEl.setAttribute('aria-invalid', 'true');

        // Buscar o crear elemento de error
        let errorEl = inputEl.parentElement.querySelector('.form-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            errorEl.setAttribute('role', 'alert');
            inputEl.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;

        // Asociar con aria-describedby
        const errorId = `error-${inputEl.id || inputEl.name}`;
        errorEl.id = errorId;
        inputEl.setAttribute('aria-describedby', errorId);
    }

    /**
     * Limpia error de un campo.
     */
    function clearFieldError(inputEl) {
        if (!inputEl) return;
        inputEl.classList.remove('error');
        inputEl.removeAttribute('aria-invalid');

        const errorEl = inputEl.parentElement.querySelector('.form-error');
        if (errorEl) {
            errorEl.remove();
        }
        inputEl.removeAttribute('aria-describedby');
    }

    /**
     * Muestra errores en un formulario.
     */
    function showFormErrors(formEl, errors) {
        // Limpiar errores previos
        formEl.querySelectorAll('.form-error').forEach(el => el.remove());
        formEl.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
            el.removeAttribute('aria-invalid');
        });

        for (const field in errors) {
            const inputEl = formEl.querySelector(`[name="${field}"]`);
            if (inputEl) {
                showFieldError(inputEl, errors[field]);
            }
        }

        // Focus en el primer campo con error
        const firstError = formEl.querySelector('.error');
        if (firstError) {
            firstError.focus();
        }
    }

    /**
     * Limpia todos los errores de un formulario.
     */
    function clearFormErrors(formEl) {
        if (!formEl) return;
        formEl.querySelectorAll('.form-error').forEach(el => el.remove());
        formEl.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
            el.removeAttribute('aria-invalid');
            el.removeAttribute('aria-describedby');
        });
    }

    return {
        validateField,
        validateForm,
        showFieldError,
        clearFieldError,
        showFormErrors,
        clearFormErrors,
    };
})();
