export function constructAbbr(name: string) {
  // Split the name into individual words
  let words = name.split(" ");

  // Take the first word (or the whole name if only one word)
  let firstWord = words[0];

  // Take the first two characters of the first word
  let firstTwoChars = firstWord.slice(0, 2);

  // Take the first character of the second word if it exists
  let thirdChar = words.length > 1 ? words[1].charAt(0) : "";

  // Return the concatenated result
  return firstTwoChars + thirdChar;
}
