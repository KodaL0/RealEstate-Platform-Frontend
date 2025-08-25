import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

export function RequireAuth({ children }: { children: ReactElement }) {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    // or return a spinner/loading indicator
    return <div>Checking authentication…</div>;
  }

  if (!user) {
    // Redirect unauthenticated users to /login, preserving their intended path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Gate specifically for developer-only pages
export function RequireDeveloper({ children }: { children: ReactElement }) {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div>Checking authentication…</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.is_developer) {
    return <Navigate to="/" replace />;
  }

  return children;
}