import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Delay helps on mobile when layout shifts happen
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth", // change to "auto" if you prefer no animation
      });
    }, 100); // slight delay for smoother behavior on mobile
  }, [pathname]);

  return null;
};

export default ScrollToTop;
