const formatHour12 = (d) => {
  const normalizedHour = d.getHours() % 24;
  const period = normalizedHour >= 12 ? 'PM' : 'AM';
  const displayHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${displayHour}:${mins} ${period}`;
};

const getAvailableSlots = (stockist, now = new Date()) => {
  if (!stockist) return [];
  if (stockist.manual_closed && !stockist.closed_until) return [];

  const opening = stockist.opening_time || '08:00';
  const closing = stockist.closing_time || '20:00';
  const prepMinutes = stockist.prep_eta_minutes || 10;

  const [opH, opM] = opening.split(':').map(Number);
  const [clH, clM] = closing.split(':').map(Number);

  const is24Hours = (opH === clH && opM === clM);
  const isOvernight = !is24Hours && (clH < opH || (clH === opH && clM < opM));

  const minTime = new Date(now.getTime() + prepMinutes * 60 * 1000);
  const closedUntil = stockist.closed_until ? new Date(stockist.closed_until) : null;
  const effectiveMinTime = closedUntil && closedUntil > minTime ? closedUntil : minTime;

  const slots = [];
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let dayOffset = -1; dayOffset <= 2; dayOffset++) {
    const currentDay = new Date(todayDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    
    // Calculate the start of the opening block for this operating day
    const op = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), opH, opM, 0);
    
    // Determine closing time
    let cl;
    if (is24Hours) {
      cl = new Date(op.getTime() + 24 * 60 * 60 * 1000);
    } else if (isOvernight) {
      cl = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() + 1, clH, clM, 0);
    } else {
      cl = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), clH, clM, 0);
    }

    // First slot boundary: if opM > 0, start at next hour. (e.g. 09:30 -> 10:00)
    let slotTime = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), opH + (opM > 0 ? 1 : 0), 0, 0).getTime();
    
    const clTime = cl.getTime();
    
    while (slotTime + 60 * 60 * 1000 <= clTime) {
      if (slotTime >= effectiveMinTime.getTime()) {
        const slotStart = new Date(slotTime);
        const year = slotStart.getFullYear();
        const month = String(slotStart.getMonth() + 1).padStart(2, '0');
        const day = String(slotStart.getDate()).padStart(2, '0');
        const hourStr = String(slotStart.getHours()).padStart(2, '0');
        const minStr = String(slotStart.getMinutes()).padStart(2, '0');
        
        const value = `${year}-${month}-${day}T${hourStr}:${minStr}`;
        const endSlot = new Date(slotTime + 60 * 60 * 1000);
        
        const isToday = slotStart.getDate() === todayDate.getDate() && slotStart.getMonth() === todayDate.getMonth() && slotStart.getFullYear() === todayDate.getFullYear();
        const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
        const isTomorrow = slotStart.getDate() === tomorrowDate.getDate() && slotStart.getMonth() === tomorrowDate.getMonth() && slotStart.getFullYear() === tomorrowDate.getFullYear();
        
        const prefix = isToday ? 'Today' : (isTomorrow ? 'Tomorrow' : `${year}-${month}-${day}`);
        const label = `${prefix}, ${formatHour12(slotStart)} – ${formatHour12(endSlot)}`;
        
        slots.push({ value, label, day: isToday ? 'today' : 'tomorrow', time: slotTime });
      }
      slotTime += 60 * 60 * 1000;
    }
  }

  const uniqueSlots = [];
  const seen = new Set();
  for (const slot of slots.sort((a, b) => a.time - b.time)) {
    if (!seen.has(slot.value)) {
      seen.add(slot.value);
      uniqueSlots.push(slot);
      if (uniqueSlots.length >= 8) break;
    }
  }

  return uniqueSlots.map(({ value, label, day }) => ({ value, label, day }));
};

const runTests = () => {
  const stockist2 = { opening_time: '09:30', closing_time: '21:00', prep_eta_minutes: 10 };
  console.log('\\nTest 4 (now 09:00, 09:30-21:00):\\n', getAvailableSlots(stockist2, new Date('2026-10-09T09:00:00')));
  
  const stockist1 = { opening_time: '09:00', closing_time: '21:00', prep_eta_minutes: 10 };
  console.log('\\nTest 1 (now 10:20, 09:00-21:00):\\n', getAvailableSlots(stockist1, new Date('2026-10-09T10:20:00')));
};
runTests();
