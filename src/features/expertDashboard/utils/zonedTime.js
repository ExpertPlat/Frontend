/** Local wall-clock time in a named time zone <-> UTC instants, without a date library. */
function offsetMinutes(utcDate, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(utcDate);
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  return (Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - utcDate.getTime()) / 60000;
}

/** '2026-10-12T10:00' typed in `timeZone` -> '2026-10-12T06:00:00.000Z'. */
export function localInputToUtc(value, timeZone) {
  const [date, time] = String(value).split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let utc = guess - offsetMinutes(new Date(guess), timeZone) * 60000;
  utc = guess - offsetMinutes(new Date(utc), timeZone) * 60000; // second pass settles DST edges
  return new Date(utc).toISOString();
}

/** UTC instant -> 'YYYY-MM-DDTHH:mm' as it reads on a wall clock in `timeZone` (for <input type="datetime-local">). */
export function utcToLocalInput(iso, timeZone) {
  const date = new Date(iso);
  const shifted = new Date(date.getTime() + offsetMinutes(date, timeZone) * 60000);
  return shifted.toISOString().slice(0, 16);
}
