import { NavigateFunction } from "react-router-dom";

export const goBack = (navigate: NavigateFunction) => {
  if (window.history.length > 2) {
    // There is a previous page
    navigate(-1);
  } else {
    navigate("/landing"); // Navigate to a fallback route if no previous page
  }
};
`   `;
