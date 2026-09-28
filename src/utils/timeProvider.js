let globalShiftDays = 0;

export const getCurrentAppTime = () => {
  return Date.now() + (globalShiftDays * 24 * 60 * 60 * 1000);
};

export const setGlobalTimeShift = (days) => {
  globalShiftDays = days;
};

export const getGlobalTimeShift = () => {
  return globalShiftDays;
};
