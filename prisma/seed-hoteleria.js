// ====================================================================
// SCRIPT DE SEED PARA MÓDULO DE HOTELERÍA
// ====================================================================
// Genera datos de prueba realistas para visualizar el dashboard

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Función para generar fecha aleatoria
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Función para generar código de reserva único
function generarCodigoReserva() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const letra1 = letras[Math.floor(Math.random() * letras.length)];
  const letra2 = letras[Math.floor(Math.random() * letras.length)];
  return `${letra1}${letra2}${numeros}`;
}

async function main() {
  console.log('🏨 Iniciando seed de hotelería...');

  // ====================================================================
  // 1. TIPOS DE HABITACIÓN
  // ====================================================================
  console.log('📋 Creando tipos de habitación...');
  
  const tipoSuite = await prisma.tipoHabitacion.upsert({
    where: { id_tipoHab: 1 },
    update: {},
    create: {
      nombre: 'Suite Ejecutiva',
      descripcion: 'Amplia habitación con sala de estar separada, ideal para viajes de negocios',
      capacidad: 3,
      precioBase: 15000.00,
      activo: true
    }
  });

  const tipoDoble = await prisma.tipoHabitacion.upsert({
    where: { id_tipoHab: 2 },
    update: {},
    create: {
      nombre: 'Habitación Doble Superior',
      descripcion: 'Habitación espaciosa con dos camas individuales o una matrimonial',
      capacidad: 2,
      precioBase: 10000.00,
      activo: true
    }
  });

  const tipoMatrimonial = await prisma.tipoHabitacion.upsert({
    where: { id_tipoHab: 3 },
    update: {},
    create: {
      nombre: 'Matrimonial Estándar',
      descripcion: 'Habitación confortable con cama matrimonial',
      capacidad: 2,
      precioBase: 8000.00,
      activo: true
    }
  });

  const tipoIndividual = await prisma.tipoHabitacion.upsert({
    where: { id_tipoHab: 4 },
    update: {},
    create: {
      nombre: 'Individual Económica',
      descripcion: 'Habitación individual perfecta para viajeros solos',
      capacidad: 1,
      precioBase: 6000.00,
      activo: true
    }
  });

  const tipoFamiliar = await prisma.tipoHabitacion.upsert({
    where: { id_tipoHab: 5 },
    update: {},
    create: {
      nombre: 'Familiar Deluxe',
      descripcion: 'Habitación amplia ideal para familias, con dos camas matrimoniales',
      capacidad: 4,
      precioBase: 18000.00,
      activo: true
    }
  });

  console.log('✓ Tipos de habitación creados');

  // ====================================================================
  // 2. HABITACIONES
  // ====================================================================
  console.log('🚪 Creando habitaciones...');

  const habitaciones = [];
  const estados = ['DISPONIBLE', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO'];
  
  // 20 habitaciones distribuidas en tipos
  const distribucion = [
    { tipo: tipoSuite, cantidad: 3, pisoInicio: 3 },
    { tipo: tipoDoble, cantidad: 6, pisoInicio: 2 },
    { tipo: tipoMatrimonial, cantidad: 5, pisoInicio: 1 },
    { tipo: tipoIndividual, cantidad: 4, pisoInicio: 1 },
    { tipo: tipoFamiliar, cantidad: 2, pisoInicio: 2 }
  ];

  let numeroActual = 101;
  for (const dist of distribucion) {
    for (let i = 0; i < dist.cantidad; i++) {
      // Asignar estados de forma realista
      let estado = 'DISPONIBLE';
      const rand = Math.random();
      if (rand < 0.40) estado = 'OCUPADA';      // 40% ocupadas
      else if (rand < 0.50) estado = 'LIMPIEZA'; // 10% en limpieza
      else if (rand < 0.55) estado = 'MANTENIMIENTO'; // 5% mantenimiento
      // 45% disponibles

      const hab = await prisma.habitacion.upsert({
        where: { numero: numeroActual },
        update: { estado },
        create: {
          numero: numeroActual,
          id_tipoHab: dist.tipo.id_tipoHab,
          piso: dist.pisoInicio + Math.floor(i / 3),
          estado,
          activo: true
        }
      });
      habitaciones.push(hab);
      numeroActual++;
    }
  }

  console.log(`✓ ${habitaciones.length} habitaciones creadas`);

  // ====================================================================
  // 3. HUÉSPEDES
  // ====================================================================
  console.log('👥 Creando huéspedes...');

  const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Roberto', 'Laura', 'Diego', 'Sofía', 
                   'Miguel', 'Carmen', 'Javier', 'Patricia', 'Fernando', 'Isabel', 'Pablo'];
  const apellidos = ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 
                     'Pérez', 'Gómez', 'Díaz', 'Torres', 'Ramírez', 'Flores', 'Castro'];

  const huespedes = [];
  for (let i = 0; i < 50; i++) {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const dni = (30000000 + Math.floor(Math.random() * 15000000)).toString();
    
    const huesped = await prisma.huesped.create({
      data: {
        nombre,
        apellido,
        documento: dni,
        telefono: `+54 9 387 ${Math.floor(Math.random() * 9000000) + 1000000}`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.com`
      }
    });
    huespedes.push(huesped);
  }

  console.log(`✓ ${huespedes.length} huéspedes creados`);

  // ====================================================================
  // 4. RESERVAS - ÚLTIMOS 30 DÍAS (PASADO)
  // ====================================================================
  console.log('📅 Creando reservas históricas (últimos 30 días)...');

  const hoy = new Date();
  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  let reservasCreadas = 0;
  const habitacionesOcupadas = habitaciones.filter(h => h.estado === 'OCUPADA');

  // Generar reservas para los últimos 30 días
  for (let dia = 0; dia < 30; dia++) {
    const fecha = new Date(hace30Dias);
    fecha.setDate(fecha.getDate() + dia);
    
    // Entre 3 y 8 check-ins por día
    const checkInsDelDia = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < checkInsDelDia; i++) {
      const huesped = huespedes[Math.floor(Math.random() * huespedes.length)];
      const habitacion = habitaciones[Math.floor(Math.random() * habitaciones.length)];
      const tipoHab = distribucion.find(d => d.tipo.id_tipoHab === habitacion.id_tipoHab).tipo;
      
      const noches = Math.floor(Math.random() * 5) + 1; // 1 a 5 noches
      const fechaCheckOut = new Date(fecha);
      fechaCheckOut.setDate(fechaCheckOut.getDate() + noches);
      
      // Calcular total con variación de precio (±20%)
      const variacion = 0.8 + (Math.random() * 0.4);
      const total = parseFloat(tipoHab.precioBase) * noches * variacion;
      
      // Determinar estado según la fecha
      let estado = 'CHECKED_OUT';
      let fechaCheckInReal = fecha;
      let fechaCheckOutReal = fechaCheckOut;
      
      if (fechaCheckOut > hoy) {
        estado = 'CHECKED_IN';
        fechaCheckOutReal = null;
      }
      
      try {
        await prisma.reserva.create({
          data: {
            codigoReserva: generarCodigoReserva(),
            id_huesped: huesped.id_huesped,
            id_hab: habitacion.id_hab,
            fechaCheckIn: fecha,
            fechaCheckOut: fechaCheckOut,
            cantAdultos: Math.floor(Math.random() * tipoHab.capacidad) + 1,
            cantNinos: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
            estado,
            total: total.toFixed(2),
            fechaCheckInReal,
            fechaCheckOutReal
          }
        });
        reservasCreadas++;
      } catch (error) {
        // Ignorar duplicados de código de reserva
        if (!error.message.includes('Unique constraint')) {
          console.error('Error creando reserva:', error.message);
        }
      }
    }
  }

  console.log(`✓ ${reservasCreadas} reservas históricas creadas`);

  // ====================================================================
  // 5. RESERVAS - HOY (CHECK-INS Y CHECK-OUTS PENDIENTES)
  // ====================================================================
  console.log('📅 Creando reservas de hoy...');

  const hoySinHora = new Date(hoy.setHours(0, 0, 0, 0));
  
  // 5 check-ins pendientes para hoy
  for (let i = 0; i < 5; i++) {
    const huesped = huespedes[Math.floor(Math.random() * huespedes.length)];
    const habitacionDisp = habitaciones.filter(h => h.estado === 'DISPONIBLE')[i % 10];
    if (!habitacionDisp) continue;
    
    const tipoHab = distribucion.find(d => d.tipo.id_tipoHab === habitacionDisp.id_tipoHab).tipo;
    const noches = Math.floor(Math.random() * 4) + 2;
    const fechaCheckOut = new Date(hoySinHora);
    fechaCheckOut.setDate(fechaCheckOut.getDate() + noches);
    
    const total = parseFloat(tipoHab.precioBase) * noches;
    
    try {
      await prisma.reserva.create({
        data: {
          codigoReserva: generarCodigoReserva(),
          id_huesped: huesped.id_huesped,
          id_hab: habitacionDisp.id_hab,
          fechaCheckIn: hoySinHora,
          fechaCheckOut: fechaCheckOut,
          cantAdultos: Math.floor(Math.random() * tipoHab.capacidad) + 1,
          cantNinos: 0,
          estado: 'CONFIRMADA',
          total: total.toFixed(2)
        }
      });
      reservasCreadas++;
    } catch (error) {
      // Ignorar duplicados
    }
  }

  // 3 check-outs para hoy
  for (let i = 0; i < 3; i++) {
    const huesped = huespedes[Math.floor(Math.random() * huespedes.length)];
    const habitacionOcup = habitacionesOcupadas[i % habitacionesOcupadas.length];
    if (!habitacionOcup) continue;
    
    const tipoHab = distribucion.find(d => d.tipo.id_tipoHab === habitacionOcup.id_tipoHab).tipo;
    const hace3Dias = new Date(hoySinHora);
    hace3Dias.setDate(hace3Dias.getDate() - 3);
    
    const total = parseFloat(tipoHab.precioBase) * 3;
    
    try {
      await prisma.reserva.create({
        data: {
          codigoReserva: generarCodigoReserva(),
          id_huesped: huesped.id_huesped,
          id_hab: habitacionOcup.id_hab,
          fechaCheckIn: hace3Dias,
          fechaCheckOut: hoySinHora,
          cantAdultos: 2,
          cantNinos: 0,
          estado: 'CHECKED_IN',
          total: total.toFixed(2),
          fechaCheckInReal: hace3Dias
        }
      });
      reservasCreadas++;
    } catch (error) {
      // Ignorar duplicados
    }
  }

  console.log(`✓ Reservas de hoy creadas`);

  // ====================================================================
  // 6. RESERVAS - PRÓXIMOS 30 DÍAS (FORECAST)
  // ====================================================================
  console.log('📅 Creando reservas futuras (próximos 30 días)...');

  for (let dia = 1; dia <= 30; dia++) {
    const fecha = new Date(hoySinHora);
    fecha.setDate(fecha.getDate() + dia);
    
    // Más reservas en fines de semana
    const diaSemana = fecha.getDay();
    const esFinde = diaSemana === 5 || diaSemana === 6;
    const checkInsDelDia = esFinde ? Math.floor(Math.random() * 6) + 5 : Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < checkInsDelDia; i++) {
      const huesped = huespedes[Math.floor(Math.random() * huespedes.length)];
      const habitacion = habitaciones[Math.floor(Math.random() * habitaciones.length)];
      const tipoHab = distribucion.find(d => d.tipo.id_tipoHab === habitacion.id_tipoHab).tipo;
      
      const noches = Math.floor(Math.random() * 4) + 1;
      const fechaCheckOut = new Date(fecha);
      fechaCheckOut.setDate(fechaCheckOut.getDate() + noches);
      
      const total = parseFloat(tipoHab.precioBase) * noches;
      
      try {
        await prisma.reserva.create({
          data: {
            codigoReserva: generarCodigoReserva(),
            id_huesped: huesped.id_huesped,
            id_hab: habitacion.id_hab,
            fechaCheckIn: fecha,
            fechaCheckOut: fechaCheckOut,
            cantAdultos: Math.floor(Math.random() * tipoHab.capacidad) + 1,
            cantNinos: Math.random() > 0.6 ? Math.floor(Math.random() * 2) : 0,
            estado: dia <= 7 ? 'CONFIRMADA' : 'PENDIENTE',
            total: total.toFixed(2)
          }
        });
        reservasCreadas++;
      } catch (error) {
        // Ignorar duplicados
      }
    }
  }

  console.log(`✓ Reservas futuras creadas`);
  console.log(`\n✅ SEED COMPLETADO`);
  console.log(`   Total reservas: ${reservasCreadas}`);
  console.log(`   Total habitaciones: ${habitaciones.length}`);
  console.log(`   Total huéspedes: ${huespedes.length}`);
  console.log(`\n🎉 Base de datos poblada exitosamente!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
