# Especificación técnica frontend
## Sistema web POS para compra y venta de oro

**Versión:** 1.0  
**Alcance:** exclusivamente frontend  
**Tecnologías permitidas:** HTML5, CSS3 y JavaScript puro (Vanilla JavaScript)

---

## 1. Resumen del proyecto

El proyecto consiste en una interfaz web para un sistema POS (*Point of Sale*) de un negocio dedicado a la compra y venta de oro. La aplicación debe facilitar las operaciones del mostrador, el cálculo del valor del metal según su peso y quilataje, la consulta de inventario y la revisión de movimientos recientes.

El frontend debe priorizar la rapidez de uso, la legibilidad, la prevención de errores y la transparencia de los cálculos.

### Objetivos principales

- Registrar visualmente operaciones de compra y venta.
- Calcular valores estimados a partir del peso, quilataje y precio de referencia.
- Consultar productos o piezas disponibles en inventario.
- Mostrar un resumen de actividad en un dashboard.
- Facilitar la búsqueda de clientes y el registro de datos básicos.
- Ofrecer una interfaz adaptable a escritorio, tablet y móvil.
- Mantener una estructura preparada para integrar un backend en una fase futura.

## 2. Tecnologías y restricciones

### Tecnologías autorizadas

- **HTML5:** estructura semántica de páginas, formularios, tablas, navegación y diálogos.
- **CSS3:** diseño visual, distribución, componentes, estados, animaciones moderadas y diseño responsive.
- **JavaScript puro:** interacciones, validaciones, cálculos, filtros, renderizado dinámico y gestión de estado en el navegador.

### No utilizar

- React, Angular, Vue, Svelte u otros frameworks.
- Bootstrap, Tailwind u otros frameworks CSS.
- jQuery.
- Librerías externas de componentes.
- Backend, bases de datos o servicios externos como parte de esta entrega frontend.
- Dependencias obligatorias para ejecutar la interfaz.

Se pueden organizar los archivos en módulos nativos de JavaScript y utilizar APIs estándar del navegador.

## 3. Análisis de referentes del sector

Los siguientes sitios sirven como referentes funcionales y de experiencia de usuario. La propuesta toma patrones generales, sin copiar sus diseños, marca o contenido.

### 3.1 AurumSoft — gestión del negocio

Sitio: https://aurumsoft.fr/

**Patrones relevantes:** centralización de la operación, control de stock y métricas administrativas.

**Aplicación al proyecto:** dashboard con indicadores de actividad, movimientos recientes y acceso rápido a los módulos principales.

### 3.2 EasyJewelry — operación e inventario de joyería

Sitio: https://easyjewelry.co/

**Patrones relevantes:** gestión de piezas, datos de peso y quilataje y operaciones propias de joyería.

**Aplicación al proyecto:** formularios que separen peso bruto, quilataje, peso puro estimado y valor calculado, además de una ficha detallada por pieza.

### 3.3 BullionVault — claridad en precios y operaciones

Sitio: https://oro.bullionvault.es/

**Patrones relevantes:** separación clara entre compra y venta, presentación estructurada de precios y cantidades.

**Aplicación al proyecto:** mostrar la tarifa de referencia, unidad de medida, cantidad, subtotal y total de cada operación.

### 3.4 GOLD AVENUE — confianza y transparencia

Sitio: https://www.goldavenue.com/es/

**Patrones relevantes:** jerarquía visual clara, precios visibles y pasos de operación fáciles de entender.

**Aplicación al proyecto:** confirmaciones antes de acciones importantes, resúmenes de la transacción y mensajes de validación explícitos.

### Conclusión

La interfaz recomendada combina la rapidez de un POS, el control del inventario por peso y quilataje, cálculos transparentes y un dashboard administrativo. La prioridad no es replicar una tienda online de inversión, sino facilitar operaciones presenciales con precisión y trazabilidad visual.

> Nota: estos son referentes para orientar el diseño. Antes de implementar, conviene validar sus funciones y apariencia actuales directamente en sus sitios oficiales.

## 4. Perfiles y contexto de uso

La interfaz se plantea para estos perfiles:

