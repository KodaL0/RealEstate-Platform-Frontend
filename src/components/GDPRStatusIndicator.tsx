import type React from "react";

interface GDPRStatusIndicatorProps {
  variant?: "banner" | "badge" | "inline";
  showDetails?: boolean;
  className?: string;
}

const GDPRStatusIndicator: React.FC<GDPRStatusIndicatorProps> = () => {
  // Component intentionally disabled - always returns null
  // Re-enable by uncommenting the implementation below if needed in the future
  return null;
};

export default GDPRStatusIndicator;
