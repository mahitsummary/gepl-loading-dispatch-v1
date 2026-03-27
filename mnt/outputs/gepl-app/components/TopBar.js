'use client';

import { useState } from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';

const TopBar = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState(3);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-secondary-200 z-20 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-secondary-700 hover:text-primary-600"
        >
          <Menu size={24} />
        </button>
        <div className="hidden lg:block text-secondary-600 text-sm">
          <p>GEPL - Material Tracking System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <Bell size={20} className="text-secondary-600" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              {notifications}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
            <span className="text-sm font-medium text-secondary-700 hidden sm:block">
              John Doe
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
              <div className="p-3 border-b border-secondary-200">
                <p className="font-semibold text-sm text-secondary-900">
                  John Doe
                </p>
                <p className="text-xs text-secondary-600">Warehouse Manager</p>
              </div>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 transition-colors">
                <User size={16} />
                Profile
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 transition-colors">
                <Settings size={16} />
                Settings
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-secondary-200">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
