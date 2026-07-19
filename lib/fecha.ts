/**
 * Los inputs <input type="datetime-local"> y <input type="date"> del
 * navegador esperan la hora LOCAL de quien los usa, no UTC. Usar
 * new Date().toISOString() para el valor inicial es un error común: eso
 * da la hora UTC, que en Bolivia (UTC-4) queda 4 horas adelantada.
 * Estas funciones arman el string correcto en hora local.
 */
export function valorFechaHoraLocal(fecha = new Date()) {
  const offsetMs = fecha.getTimezoneOffset() * 60000;
  const local = new Date(fecha.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export function valorFechaLocal(fecha = new Date()) {
  const offsetMs = fecha.getTimezoneOffset() * 60000;
  const local = new Date(fecha.getTime() - offsetMs);
  return local.toISOString().slice(0, 10);
}
