'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { assets } from '../assets/assets';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { X, Search, User, Menu, LogOut, ShoppingBagIcon, ShoppingCartIcon, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { categoryData } from '../assets/categoryData';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/\s+/g, '-');

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { setSearch, setShowSearch, setSelectedSubCategory } = useProducts();
  const { getWishlistCount, getCartCount } = useCart();
  const { token, logout: contextLogout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuVisible, setMenuVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (!token) {
      setUserId('');
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        contextLogout();
      } else {
        setUserId(decoded.id || decoded._id);
      }
    } catch {
      contextLogout();
    }
  }, [token, contextLogout]);

  const isHomePage = pathname === '/';

  useEffect(() => {
    setMenuVisible(false);
    setActiveCategory(null);
    setProfileOpen(false);
  }, [pathname]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setSearch?.('');
    setTimeout(() => setActiveCategory(null), 400);
  }, [setSearch]);

  const logout = () => {
    setShowLogoutConfirm(false);
    closeMenu();
    contextLogout();
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuVisible && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const btn = document.getElementById('menu-toggle-button');
        if (!btn || !btn.contains(e.target as Node)) closeMenu();
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuVisible, profileOpen, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuVisible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuVisible]);

  const handleSubcategoryClick = (subCategoryName: string) => {
    setSelectedSubCategory(subCategoryName);
    closeMenu();
  };

  const categories = Object.entries(categoryData).map(([catName, catObj]) => {
    const id = catName.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    const subcategories = catObj.subCategories
      .filter((sub) => sub !== '')
      .map((sub) => {
        let displayName = sub;
        if (catName === 'Women' || catName === 'Men') {
          displayName = sub.replace(/^(Women|Men)\s+/, '');
        }
        return {
          name: displayName,
          path: `/shop/${slugify(sub)}`,
        };
      });
    return {
      name: catName,
      id,
      subcategories,
    };
  });

  const getNavbarBackground = () => {
    if (isHomePage && !isScrolled) return 'bg-transparent backdrop-blur-none';
    return 'bg-black/95 backdrop-blur-md';
  };

  const isL2 = activeCategory !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-500 z-40 ${
          menuVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm p-8">
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-3">Account</p>
            <h3 className="text-lg font-light text-black mb-1">Log out?</h3>
            <p className="text-xs text-gray-400 font-light mb-8 leading-relaxed">
              You&apos;ll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-xs uppercase tracking-[0.15em] font-medium hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3 bg-black text-white text-xs uppercase tracking-[0.15em] font-medium hover:bg-gray-900 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 px-4 sm:px-6 md:px-10 z-50 transition-all duration-300 ${getNavbarBackground()}`}
      >
        <div className="flex items-center justify-between text-white py-4">
          <Link href="/" onClick={() => setSearch?.('')} className="flex items-center">
            <Image
              src={assets.logo}
              className="w-28 md:w-36 h-auto object-contain filter invert mix-blend-screen"
              alt="Aharyas"
              width={144}
              height={42}
              priority
            />
          </Link>

          <div className="flex items-center">
            <button onClick={() => setShowSearch(true)} className="p-2.5" aria-label="Search">
              <Search size={20} />
            </button>

            {/* Desktop profile */}
            <div className="relative hidden md:block" ref={profileRef}>
              <button
                onClick={() => (token ? setProfileOpen((o) => !o) : router.push('/login'))}
                className="p-2.5"
                aria-label="Profile"
              >
                <User size={20} />
              </button>
              {token && profileOpen && (
                <div className="absolute right-0 pt-2 z-10">
                  <div className="w-52 bg-white shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-400">My Account</p>
                    </div>
                    <div role="menu">
                      <Link
                        href={`/profile/${userId}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-xs text-gray-600 hover:text-black hover:bg-gray-50 font-light transition-colors"
                      >
                        <User size={13} /> My Profile
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-xs text-gray-600 hover:text-black hover:bg-gray-50 font-light transition-colors"
                      >
                        <ShoppingBagIcon size={13} /> My Orders
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-xs text-gray-600 hover:text-black hover:bg-gray-50 font-light transition-colors border-t border-gray-100 text-left"
                      >
                        <LogOut size={13} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/wishlist" className="relative" onClick={() => setSearch?.('')}>
              <button className="p-2.5 relative" aria-label="Wishlist">
                <Heart size={20} />
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-semibold bg-white text-black">
                    {getWishlistCount()}
                  </span>
                )}
              </button>
            </Link>

            <Link href="/cart" className="relative" onClick={() => setSearch?.('')}>
              <button className="p-2.5 relative" aria-label="Cart">
                <ShoppingCartIcon size={20} />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-semibold bg-white text-black">
                    {getCartCount()}
                  </span>
                )}
              </button>
            </Link>

            <button
              id="menu-toggle-button"
              onClick={() => setMenuVisible((v) => !v)}
              className="p-2.5"
              aria-label={menuVisible ? 'Close menu' : 'Open menu'}
            >
              {menuVisible ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 bottom-0 h-full w-full sm:w-2/6 bg-white overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 flex flex-col ${
          menuVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          className="flex flex-1 min-h-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: '200%',
            transform: isL2 ? 'translateX(-50%)' : 'translateX(0)',
            transition: 'transform 0.38s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div className="w-1/2 flex flex-col h-full overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-between px-7 py-5 bg-black">
              <p className="text-sm uppercase tracking-[0.35em] text-gray-200 font-semibold">Menu</p>
              <button
                onClick={closeMenu}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-all duration-200"
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-300" />
              </button>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto">
              <Link
                href="/"
                onClick={closeMenu}
                className={`flex items-center justify-between px-7 py-4 border-b border-gray-100 text-sm font-light tracking-wide transition-colors duration-200 ${
                  pathname === '/' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Home
              </Link>

              <div className="px-7 pt-6 pb-3">
                <p className="text-[9px] uppercase tracking-[0.35em] text-gray-300 font-semibold">Shop</p>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat)}
                  className="w-full flex items-center justify-between px-7 py-4 text-left group transition-colors duration-200 hover:bg-gray-50/60"
                >
                  <span className="text-sm font-light text-gray-800 tracking-wide group-hover:text-black transition-colors duration-200">
                    {cat.name}
                  </span>
                  <ChevronRight
                    size={13}
                    className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200"
                  />
                </button>
              ))}

              <div className="px-7 pt-6 pb-3">
                <p className="text-[9px] uppercase tracking-[0.35em] text-gray-300 font-semibold">Explore</p>
              </div>
              {[
                { label: 'Our Story', to: '/about' },
                { label: 'Sell With Us', to: '/sell' },
                { label: 'Contact Us', to: '/contact' },
              ].map(({ label, to }) => (
                <Link
                  key={to}
                  href={to}
                  onClick={closeMenu}
                  className={`flex items-center justify-between px-7 py-4 text-sm font-light tracking-wide transition-colors duration-200 group ${
                    pathname === to ? 'text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span>{label}</span>
                  <ChevronRight
                    size={11}
                    className={`transition-all duration-200 ${
                      pathname === to
                        ? 'opacity-50'
                        : 'opacity-0 group-hover:opacity-30 group-hover:translate-x-0.5'
                    }`}
                  />
                </Link>
              ))}

              <div className="px-7 pt-6 pb-3">
                <p className="text-[9px] uppercase tracking-[0.35em] text-gray-300 font-semibold">Account</p>
              </div>
              {token ? (
                <div className="border-t border-gray-100">
                  <Link
                    href={`/profile/${userId}`}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-7 py-4 text-sm font-light transition-colors duration-200 ${
                      pathname.startsWith('/profile') ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <User size={13} /> My Profile
                  </Link>
                  <Link
                    href="/orders"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-7 py-4 text-sm font-light transition-colors duration-200 ${
                      pathname === '/orders' ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <ShoppingBagIcon size={13} /> My Orders
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center gap-3 px-7 py-4 text-sm font-light text-gray-400 hover:text-black transition-colors duration-200 text-left"
                  >
                    <LogOut size={13} /> Logout
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-7 py-4 text-sm font-light text-gray-500 hover:text-black transition-colors duration-200"
                  >
                    <User size={13} /> Login / Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Subcategory panel */}
          <div className="w-1/2 flex flex-col h-full overflow-y-auto bg-white">
            <div className="flex-shrink-0 flex items-center justify-between px-7 py-5 bg-black border-b border-gray-100">
              <button onClick={() => setActiveCategory(null)} className="flex items-center gap-3 group" aria-label="Back">
                <ChevronLeft size={14} className="text-gray-200 transition-colors duration-200" />
                <span className="text-[9px] uppercase tracking-[0.35em] text-gray-200 transition-colors duration-200 font-medium">
                  Back
                </span>
              </button>
              <button
                onClick={closeMenu}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-all duration-200"
                aria-label="Close menu"
              >
                <X size={14} className="text-gray-300" />
              </button>
            </div>

            {activeCategory && (
              <div className="flex-shrink-0 px-7 pt-7 pb-5 border-b border-gray-100">
                <h2 className="text-2xl font-light text-black tracking-wide">{activeCategory.name}</h2>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {activeCategory && (
                <>
                  <Link
                    href={`/shop/${slugify(activeCategory.name)}`}
                    onClick={closeMenu}
                    className="flex items-center justify-between px-7 py-4 group transition-colors duration-200 hover:bg-gray-50/60"
                  >
                    <span className="text-xs font-light text-gray-400 tracking-wide group-hover:text-black transition-colors duration-200">
                      View All
                    </span>
                    <ChevronRight
                      size={11}
                      className="text-gray-200 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200"
                    />
                  </Link>

                  {activeCategory.subcategories.map((sub: any) => (
                    <Link
                      key={sub.path}
                      href={sub.path}
                      onClick={() => handleSubcategoryClick(sub.name)}
                      className={`flex items-center justify-between px-7 py-4 group transition-colors duration-200 hover:bg-gray-50/60 ${
                        pathname === sub.path ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span
                        className={`text-sm font-light tracking-wide transition-colors duration-200 ${
                          pathname === sub.path ? 'text-black' : 'text-gray-700 group-hover:text-black'
                        }`}
                      >
                        {sub.name}
                      </span>
                      <ChevronRight
                        size={13}
                        className={`transition-all duration-200 ${
                          pathname === sub.path
                            ? 'text-gray-400 opacity-100'
                            : 'text-gray-200 opacity-0 group-hover:opacity-100 group-hover:text-gray-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