- **Vendedor o cajero:** registra compras y ventas durante la atención al cliente.
- **Administrador:** consulta indicadores, movimientos e inventario.
- **Responsable de inventario:** revisa piezas, pesos, quilatajes y disponibilidad.

En esta fase estos perfiles son conceptos de diseño; no existe autenticación real ni control de permisos en el frontend.

## 5. Arquitectura de información

### Navegación principal

1. Dashboard
2. Nueva compra
3. Nueva venta
4. Inventario
5. Clientes
6. Historial de operaciones
7. Configuración

La navegación debe permanecer consistente entre pantallas y señalar con claridad la sección activa.

## 6. Especificación de módulos

### 6.1 Dashboard

**Propósito:** ofrecer una visión rápida de la actividad del negocio.

**Componentes:**
- Tarjetas de indicadores: compras del día, ventas del día, operaciones registradas y piezas en inventario.
- Resumen de movimientos recientes.
- Accesos directos a “Nueva compra” y “Nueva venta”.
- Indicador visible del precio de referencia utilizado por la demostración.
- Estados vacíos cuando no haya registros.

**UX:** priorizar los datos operativos más importantes, evitar saturación de tarjetas y diferenciar claramente cifras reales conectadas de datos de demostración.

### 6.2 Nueva compra de oro

**Propósito:** registrar la recepción de oro de un cliente.

**Campos sugeridos:**
- Cliente o comprador/vendedor asociado.
- Tipo de pieza: anillo, cadena, pulsera, moneda, lingote, otro.
- Quilataje: por ejemplo, 24K, 22K, 18K, 14K, 10K u otro valor autorizado.
- Peso bruto en gramos.
- Peso de elementos no auríferos, si aplica.
- Peso neto considerado para la valoración.
- Precio de referencia por gramo de oro puro.
- Porcentaje o factor de compra aplicado.
- Valor estimado.
- Observaciones.

**Interacciones:**
- Validar campos obligatorios y valores numéricos positivos.
- Calcular el peso neto y el importe estimado.
- Mostrar un resumen antes de confirmar.
- Advertir si falta información o se introduce un valor incoherente.
- Permitir cancelar sin registrar la operación.

**Cálculo ilustrativo:**

`peso de oro puro estimado = peso neto × (quilataje / 24)`

`valor estimado = peso de oro puro estimado × precio por gramo de oro puro × factor de compra`

El factor de compra debe expresarse como decimal; por ejemplo, 0,90 equivale al 90 %. La fórmula es configurable y debe validarse con la política comercial y contable del negocio. No representa una cotización oficial.

### 6.3 Nueva venta

**Propósito:** preparar una venta de una pieza disponible.

**Campos y componentes:**
- Búsqueda o selección de piezas del inventario.
- Descripción, código, peso y quilataje.
- Cantidad, cuando el tipo de producto lo permita.
- Precio unitario y subtotal.
- Descuento, solo si el negocio lo autoriza.
- Total estimado.
- Método de pago como dato de interfaz.
- Resumen previo a confirmar.

**Interacciones:**
- Impedir seleccionar piezas marcadas como no disponibles.
- Recalcular subtotal y total al cambiar cantidades o precios.
- Mostrar una confirmación antes de completar la acción.
- Informar claramente si el inventario de demostración no contiene piezas suficientes.

En el frontend aislado, la venta no constituye una transacción financiera real.

### 6.4 Inventario

**Propósito:** consultar y organizar las piezas disponibles.

**Vista de tabla o listado:**
- Código de pieza.
- Nombre o descripción.
- Tipo de pieza.
- Quilataje.
- Peso en gramos.
- Precio estimado.
- Estado: disponible, reservada o vendida.
- Acciones: ver detalle y editar datos de demostración.

**Funciones:**
- Búsqueda por código o descripción.
- Filtros por tipo, quilataje y estado.
- Ordenamiento por peso, precio o nombre.
- Indicador de resultados y estado vacío.
- Vista de detalle de una pieza.

### 6.5 Clientes

**Propósito:** permitir consultar y capturar información básica de clientes.

**Campos posibles:**
- Nombre completo.
- Tipo y número de documento, si la política del negocio lo requiere.
- Teléfono.
- Correo electrónico, opcional.
- Observaciones autorizadas para el negocio.

