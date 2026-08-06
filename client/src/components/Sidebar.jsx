import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, History, Settings,
  LogOut, User as UserIcon, Zap, ChevronRight, FileText, Brain, Database
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',         path: '/dashboard' },
    { icon: <Brain className="w-5 h-5" />,           label: 'Aptitude Practice', path: '/aptitude'  },
    { icon: <Database className="w-5 h-5" />,        label: 'SQL Practice',      path: '/sql-setup' },
    { icon: <History className="w-5 h-5" />,          label: 'History',           path: '/history'   },
    { icon: <FileText className="w-5 h-5" />,         label: 'Resume',            path: '/resume'    },
    { icon: <Settings className="w-5 h-5" />,         label: 'Settings',          path: '/settings'  },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-72 h-screen bg-[#0f1117] border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Zap className="text-white w-6 h-6 fill-white" />
        </div>
        <span className="text-xl font-black text-white tracking-tight">AI Interviewer</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User & Sign Out */}
      <div className="mt-auto space-y-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Free Member</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
