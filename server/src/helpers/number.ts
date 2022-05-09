function parseIntNumber(numberString: string, defaultValue: number) {
  const number = parseInt(numberString, 10);
  if (!isNaN(number)) {
    return number;
  }
  return defaultValue;
}

export const numberUtils = {
  parseInt:parseIntNumber,
};
