function toUpperCaseFirstLetter(text: string) {
  if (!text) {
    return text;
  }

  const letter = text[0].toUpperCase();
  return letter + text.slice(1);
}

export const utils = {
  toUpperCaseFirstLetter,
};
