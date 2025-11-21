import { Building2, CheckCircle, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/api";
import { useUser } from "../context/UserContext";

export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser();
  const token = searchParams.get("token");

  const handleVerification = useCallback(async () => {
    if (!token) {
      toast.error("Invalid verification link");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.auth.verifyEmail({ token });

      if (response.status === 200) {
        setVerificationStatus("success");
        setMessage("Email verified successfully! Your account is now active.");
        toast.success("Email verified successfully!");

        // Set user in context if provided
        const responseData = response.data as {
          user?: {
            id: number;
            username: string;
            email: string;
            is_developer?: boolean;
            name?: string;
          };
        };
        if (responseData.user) {
          setUser(responseData.user);
        }

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      setVerificationStatus("error");

      const err = error as { response?: { data?: { error?: string; message?: string } } };
      if (err.response?.data?.error) {
        setMessage(err.response.data.error);
        toast.error(err.response.data.error);
      } else if (err.response?.data?.message) {
        setMessage(err.response.data.message);
        toast.error(err.response.data.message);
      } else {
        setMessage("Email verification failed. The link may be expired or invalid.");
        toast.error("Email verification failed");
      }
    } finally {
      setIsVerifying(false);
    }
  }, [token, navigate, setUser]);

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setVerificationStatus("error");
      setMessage("Invalid verification link - no token provided");
    }
  }, [token, handleVerification]);

  const handleResendVerification = async () => {
    try {
      await api.auth.resendVerification();
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: unknown) {
      console.error("Resend verification error:", error);
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to resend verification email");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center">
        {/* Header */}
        <div className="flex justify-center items-center space-x-3 mb-6">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-3xl font-bold text-gray-800">PROPERTPRO</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verification</h2>

        {/* Status Content */}
        {isVerifying ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600">Verifying your email address...</p>
          </div>
        ) : verificationStatus === "success" ? (
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <p className="text-green-700 font-medium">Success!</p>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                You will be redirected to the login page shortly...
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Continue to Login
            </button>
          </div>
        ) : verificationStatus === "error" ? (
          <div className="space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <p className="text-red-700 font-medium">Verification Failed</p>
              <p className="text-gray-600">{message}</p>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Go to Login
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Processing your verification request...</p>
          </div>
        )}
      </div>
    </div>
  );
};
