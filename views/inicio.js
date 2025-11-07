const layout = require('./admin/products/layout');

module.exports = ({ req }) => {
    const usuario = req.session?.user || { nombre: 'Administrador' };
    
    return layout({content:`
        <style>
            .welcome-section {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 3rem 2rem;
                border-radius: 16px;
                margin-bottom: 2rem;
                color: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .welcome-title {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .welcome-subtitle {
                font-size: 1.1rem;
                opacity: 0.95;
                margin-bottom: 1rem;
            }
            
            .welcome-date {
                font-size: 0.95rem;
                opacity: 0.85;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .shortcuts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .shortcut-card {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
                cursor: pointer;
                border: 2px solid transparent;
                text-decoration: none;
                color: inherit;
                display: block;
            }
            
            .shortcut-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.15);
                border-color: #667eea;
            }
            
            .shortcut-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.8rem;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .shortcut-card.blue .shortcut-icon {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            }
            
            .shortcut-card.green .shortcut-icon {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            
            .shortcut-card.orange .shortcut-icon {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }
            
            .shortcut-card.red .shortcut-icon {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }
            
            .shortcut-card.purple .shortcut-icon {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            }
            
            .shortcut-card.teal .shortcut-icon {
                background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            }
            
            .shortcut-title {
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #1f2937;
            }
            
            .shortcut-description {
                font-size: 0.875rem;
                color: #6b7280;
                line-height: 1.5;
            }
            
            .quick-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                border-left: 4px solid #667eea;
            }
            
            .stat-label {
                font-size: 0.875rem;
                color: #6b7280;
                margin-bottom: 0.5rem;
                font-weight: 500;
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: 700;
                color: #1f2937;
            }
            
            .section-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .section-title i {
                color: #667eea;
            }
            
            @media (max-width: 768px) {
                .welcome-title {
                    font-size: 1.8rem;
                }
                
                .shortcuts-grid {
                    grid-template-columns: 1fr;
                }
                
                .quick-stats {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        
        <section class="inventory-card">
            <!-- Sección de Bienvenida -->
            <div class="welcome-section">
                <div class="welcome-title">
                    👋 ¡Bienvenido, ${usuario.nombre}!
                </div>
                <div class="welcome-subtitle">
                    Sistema Integrado de Gestión Hotelera
                </div>
                <div class="welcome-date">
                    <i class="fas fa-calendar-day"></i>
                    <span id="currentDate"></span>
                </div>
            </div>
            
            <!-- Accesos Directos del Sistema -->
            <div class="section-title">
                <i class="fas fa-rocket"></i>
                Accesos Directos del Sistema
            </div>
            
            <div class="shortcuts-grid">
                <!-- Hotelería -->
                <a href="/hoteleria/reservas" class="shortcut-card purple">
                    <div class="shortcut-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="shortcut-title">Reservas</div>
                    <div class="shortcut-description">
                        Gestiona reservas, check-in, check-out y calendario de ocupación
                    </div>
                </a>
                
                <a href="/hoteleria/habitaciones" class="shortcut-card blue">
                    <div class="shortcut-icon">
                        <i class="fas fa-bed"></i>
                    </div>
                    <div class="shortcut-title">Habitaciones</div>
                    <div class="shortcut-description">
                        Administra habitaciones, tipos y estados de disponibilidad
                    </div>
                </a>
                
                <a href="/hoteleria/huespedes" class="shortcut-card green">
                    <div class="shortcut-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="shortcut-title">Huéspedes</div>
                    <div class="shortcut-description">
                        Registro y gestión de información de huéspedes
                    </div>
                </a>
                
                <a href="/hoteleria/dashboard" class="shortcut-card orange">
                    <div class="shortcut-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="shortcut-title">Dashboard</div>
                    <div class="shortcut-description">
                        Métricas, KPIs y análisis de rendimiento del hotel
                    </div>
                </a>
                
                <a href="/hoteleria/reportes" class="shortcut-card red">
                    <div class="shortcut-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="shortcut-title">Reportes</div>
                    <div class="shortcut-description">
                        Genera reportes de ocupación, ingresos y estadísticas
                    </div>
                </a>
                
                <a href="/compras/proveedores" class="shortcut-card teal">
                    <div class="shortcut-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <div class="shortcut-title">Compras</div>
                    <div class="shortcut-description">
                        Gestión de proveedores, órdenes de compra y facturas
                    </div>
                </a>
            </div>
            
            <!-- Estadísticas Rápidas -->
            <div class="section-title">
                <i class="fas fa-tachometer-alt"></i>
                Vista Rápida
            </div>
            
            <div class="quick-stats">
                <div class="stat-card">
                    <div class="stat-label">
                        <i class="fas fa-calendar-check"></i> Reservas Hoy
                    </div>
                    <div class="stat-value" id="stat-reservas-hoy">--</div>
                </div>
                
                <div class="stat-card" style="border-left-color: #3b82f6;">
                    <div class="stat-label">
                        <i class="fas fa-door-open"></i> Habitaciones Disponibles
                    </div>
                    <div class="stat-value" id="stat-habitaciones-disponibles">--</div>
                </div>
                
                <div class="stat-card" style="border-left-color: #10b981;">
                    <div class="stat-label">
                        <i class="fas fa-percentage"></i> Ocupación Actual
                    </div>
                    <div class="stat-value" id="stat-ocupacion">--%</div>
                </div>
                
                <div class="stat-card" style="border-left-color: #f59e0b;">
                    <div class="stat-label">
                        <i class="fas fa-sign-in-alt"></i> Check-ins Pendientes
                    </div>
                    <div class="stat-value" id="stat-checkins">--</div>
                </div>
            </div>
            
            <!-- Información del Sistema -->
            <div class="box" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">
                            <i class="fas fa-info-circle"></i> Sistema
                        </div>
                        <div style="font-weight: 600; color: #1f2937;">
                            SGIH v1.0 - Sistema de Gestión Integral Hotelera
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">
                            <i class="fas fa-clock"></i> Última actualización
                        </div>
                        <div style="font-weight: 600; color: #1f2937;" id="last-update-time">
                            Cargando...
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <script>
            // Mostrar fecha actual
            const currentDate = document.getElementById('currentDate');
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDate.textContent = now.toLocaleDateString('es-ES', options);
            
            // Mostrar hora de última actualización
            const lastUpdateTime = document.getElementById('last-update-time');
            lastUpdateTime.textContent = now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Cargar estadísticas rápidas
            async function cargarEstadisticasRapidas() {
                try {
                    // Reservas de hoy
                    const hoy = new Date().toISOString().split('T')[0];
                    const responseReservas = await fetch('/hoteleria/reservas/api/calendario');
                    if (responseReservas.ok) {
                        const dataReservas = await responseReservas.json();
                        const reservasHoy = dataReservas.reservas.filter(r => {
                            const fechaCheckIn = new Date(r.fechaCheckIn).toISOString().split('T')[0];
                            return fechaCheckIn === hoy && r.estado !== 'CANCELADA';
                        });
                        document.getElementById('stat-reservas-hoy').textContent = reservasHoy.length;
                        
                        // Check-ins pendientes
                        const checkinsPendientes = reservasHoy.filter(r => 
                            r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE'
                        );
                        document.getElementById('stat-checkins').textContent = checkinsPendientes.length;
                    }
                    
                    // Habitaciones disponibles y ocupación
                    const responseHabitaciones = await fetch('/hoteleria/habitaciones/api/list');
                    if (responseHabitaciones.ok) {
                        const dataHabitaciones = await responseHabitaciones.json();
                        const habitaciones = dataHabitaciones.habitaciones || [];
                        const disponibles = habitaciones.filter(h => h.estado === 'DISPONIBLE').length;
                        const ocupadas = habitaciones.filter(h => h.estado === 'OCUPADA').length;
                        const total = habitaciones.length;
                        const ocupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
                        
                        document.getElementById('stat-habitaciones-disponibles').textContent = disponibles;
                        document.getElementById('stat-ocupacion').textContent = ocupacion + '%';
                    }
                } catch (error) {
                    console.error('Error cargando estadísticas:', error);
                }
            }
            
            // Cargar estadísticas al cargar la página
            cargarEstadisticasRapidas();
        </script>
    `});
};