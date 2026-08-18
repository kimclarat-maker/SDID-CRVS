import { useState, useEffect } from "react";

export default () => {
  const [isTablet, setIsTablet] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const tabletMediaQuery = window.matchMedia("(max-width: 1024px)");
    const phoneMediaQuery = window.matchMedia("(max-width: 600px)");

    const handleResize = () => {
      setIsTablet(tabletMediaQuery.matches);
      setIsPhone(phoneMediaQuery.matches);
    };

    handleResize(); // Initial check

    // Listen for resize events
    window.addEventListener("resize", handleResize);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return { isTablet, isPhone };
};
