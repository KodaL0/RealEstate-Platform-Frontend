import { Building2 } from "lucide-react";
import type React from "react";
import { SiGoogle } from "react-icons/si";
import { useLocation, useNavigate } from "react-router-dom";
import { NativeLogin } from "../components/NativeLogin";
import { useUser } from "../context/UserContext";

export const AuthPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = () => {
    // Preserve intended destination
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
    const nextParam = encodeURIComponent(window.location.origin + from);
    const loginUrl = `/accounts/google/login/?next=${nextParam}`;
    console.log("Starting Google OAuth flow:", loginUrl);
    window.location.href = loginUrl;
  };

  const handleNativeSuccess = () => {
    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
  };

  if (user) {
    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center space-x-2 mb-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">PROPERTPRO</span>
          </div>
        </div>

        {/* Single-screen: Native login and Google button */}

        <NativeLogin onSuccess={handleNativeSuccess} />
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-3 text-sm font-medium
                       text-gray-700 bg-white hover:bg-blue-50 transition-all duration-150 shadow-sm hover:shadow-md mt-4"
        >
          <SiGoogle className="h-4 w-4 mr-2 text-[#4285F4]" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};
