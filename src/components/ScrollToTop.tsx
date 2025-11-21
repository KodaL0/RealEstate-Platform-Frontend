import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return; // allow in-page anchors

    const isChatPage = /^\/chat(\/.*)?$/.test(pathname);
    if (isChatPage) return; // ❌ skip scroll-to-top on chat routes

    const id = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 100);

    return () => clearTimeout(id);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
