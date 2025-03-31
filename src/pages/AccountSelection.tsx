import { Link } from "react-router-dom";

const AccountSelection = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Select an Account</h2>
        <p className="text-gray-600 mb-6">Choose where you want to log in.</p>

        <div className="space-y-4">
          {/* Login to Website */}
          <Link
            to="/login"
            className="block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
          >
            Login to Website
          </Link>
          <p className="text-sm text-gray-600 mt-2">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>

          {/* Separator Line */}
          <div className="border-t border-gray-300 my-4"></div>

          {/* Login to CRM */}
          <a
            href="https://google.com" // Replace with your CRM login URL
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition"
          >
            Login to CRM
          </a>
        </div>
      </div>
    </div>
  );
};

export default AccountSelection;
