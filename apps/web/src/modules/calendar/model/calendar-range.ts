export type CalendarVisibleRange = {
  from: string;
  to: string;
};

export const toCalendarVisibleRange = (start: Date, end: Date): CalendarVisibleRange => {
  return {
    from: start.toISOString(),
    to: end.toISOString()
  };
};

export const defaultCalendarVisibleRange = (): CalendarVisibleRange => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return toCalendarVisibleRange(start, end);
};
