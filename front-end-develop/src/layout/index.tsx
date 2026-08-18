import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import React, { useEffect } from "react";
import "./styles.css";
import { useLocation } from "react-router-dom";

function ScrollToSection() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  return null;
}

function AppLayout({
  children,
  navbarContainerType,
  styles,
}: {
  children: React.ReactNode;
  navbarContainerType?: "container-fluid" | "container" | undefined;
  styles?: any;
  showNavbar?: boolean;
}) {
  return (
    <div className="appWrapper">
      <ScrollToSection />
      <Navbar containerType={navbarContainerType} />
      <div className="appWrapperContent" style={{ ...styles }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default AppLayout;
