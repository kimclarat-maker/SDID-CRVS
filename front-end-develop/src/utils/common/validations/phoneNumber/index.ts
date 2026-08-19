// Rwanda-deployment-specific: hardcodes the +250 country code and Rwanda's
// national number length. A generic deployment will need its own validator.
export const validateRwandaPhoneNumber = (phoneNumber: string) => {
  // Remove all non-numeric characters (except + for country code)
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, "");

  // Check if the number starts with 0 and remove it
  if (cleanedNumber.startsWith("0")) {
    phoneNumber = "+250" + cleanedNumber.slice(1);
  } else if (!cleanedNumber.startsWith("+250")) {
    // If it doesn't start with +250, assume it's missing the country code
    phoneNumber = "+250" + cleanedNumber;
  }

  // Validate if the final phone number has the correct length
  const rwandaPhoneNumberRegex = /^\+250\d{9}$/;

  if (rwandaPhoneNumberRegex.test(phoneNumber)) {
    return phoneNumber; // Valid Rwandan phone number
  } else {
    return null; // Invalid phone number
  }
};
