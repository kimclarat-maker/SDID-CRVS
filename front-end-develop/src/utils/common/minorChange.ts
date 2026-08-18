function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Populate the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deletion
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j - 1] + 1 // Substitution
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

export function isMinorNameChange(
  oldName: string = "",
  newName: string = ""
): boolean {
  const sanitize = (value: string) => value?.trim().toLowerCase();

  const oldSanitized = sanitize(oldName);
  const newSanitized = sanitize(newName);

  if (oldSanitized === newSanitized) {
    // Names are identical
    return false;
  }

  const distance = calculateLevenshteinDistance(oldSanitized, newSanitized);

  // A minor change is defined as having a Levenshtein distance of 2 or less
  return distance <= 1;
}

export function isMinorDOBChange(
  oldDOB: string = "",
  newDOB: string = ""
): boolean {
  const parseDate = (
    date: string
  ): { day: string; month: string; year: string } | null => {
    // Match various date formats: DD/MM/YYYY, YYYY-MM-DD, etc.
    const regex =
      /^(?:(\d{2})[\/\-\. ](\d{2})[\/\-\. ](\d{4})|(\d{4})[\/\-\. ](\d{2})[\/\-\. ](\d{2}))$/;

    const match = date.trim().match(regex);

    if (!match) return null;

    if (match[1] && match[2] && match[3]) {
      // Format: DD/MM/YYYY or similar
      return { day: match[1], month: match[2], year: match[3] };
    } else if (match[4] && match[5] && match[6]) {
      // Format: YYYY/MM/DD or similar
      return { day: match[6], month: match[5], year: match[4] };
    }

    return null;
  };
  const oldDate = parseDate(oldDOB);
  const newDate = parseDate(newDOB);

  if (!oldDate || !newDate) {
    // Invalid format for one or both dates
    return false;
  }

  // Compare the year and check if only the day and month have changed

  if (
    oldDate.year === newDate.year
    // && oldDate.month === "01" &&
    // oldDate.day === "01"
  ) {
    return true;
  }

  // Not a minor change if the year is different or no change is detected
  return false;
}

// Parent’s postnames: applications without parents postnames or wrongly spelled postnames in
// case the surname match or missing postnames
export function isSingleNameMatch(oldData: string, newData: string): boolean {
  // Check if oldData is a single name (no spaces)
  if (!oldData) return false;
  const isOldDataSingleName = !oldData.includes(" ");

  if (isOldDataSingleName && newData) {
    // Get the first name from newData
    const firstNameInNewData = newData.split(" ")[0];

    // Compare oldData with the first name in newData
    return firstNameInNewData === oldData;
  }

  // If oldData is not a single name, return false
  return false;
}
