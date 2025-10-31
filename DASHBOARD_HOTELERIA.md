# 📊 Dashboard Ejecutivo Hotelero - Documentación

## 🎯 Descripción General

Dashboard ejecutivo completo para gestión hotelera profesional que muestra en tiempo real las métricas operativas y financieras más importantes del hotel.

## ✅ Componentes Implementados

### 📈 KPIs Principales (6 tarjetas)

1. **Ocupación Actual**
   - Porcentaje de ocupación en tiempo real
   - Comparación con el día anterior (tendencia)
   - Indicador visual por colores (verde >70%, amarillo 40-70%, rojo <40%)

2. **ADR (Average Daily Rate)**
   - Tarifa promedio por habitación vendida
   - Promedio de los últimos 7 días

3. **RevPAR (Revenue Per Available Room)**
   - Ingreso por habitación disponible
   - Barra de progreso hacia meta mensual ($4,200)

4. **Revenue del Día**
   - Ingresos totales del día actual
   - Proyección mensual estimada

5. **Check-ins HOY**
   - Cantidad total de llegadas programadas
   - Desglose: completados vs pendientes

6. **Check-outs HOY**
   - Cantidad total de salidas programadas
   - Desglose: completados vs pendientes
   - Hora del próximo check-out

### 📊 Gráficos Implementados (7 gráficos)

1. **Ocupación y ADR - Últimos 30 Días** (Gráfico de líneas dual)
   - Línea azul: Porcentaje de ocupación
   - Línea verde: ADR (Average Daily Rate)
   - Panel de insights con estadísticas del período

2. **Revenue por Tipo de Habitación** (Gráfico de barras horizontales)
   - Revenue total por cada tipo de habitación
   - Ordenado de mayor a menor
   - Tooltips con detalles (porcentaje, noches, precio promedio)

3. **Estados de Habitaciones** (Gráfico de dona)
   - Disponible (verde)
   - Ocupada (azul)
   - Limpieza (amarillo)
   - Mantenimiento (rojo)
   - Panel con listado detallado de cantidades y porcentajes

4. **Curva de Ocupación - Próximos 30 Días** (Gráfico de área)
   - Proyección de ocupación futura
   - Colores de fondo según nivel (verde/amarillo/rojo)
   - Tooltips con habitaciones confirmadas y disponibles

5. **Revenue Mensual Comparativo** (Gráfico de barras agrupadas)
   - Comparación año actual vs año anterior
   - 12 meses completos
   - Porcentaje de crecimiento/decrecimiento

### 📋 Tablas Operativas (3 tablas)

1. **Llegadas de Hoy (Check-ins Pendientes)**
   - Hora, código de reserva, huésped, habitación
   - Tipo de habitación, noches de estadía
   - Estado (badge con colores)
   - Botón de acción para check-in

2. **Salidas de Hoy (Check-outs Pendientes)**
   - Habitación, huésped, hora de check-out
   - Días de estadía, revenue total
   - Estado actual
   - Botón de acción para check-out

3. **Habitaciones Críticas (Alertas)**
   - Habitaciones en mantenimiento o limpieza prolongada
   - Nivel de prioridad (Alta/Media)
   - Estado actual

## 🔌 Endpoints API Disponibles

### Vista Principal

```
GET /hoteleria/dashboard
```
Renderiza la vista HTML del dashboard.

### KPIs

```
GET /api/hoteleria/dashboard/kpis
```
Retorna todos los KPIs principales en una sola llamada.

**Respuesta:**
```json
{
  "ocupacionActual": {
    "porcentaje": 78.5,
    "habitacionesOcupadas": 54,
    "totalHabitaciones": 68,
    "tendencia": 2.3
  },
  "adr": {
    "valor": 4850.00,
    "periodo": "7 días"
  },
  "revpar": {
    "valor": 3807.25,
    "meta": 4200,
    "progreso": 90.6
  },
  "revenueHoy": {
    "valor": 82450.00,
    "proyeccionMensual": 2473500.00
  },
  "checkinsHoy": {
    "total": 12,
    "completados": 3,
    "pendientes": 9
  },
  "checkoutsHoy": {
    "total": 8,
    "completados": 5,
    "pendientes": 3,
    "proximo": "11:30"
  }
}
```

### Gráficos

```
GET /api/hoteleria/dashboard/ocupacion-adr?dias=30
```
Datos de ocupación y ADR histórico.

```
GET /api/hoteleria/dashboard/revenue-tipo
```
Revenue por tipo de habitación del mes actual.

```
GET /api/hoteleria/dashboard/estados-habitaciones
```
Estados actuales de todas las habitaciones.

```
GET /api/hoteleria/dashboard/forecast-ocupacion?dias=30
```
Proyección de ocupación para los próximos días.

