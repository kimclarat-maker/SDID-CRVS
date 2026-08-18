type ListType = {
  label: string;
  value: string;
  next?: string;
  previous?: string;
  required?: boolean;
};

const list: ListType[] = [
  {
    label: "Selfie",
    value: "selfie",
    next: "iris",
    previous: "signature",
    required: true,
  },
  {
    label: "Iris",
    value: "iris",
    next: "fingerprint",
    required: true,
  },
  {
    label: "Fingerprint",
    value: "fingerprint",
    next: "signature",
    previous: "iris",
    required: true,
  },
  {
    label: "Signature",
    value: "signature",
    next: "selfie",
    previous: "fingerprint",
  },
];

export default list;
