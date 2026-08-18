function generateTimeRanges() {
  const timeRanges = [];
  const startHour = 7; // 7 AM
  const endHour = 17; // 5 PM

  for (let hour = startHour; hour <= endHour; hour++) {
    const hourString = hour < 10 ? `0${hour}` : `${hour}`;
    const label = `${hourString}:00`;
    const value = `${hourString}:00`;
    timeRanges.push({ label, value });
  }

  return timeRanges;
}

const timeRanges = generateTimeRanges();

export default timeRanges;