```
GET /api/hoteleria/dashboard/revenue-comparativo
```
Revenue mensual comparativo año actual vs anterior (12 meses).

### Tablas Operativas

```
GET /api/hoteleria/dashboard/checkins-hoy
```
Listado de check-ins programados para hoy.

```
GET /api/hoteleria/dashboard/checkouts-hoy
```
Listado de check-outs programados para hoy.

```
GET /api/hoteleria/dashboard/habitaciones-criticas
```
Habitaciones que requieren atención (mantenimiento/limpieza).

## 🎨 Características de Diseño

- **Responsive**: Adaptado a desktop, tablet y móvil
- **Colores profesionales**: Paleta consistente con estándares hoteleros
- **Animaciones suaves**: Transiciones y efectos hover
- **Auto-refresh**: Actualización automática cada 5 minutos
- **Refresh manual**: Botón para actualizar datos bajo demanda
- **Loading states**: Indicadores visuales durante carga de datos
- **Tooltips informativos**: Información adicional al pasar el mouse
- **Charts interactivos**: Gráficos con Chart.js v4.4.0

## 🚀 Cómo Usar

1. **Acceder al dashboard:**
   ```
   http://localhost:3000/hoteleria/dashboard
   ```

2. **Navegación:**
   - El dashboard se encuentra en el menú lateral bajo "Hotelería > Dashboard"
   - Primera opción del submenú de Hotelería

3. **Actualización de datos:**
   - Los datos se cargan automáticamente al entrar
   - Se actualizan automáticamente cada 5 minutos
   - Puedes forzar actualización con el botón "Actualizar"

4. **Interacción con gráficos:**
   - Pasa el mouse sobre los gráficos para ver detalles
   - Los gráficos son completamente interactivos

5. **Acciones rápidas:**
   - Desde las tablas puedes ir directamente a check-in/check-out
   - Los botones redirigen a `/hoteleria/board`

## 📁 Estructura de Archivos

```
repositories/hoteleria/
  └── dashboard.js                    # Lógica de consultas a BD

routes/admin/hoteleria/
  └── dashboard.js                    # Endpoints API

views/admin/products/hoteleria/
  └── dashboard.js                    # Vista HTML

public/js/
  └── hoteleria-dashboard.js          # JavaScript del frontend
```

## 🔧 Tecnologías Utilizadas

- **Backend**: Node.js + Express
- **ORM**: Prisma Client
- **Frontend**: HTML5 + JavaScript ES6+
- **Gráficos**: Chart.js 4.4.0
- **Estilos**: CSS3 + Bulma (framework base)
- **Iconos**: Font Awesome 5
- **Fechas**: date-fns

## 📊 Métricas Calculadas

### ADR (Average Daily Rate)
```
ADR = Revenue Total de Habitaciones / Habitaciones Vendidas
```

### RevPAR (Revenue Per Available Room)
```
RevPAR = Revenue Total / Total de Habitaciones Disponibles
ó
RevPAR = ADR × Ocupación%
```

### Ocupación %
```
Ocupación = (Habitaciones Ocupadas / Total Habitaciones) × 100
```

## 🎯 Características Profesionales

✅ **KPIs en tiempo real** - Métricas actualizadas constantemente
✅ **Tendencias visuales** - Comparaciones con períodos anteriores  
✅ **Gráficos duales** - Múltiples ejes Y para mejor análisis
✅ **Proyecciones futuras** - Forecast de ocupación
✅ **Comparativas anuales** - Análisis YoY (Year over Year)
✅ **Tablas accionables** - Acceso rápido a operaciones
✅ **Alertas críticas** - Notificación de habitaciones que requieren atención
✅ **Insights automáticos** - Análisis calculado de datos
✅ **Performance optimizado** - Consultas en paralelo
✅ **UX profesional** - Diseño comparable a sistemas PMS comerciales

## 🔮 Notas Importantes

- El dashboard excluye el gráfico de "Origen de Reservas" como fue solicitado
- Todos los cálculos se basan en datos reales de la base de datos
- Los colores de los KPIs cambian dinámicamente según los umbrales
- Las fechas se muestran en formato local (es-AR)
- Los montos se formatean como pesos argentinos (ARS)

## 📈 Próximas Mejoras Sugeridas

- [ ] Filtros por rango de fechas personalizados
- [ ] Exportación de gráficos a PDF
- [ ] Widget de clima/eventos locales
- [ ] Notificaciones push para alertas críticas
- [ ] Comparación con presupuesto/forecast
- [ ] Dashboard móvil dedicado
- [ ] Websockets para actualización en tiempo real

---

**Dashboard creado siguiendo los estándares de la industria hotelera profesional** ✨
