import React from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">
          Welcome to Chippy Inn
        </h2>

        <p className="text-center text-gray-600 mb-6">
          Please select your login type
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        <div className="space-y-4">
          {/* Staff login button */}
        <div className="text-center">
            <button
              onClick={() => navigate("/staff-login")}
              className="px-6 py-2 w-full bg-blue-600 text-white rounded transition transform hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              User Login
            </button>
          </div>   

           {/* Guest login button */}
        {/*}  <div className="text-center">
            <button
              onClick={() => navigate("/guest-login")}
              className="px-6 py-2 w-full bg-green-600 text-white rounded transition transform hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              Guest Login
            </button>
          </div>   */}
        </div>
      </div>
    </div>  
  );
};

export default Login;



