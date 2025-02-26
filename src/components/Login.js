import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserCircle } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Project Paper Cut</h1>
          <p className="text-gray-600">Sign in to access the improvement ideas portal</p>
        </div>
        
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-100 p-4 rounded-full">
            <UserCircle size={64} className="text-indigo-600" />
          </div>
        </div>
        
        <button
          onClick={login}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Sign in with Microsoft
        </button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Only authorized company employees can access this application
        </p>
      </div>
    </div>
  );
};

export default Login;
