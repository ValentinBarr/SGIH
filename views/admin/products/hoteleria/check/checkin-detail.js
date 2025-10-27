const layout = require('../../layout'); // Ajusta la ruta a tu layout principal
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

// Helper para formatear fechas largas
const formatFullDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    // Ajuste de zona horaria (opcional pero recomendado)
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
};

// Helper para calcular noches (puede venir del mismo sitio que el de la lista)
const calcNoches = (checkIn, checkOut) => {
    const { differenceInDays } = require('date-fns');
    const noches = differenceInDays(new Date(checkOut), new Date(checkIn));
    return noches <= 0 ? 1 : noches;
};

module.exports = ({ reserva }) => {
    // Extraer datos para facilitar el acceso
    const huesped = reserva.Huesped;
    const habitacion = reserva.Habitacion; // Asume que el Repo incluye Habitacion y TipoHabitacion
    const tipoHab = habitacion?.TipoHabitacion;
    const noches = calcNoches(reserva.fechaCheckIn, reserva.fechaCheckOut);

    return layout({
        content: `
        <section class="section">
            <div class="container is-max-desktop">
                <nav class="breadcrumb" aria-label="breadcrumbs">
                    <ul>
                        <li><a href="/hoteleria/board">Tablero</a></li>
                        <li class="is-active"><a href="#" aria-current="page">Detalles Check-in</a></li>
                    </ul>
                </nav>

                <h1 class="title is-3 has-text-primary-dark">Confirmación de Check-in</h1>
                <p class="subtitle is-5">Reserva #${reserva.codigoReserva}</p>
                <hr>

                <div class="columns">
                    <div class="column is-7">
                        <div class="box">
                            <h2 class="title is-5 mb-4">Información de la Reserva</h2>
                            
                            <div class="field">
                                <label class="label is-small has-text-grey">Habitación</label>
                                <p class="is-size-5 has-text-weight-semibold">
                                     N° ${habitacion?.numero || 'N/A'} (${tipoHab?.nombre || 'N/A'})
                                </p>
                                <p class="is-size-7 has-text-grey">Piso: ${habitacion?.piso || 'N/A'}</p>
                            </div>

                            <div class="columns mt-4">
                                <div class="column">
                                    <div class="field">
                                        <label class="label is-small has-text-grey">Check-in Programado</label>
                                        <p>${formatFullDate(reserva.fechaCheckIn)}</p>
                                    </div>
                                </div>
                                <div class="column">
                                     <div class="field">
                                        <label class="label is-small has-text-grey">Check-out Programado</label>
                                        <p>${formatFullDate(reserva.fechaCheckOut)}</p>
                                        <p class="is-size-7 has-text-grey">(${noches} ${noches === 1 ? 'noche' : 'noches'})</p>
                                    </div>
                                </div>
                            </div>

                             <div class="columns">
                                <div class="column is-one-third">
                                     <div class="field">
                                        <label class="label is-small has-text-grey">Adultos</label>
                                        <p>${reserva.cantAdultos}</p>
                                    </div>
                                </div>
                                 <div class="column is-one-third">
                                     <div class="field">
                                        <label class="label is-small has-text-grey">Niños</label>
                                        <p>${reserva.cantNinos}</p>
                                    </div>
                                </div>
                                <div class="column is-one-third">
                                     <div class="field">
                                        <label class="label is-small has-text-grey">Total Estimado</label>
                                        <p class="has-text-weight-bold has-text-success is-size-5">$${Number(reserva.total).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            ${reserva.observaciones ? `
                            <div class="field mt-4">
                                <label class="label is-small has-text-grey">Observaciones</label>
                                <div class="content is-small">
                                    <blockquote>${reserva.observaciones}</blockquote>
                                </div>
                            </div>
                            ` : ''}

                        </div>
                    </div>

                    <div class="column is-5">
                         <div class="box has-background-info-light">
                             <h2 class="title is-5 mb-4 has-text-info-dark">Huésped Principal</h2>
                             <div class="field">
                                <label class="label is-small">Nombre Completo</label>
                                <p class="is-size-5">${huesped.apellido}, ${huesped.nombre}</p>
                             </div>
                             <div class="field mt-3">
                                <label class="label is-small">Documento</label>
                                <p>${huesped.documento || 'No registrado'}</p>
                             </div>
                             <div class="field mt-3">
                                <label class="label is-small">Teléfono</label>
                                <p>${huesped.telefono || 'No registrado'}</p>
                             </div>
                              <div class="field mt-3">
                                <label class="label is-small">Email</label>
                                <p>${huesped.email || 'No registrado'}</p>
                             </div>
                         </div>

                         <div class="mt-5 has-text-centered">
                             <form method="POST" action="/hoteleria/reservas/${reserva.id_reserva}/checkin">
                                 <button type="submit" class="button is-success is-large is-fullwidth">
                                     <span class="icon is-medium"><i class="fas fa-check-circle"></i></span>
                                     <span>Confirmar Check-in Ahora</span>
                                 </button>
                             </form>
                             <a href="/hoteleria/board" class="button is-light mt-3 is-fullwidth">Volver al Tablero</a>
                         </div>
                    </div>
                </div>

            </div>
        </section>
        `
    });
};