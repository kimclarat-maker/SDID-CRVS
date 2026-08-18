import React, { useEffect, useRef } from "react";

const useOutsideClick = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(); // Call the callback function when clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};

type Props = {
  children: React.ReactNode;
  onClose: () => void;
};

const ComponentWithOutsideClick: React.FC<Props> = ({ children, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  useOutsideClick(componentRef, onClose);

  return <div ref={componentRef}>{children}</div>;
};

export default ComponentWithOutsideClick;
