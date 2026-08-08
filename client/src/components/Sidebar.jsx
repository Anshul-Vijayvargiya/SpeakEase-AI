import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, History, Settings,
  LogOut, User as UserIcon, Zap, ChevronRight, ChevronLeft, FileText, Brain, Database
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { collapsed, toggleCollapsed } = useSidebarStore();
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
    <div
      className={`
        h-screen fixed left-0 top-0 z-50
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-72'}
      `}
    >
      {/* Collapse/expand toggle — sibling of the clipped panel below, so it isn't cut off by overflow-hidden */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-9 -right-3 w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0c0e14] text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div
        className={`
          h-full w-full bg-white/[0.06] backdrop-blur-lg border-r border-white/[0.12] flex flex-col p-6 overflow-hidden
          ${collapsed ? 'px-3' : ''}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 mb-12 ${collapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div className="w-10 h-10 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-black text-white tracking-tight whitespace-nowrap">AI Interviewer</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) => `
                flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                {item.icon}
                {!collapsed && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
              </div>
              {!collapsed && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="mt-auto space-y-4">
          <div className={`bg-white/5 rounded-2xl border border-white/5 ${collapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 mb-3'}`}>
              <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Free Member</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className={`w-full flex items-center text-xs font-bold text-slate-400 hover:text-red-400 transition-colors ${collapsed ? 'justify-center py-2' : 'gap-2 px-3 py-2'}`}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
