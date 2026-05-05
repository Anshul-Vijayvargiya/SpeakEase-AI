import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../api';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    name:              "",
    email:             "",
    college:           "",
    preferredLanguage: "en-US",
    notifications:     true,
  });

  // Load on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setSettings(prev => ({ ...prev, ...user }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save settings
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put("/auth/update-profile", settings);
      const updatedUser = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      <main className="flex-1 ml-72 p-10">
        <h1 className="text-3xl font-black mb-8">Account Settings</h1>
        
        <div className="bg-[#151821] p-8 rounded-[2.5rem] border border-white/5 max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={settings.name} 
                onChange={handleChange}
                className="w-full bg-[#0c0e14] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={settings.email} 
                disabled
                className="w-full bg-[#0c0e14] border border-white/5 rounded-xl p-4 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">College / University</label>
              <input 
                type="text" 
                name="college" 
                value={settings.college || ''} 
                onChange={handleChange}
                className="w-full bg-[#0c0e14] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Preferred Interview Language</label>
              <select 
                name="preferredLanguage" 
                value={settings.preferredLanguage} 
                onChange={handleChange}
                className="w-full bg-[#0c0e14] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
              </select>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                name="notifications" 
                checked={settings.notifications} 
                onChange={handleChange}
                className="w-5 h-5 rounded border-white/10 bg-[#0c0e14] text-blue-500"
              />
              <label className="text-sm font-bold text-slate-300">Enable Email Notifications</label>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button 
                type="submit"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
