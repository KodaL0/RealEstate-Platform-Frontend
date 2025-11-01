import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ListingsPage from "../components/ListingsPage";
import { encodeCanonicalPath, decodeLegacyQuery } from "../utils/searchCanonical";

const Buy = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.search) return;

    const params = new URLSearchParams(location.search);
    if (Array.from(params.keys()).length === 0) return;

    const { filters, extras } = decodeLegacyQuery(params);
    const canonicalPath = encodeCanonicalPath("buy", filters, extras);

    if (canonicalPath !== location.pathname) {
      navigate(canonicalPath, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return <ListingsPage listingType="sale" />;
};

export default Buy;
