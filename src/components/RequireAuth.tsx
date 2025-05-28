// src/components/RequireAuth.tsx
import { useContext } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useContext(UserContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
