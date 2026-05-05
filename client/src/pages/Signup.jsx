import React, { useState } from 'react';
import API from "../api";
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/register', formData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      if (onSignup) onSignup(data);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleSignup} className="p-8 bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 className="text-3xl font-black mb-2 text-slate-800 uppercase tracking-tighter">Create Account</h2>
        <p className="text-slate-500 mb-8 text-sm font-medium">Join SpeakEase AI to start practicing.</p>

        <input
          type="text" placeholder="Full Name" required
          className="w-full p-4 mb-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="email" placeholder="Email Address" required
          className="w-full p-4 mb-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password" placeholder="Password" required
          className="w-full p-4 mb-8 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200">
          Sign Up
        </button>

        <p className="mt-6 text-center text-slate-500 text-sm font-semibold">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log In</Link>
        </p>
      </form>
    </div>
  );
};

// THIS IS THE LINE YOU WERE MISSING
export default Signup;