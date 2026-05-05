import React, { useState } from 'react';
import API from "./api";
import { useNavigate } from 'react-router-dom';

const Auth = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Validation Logic
  const validate = () => {
    if (!formData.email.includes('@')) return "Invalid email address";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (!isLogin && !formData.name) return "Name is required for signup";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const { data } = await axios.post(`http://localhost:5000${endpoint}`, formData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 className="text-3xl font-black mb-2 text-slate-800 uppercase tracking-tighter">
          {isLogin ? 'Login' : 'Create Account'}
        </h2>
        {error && <p className="text-red-500 text-sm font-bold mb-4">⚠️ {error}</p>}
        
        {!isLogin && (
          <input type="text" placeholder="Full Name" className="w-full p-4 mb-4 bg-slate-50 border rounded-2xl"
            onChange={(e) => setFormData({...formData, name: e.target.value})} />
        )}
        <input type="email" placeholder="Email" className="w-full p-4 mb-4 bg-slate-50 border rounded-2xl"
          onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Password" className="w-full p-4 mb-6 bg-slate-50 border rounded-2xl"
          onChange={(e) => setFormData({...formData, password: e.target.value})} />
        
        <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg">
          {isLogin ? 'Enter' : 'Sign Up'}
        </button>

        <p className="mt-6 text-center text-sm font-semibold text-slate-500">
          {isLogin ? "New to SpeakEase?" : "Already have an account?"} 
          <button type="button" onClick={() => {setIsLogin(!isLogin); setError('');}} className="text-blue-600 ml-2 underline">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Auth;