**UX y privacidad:** solicitar solo los datos necesarios, explicar su finalidad en la futura versión productiva y evitar exponer datos personales en listados o mensajes innecesarios.

### 6.6 Historial de operaciones

**Propósito:** revisar operaciones creadas en la interfaz.

**Columnas sugeridas:**
- Número de operación.
- Fecha y hora local del navegador.
- Tipo: compra o venta.
- Cliente.
- Importe.
- Estado visual.
- Acción para consultar el resumen.

**Funciones:** búsqueda, filtros por tipo y fecha, ordenamiento y detalle de operación. En la versión frontend, el historial solo contendrá datos locales o de demostración.

### 6.7 Configuración

Debe permitir, en modo demostración, visualizar o ajustar:
- Precio de referencia manual.
- Moneda de presentación: COP.
- Formato de peso: gramos.
- Quilatajes permitidos.
- Factor comercial de compra.
- Preferencias visuales básicas.

Los valores deben estar etiquetados como configuraciones locales, no como datos oficiales de mercado.

## 7. Reglas de negocio visibles en la interfaz

1. Los pesos se expresan en gramos y los importes en pesos colombianos (COP), salvo que el negocio defina otra configuración.
2. Los cálculos deben conservar precisión interna suficiente y redondear solo para presentación o según la regla comercial acordada.
3. Todo precio de referencia debe mostrar fecha/hora de actualización y origen cuando exista una fuente real. En la demo debe decir “valor de prueba”.
4. El quilataje representa una proporción de oro: como aproximación, 24K se toma como oro puro y los demás quilatajes se calculan proporcionalmente.
5. No se debe confirmar visualmente una operación con campos obligatorios inválidos.
6. Las acciones de eliminar, cancelar o finalizar deben solicitar confirmación cuando puedan ocasionar pérdida de información.
7. Los estados deben distinguirse por texto e iconografía, no únicamente por color.
8. La interfaz no debe presentar una operación local como pago real, comprobante fiscal ni registro contable definitivo.

## 8. Diseño UI/UX

### Dirección visual

Se recomienda una estética profesional, sobria y confiable:

- Fondo general gris muy claro o marfil.
- Superficies blancas para formularios y tablas.
- Dorado moderado como color de acento, no como fondo dominante.
- Texto principal de alto contraste.
- Verde para estados positivos y rojo para errores, acompañados de texto.
- Tipografía del sistema para evitar dependencias externas.
- Iconos sencillos creados con texto o SVG inline, si son necesarios.

### Layout de escritorio

- Barra lateral de navegación.
- Encabezado con nombre de sección y acciones.
- Área principal con indicadores, tablas y formularios.
- Resumen de cálculo visible cerca de los campos que lo generan.

### Layout móvil

- Navegación compacta.
- Formularios de una columna.
- Acciones principales accesibles sin desplazamiento excesivo.
- Tablas adaptadas a tarjetas o con desplazamiento horizontal controlado.
- Totales y errores visibles sin depender del color.

### Accesibilidad

- Usar etiquetas asociadas a cada campo.
- Navegación completa por teclado.
- Estados de foco visibles.
- Contraste suficiente entre texto y fondo.
- Mensajes de error asociados al campo correspondiente.
- Botones con nombres claros.
- No usar placeholders como sustituto de etiquetas.
- Respetar la preferencia del sistema para reducir movimiento.

## 9. Requisitos funcionales frontend

- RF-01: mostrar la navegación principal y la sección activa.
- RF-02: mostrar tarjetas de resumen en el dashboard.
- RF-03: calcular en tiempo real el valor estimado de una compra.
- RF-04: validar formularios antes de confirmar.
- RF-05: permitir buscar, filtrar y ordenar el inventario de demostración.
- RF-06: permitir seleccionar piezas para preparar una venta.
- RF-07: presentar un resumen de compra o venta antes de la confirmación local.
- RF-08: mostrar un historial de operaciones de demostración.
- RF-09: mantener un estado coherente entre módulos durante la sesión.
- RF-10: adaptarse a escritorio, tablet y móvil.
- RF-11: mostrar mensajes de éxito, advertencia y error.
- RF-12: permitir reiniciar los datos de demostración.

## 10. Requisitos no funcionales

