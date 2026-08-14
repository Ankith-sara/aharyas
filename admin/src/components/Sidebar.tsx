'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, LogOut, Menu, X, Shield, User, PackagePlus,
  Boxes, ClipboardPlus, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/add-product", icon: PackagePlus, label: "Add Product" },
    { to: "/list", icon: Boxes, label: "Products" },
    { to: "/add-order", icon: ClipboardPlus, label: "Add Order" },
    { to: "/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const renderNavItem = (item: { to: string; icon: any; label: string }, mobile = false) => {
    const isActive = pathname === item.to || (item.to !== '/' && pathname?.startsWith(item.to));
    const Icon = item.icon;

    return (
      <Link
        key={item.to}
        href={item.to}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
        className={`
          flex items-center gap-3 px-6 py-4 border-l-4 transition-all duration-300
          ${isActive
            ? 'border-black bg-gray-50 text-black font-medium'
            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-black font-light'
          }
        `}
      >
        <Icon
          size={20}
          className={`transition-colors duration-300 ${isActive ? 'text-black' : 'text-gray-500'}`}
        />
        <span className="text-sm uppercase tracking-wide">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        lg:hidden fixed top-0 left-0 z-50 h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black flex items-center justify-center">
              <Shield className="text-black" size={20} />
            </div>
            <h2 className="text-lg font-medium text-black uppercase tracking-wide">Menu</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="py-4">
          {navigationItems.map((item) => renderNavItem(item, true))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="text-sm font-light uppercase tracking-wide">Logout</span>
          </button>
        </div>
      </div>

      <div className="hidden lg:flex flex-col h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-30">
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black flex items-center justify-center">
              <Shield className="text-black" size={20} />
            </div>
            <div>
              <h1 className="text-base font-medium text-black uppercase tracking-wide">Aharyas</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-light">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <p className="px-5 pt-2 pb-3 text-xs text-gray-400 uppercase tracking-widest font-light">Navigation</p>
          {navigationItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="p-5 border-t border-gray-200">
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all duration-200">
            <LogOut size={16} />
            <span className="text-xs font-light uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
