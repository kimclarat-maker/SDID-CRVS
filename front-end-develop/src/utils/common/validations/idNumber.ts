function validateIDNumber(idNumber: string) {
  // Check if ID length is valid (assuming the ID has at least 5 digits)
  if (idNumber.length < 16) {
    return {
      error: "Invalid ID: ID number is too short.",
    };
  }

  // Check the first digit for nationality
  const firstDigit = idNumber[0];
  let nationality = "";
  if (firstDigit === "1") {
    nationality = "RWANDAN";
  } else if (firstDigit === "2") {
    nationality = "FOREIGN";
  } else if (firstDigit === "3") {
    nationality = "REFUGEE";
  } else {
    return {
      error:
        "Invalid ID: First digit must be 1 (Rwandan), 2 (Foreign), or 3 (Refugee).",
    };
  }

  // Check the 5th digit for gender
  const fifthDigit = idNumber[4];
  let gender = "";
  if (fifthDigit === "7") {
    gender = "FEMALE";
  } else if (fifthDigit === "8") {
    gender = "MALE";
  } else {
    return {
      error: "Invalid ID: Fifth digit must be 7 (Female) or 8 (Male).",
    };
  }

  return {
    nationality,
    gender,
  };
}