- **Rendimiento:** evitar scripts innecesarios y renderizar solo lo que la pantalla requiere.
- **Mantenibilidad:** separar estructura, estilos y lógica.
- **Compatibilidad:** usar APIs estándar de navegadores modernos.
- **Usabilidad:** acciones frecuentes visibles y formularios breves.
- **Accesibilidad:** contemplar teclado, contraste, etiquetas y mensajes.
- **Privacidad:** no guardar información sensible en almacenamiento local sin una decisión explícita de producto.
- **Seguridad:** validar en el frontend para mejorar UX, pero nunca considerar esa validación suficiente para proteger un sistema real.

## 11. Estructura de archivos recomendada

```text
aurum-pos/
├── index.html
├── css/
│   ├── styles.css
│   ├── layout.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── state.js
│   ├── calculations.js
│   ├── validation.js
│   ├── inventory.js
│   ├── purchases.js
│   ├── sales.js
│   └── history.js
└── assets/
    └── (recursos locales opcionales)
```

La estructura puede simplificarse para un prototipo pequeño. No se necesita un proceso de compilación: basta con abrir la aplicación mediante un servidor estático local para evitar restricciones del navegador con módulos JavaScript.

## 12. Estado y persistencia de demostración

Para el prototipo se puede mantener el estado en memoria durante la sesión. Si se requiere conservarlo entre recargas, se puede usar `localStorage` únicamente con datos ficticios o no sensibles.

Debe existir una acción para restablecer la demo. El usuario debe saber que los registros locales:
- pertenecen al navegador actual;
- no se sincronizan entre equipos;
- pueden perderse al limpiar los datos del navegador;
- no son una base de datos comercial confiable.

## 13. Alcance y exclusiones

### Incluido

- Interfaz responsive.
- Navegación entre módulos.
- Formularios y validaciones de experiencia de usuario.
- Cálculos locales.
- Datos de ejemplo.
- Búsqueda y filtros locales.
- Mensajes y confirmaciones visuales.

### No incluido

- Backend, API o base de datos.
- Inicio de sesión real, permisos o auditoría segura.
- Cotizaciones del oro en tiempo real.
- Pagos electrónicos o conciliación bancaria.
- Facturación electrónica.
- Impresión fiscal o comprobantes legales.
- Sincronización entre sucursales o dispositivos.
- Garantías de seguridad o integridad de las operaciones.

Estos puntos requieren servicios y validaciones adicionales fuera del alcance de HTML, CSS y JavaScript en el navegador.

## 14. Criterios de aceptación

La primera versión frontend se considerará aceptable cuando:

- Se pueda navegar por todos los módulos definidos.
- Los formularios muestren validaciones comprensibles.
- El cálculo de peso puro estimado y valor cambie al modificar sus entradas.
- Las búsquedas y filtros del inventario funcionen con los datos de prueba.
- Se pueda preparar una venta con piezas disponibles en la demo.
- Las confirmaciones y mensajes de error sean visibles y accesibles.
- La interfaz funcione en anchos de escritorio y móvil sin desbordamientos críticos.
- Los valores de prueba estén identificados claramente.
- No se utilicen frameworks ni librerías externas.
- La documentación deje claro que no existe persistencia comercial ni conexión a servicios reales.

## 15. Fases sugeridas de implementación

1. **Base visual:** HTML semántico, variables CSS, layout responsive y navegación.
2. **Dashboard:** tarjetas de indicadores, movimientos recientes y estados vacíos.
3. **Compras:** formulario, validación y cálculo del valor estimado.
4. **Inventario y ventas:** listado, filtros, selección de piezas y resumen.
5. **Clientes e historial:** formularios y vistas de consulta locales.
6. **Pruebas UX:** teclado, mensajes, contraste, móvil y escenarios con datos inválidos.
7. **Preparación futura:** documentar los puntos de integración con una API, sin implementar backend en esta fase.

---

## Resultado esperado

Un prototipo frontend de POS para compra y venta de oro, con una experiencia de usuario rápida, clara y adaptable, construido únicamente con HTML5, CSS3 y JavaScript puro. La interfaz permitirá demostrar flujos de compra, venta, inventario y consulta, sin afirmar que procesa transacciones reales ni que utiliza cotizaciones oficiales.
