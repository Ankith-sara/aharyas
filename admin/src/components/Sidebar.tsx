'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, LogOut, Menu, X, Shield, User, PackagePlus,
  Boxes, ClipboardPlus, ShoppingCart, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const Sidebar = () => {
  const { token, logout, backendUrl } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; avatar?: string; email?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode<{ id?: string; name?: string; email?: string }>(token);
      if (decoded?.name || decoded?.email) {
        setAdminUser({
          name: decoded.name || decoded.email?.split('@')[0] || 'Admin',
          email: decoded.email,
        });
      }
      if (decoded?.id) {
        axios
          .get(`${backendUrl}/api/v1/user/profile/${decoded.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            if (res.data?.success && res.data?.user) {
              setAdminUser({
                name: res.data.user.name || 'Admin',
                avatar: res.data.user.avatar,
                email: res.data.user.email,
              });
            }
          })
          .catch(() => {});
      }
    } catch {
      setAdminUser({ name: 'Admin' });
    }
  }, [token, backendUrl]);

  const navigationItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/add-product", icon: PackagePlus, label: "Add Product" },
    { to: "/list", icon: Boxes, label: "Products" },
    { to: "/add-order", icon: ClipboardPlus, label: "Add Order" },
    { to: "/orders", icon: ShoppingCart, label: "Orders" },
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

  const ProfileBottomCard = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="p-3 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-gray-100/90 border border-gray-200/70 hover:border-gray-300 transition-all">
        <Link
          href="/profile"
          onClick={() => mobile && setIsMobileMenuOpen(false)}
          className="flex items-center gap-2.5 min-w-0 flex-1 group"
        >
          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm group-hover:border-black transition-colors">
            {adminUser?.avatar ? (
              <img src={adminUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-gray-700" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate leading-tight group-hover:text-black">
              {adminUser?.name || 'Admin User'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
              <span className="text-[11px] text-gray-500 font-light">Online</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Link
            href="/profile"
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            title="Profile & Settings"
            className={`p-1.5 rounded-xl transition-colors ${
              pathname === '/profile'
                ? 'text-black bg-white shadow-sm'
                : 'text-gray-500 hover:text-black hover:bg-gray-200/80'
            }`}
          >
            <Settings size={16} />
          </Link>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

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
        lg:hidden fixed top-0 left-0 z-50 h-full w-80 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 flex-shrink-0">
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

        <div className="py-4 flex-1 overflow-y-auto">
          {navigationItems.map((item) => renderNavItem(item, true))}
        </div>

        <ProfileBottomCard mobile />
      </div>

      <div className="hidden lg:flex flex-col h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-30">
        <div className="px-6 py-6 border-b border-gray-200 flex-shrink-0">
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

        <ProfileBottomCard />
      </div>
    </>
  );
};

export default Sidebar;
