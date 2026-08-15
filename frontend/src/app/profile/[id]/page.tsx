'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
  ChevronRight, Heart, Clock, User, ShoppingBag, Settings, LogOut, 
  X, Camera, MapPin, Package, ShieldCheck, Lock, Bell, Globe, Key, 
  ArrowUpRight, Check, ChevronDown, Edit
} from 'lucide-react';
import Title from '../../../components/Title';
import ProductItem from '../../../components/ProductItem';
import { useAuth } from '../../../context/AuthContext';
import { useProducts } from '../../../context/ProductContext';
import { api } from '../../../context/api';
import { toast } from 'react-toastify';
import { Country, State, City } from 'country-state-city';

const GLOBAL_COUNTRIES = [
  { isoCode: 'AU', name: 'Australia' },
  { isoCode: 'AT', name: 'Austria' },
  { isoCode: 'BD', name: 'Bangladesh' },
  { isoCode: 'BE', name: 'Belgium' },
  { isoCode: 'CA', name: 'Canada' },
  { isoCode: 'CZ', name: 'Czech Republic' },
  { isoCode: 'DK', name: 'Denmark' },
  { isoCode: 'FI', name: 'Finland' },
  { isoCode: 'FR', name: 'France' },
  { isoCode: 'DE', name: 'Germany' },
  { isoCode: 'GR', name: 'Greece' },
  { isoCode: 'HU', name: 'Hungary' },
  { isoCode: 'IN', name: 'India' },
  { isoCode: 'ID', name: 'Indonesia' },
  { isoCode: 'IE', name: 'Ireland' },
  { isoCode: 'IT', name: 'Italy' },
  { isoCode: 'JP', name: 'Japan' },
  { isoCode: 'MY', name: 'Malaysia' },
  { isoCode: 'NP', name: 'Nepal' },
  { isoCode: 'NL', name: 'Netherlands' },
  { isoCode: 'NO', name: 'Norway' },
  { isoCode: 'PH', name: 'Philippines' },
  { isoCode: 'PL', name: 'Poland' },
  { isoCode: 'PT', name: 'Portugal' },
  { isoCode: 'QA', name: 'Qatar' },
  { isoCode: 'RO', name: 'Romania' },
  { isoCode: 'SA', name: 'Saudi Arabia' },
  { isoCode: 'SG', name: 'Singapore' },
  { isoCode: 'KR', name: 'South Korea' },
  { isoCode: 'ES', name: 'Spain' },
  { isoCode: 'LK', name: 'Sri Lanka' },
  { isoCode: 'SE', name: 'Sweden' },
  { isoCode: 'CH', name: 'Switzerland' },
  { isoCode: 'TH', name: 'Thailand' },
  { isoCode: 'AE', name: 'United Arab Emirates' },
  { isoCode: 'GB', name: 'United Kingdom' },
  { isoCode: 'US', name: 'United States' },
  { isoCode: 'VN', name: 'Vietnam' },
].sort((a, b) => a.name.localeCompare(b.name));

interface SelectOption {
  value: string;
  label: string;
  flagIso?: string;
}

function CustomThemedSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select Option",
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3.5 py-2.5 border bg-white flex items-center justify-between text-xs font-light tracking-wide transition-all text-left group ${
          open ? 'border-black ring-1 ring-black/5 shadow-xs' : 'border-gray-200 hover:border-black'
        }`}
      >
        <span className="flex items-center gap-2.5 text-black truncate">
          {selectedOpt?.flagIso && (
            <img
              src={`https://flagcdn.com/w40/${selectedOpt.flagIso.toLowerCase()}.png`}
              alt={selectedOpt.label}
              className="w-5 h-3.5 object-cover rounded-2xs border border-gray-200 flex-shrink-0"
            />
          )}
          <span className={selectedOpt ? "text-black font-medium" : "text-gray-400"}>
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 group-hover:text-black transition-transform duration-200 flex-shrink-0 ${
            open ? 'rotate-180 text-black' : ''
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-gray-50 animate-fadeIn">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-black text-white font-medium' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {opt.flagIso && (
                      <img
                        src={`https://flagcdn.com/w40/${opt.flagIso.toLowerCase()}.png`}
                        alt={opt.label}
                        className="w-5 h-3.5 object-cover rounded-2xs border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal Shell & Primitives                                          */
/* ------------------------------------------------------------------ */
function ModalShell({ onBackdropClick, zIndex = "z-50", maxWidth = "max-w-lg", children }: any) {
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center p-0 sm:p-4`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fadeIn" onClick={onBackdropClick} />
      <div className={`relative bg-white w-full ${maxWidth} shadow-2xl rounded-t-lg sm:rounded-sm z-10 flex flex-col max-h-[92dvh] sm:max-h-[88vh] border border-gray-100 overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, icon, onClose }: any) {
  return (
    <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="text-gray-500 flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-black truncate">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 font-light mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-black transition-colors p-1.5 rounded-full hover:bg-gray-50">
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, submitForm, submitLabel, loading, cancelLabel = "Cancel" }: any) {
  return (
    <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row gap-3">
      <button type="button" onClick={onCancel} className="flex-1 sm:flex-none sm:w-28 py-3 border border-gray-200 text-black font-light hover:bg-gray-50 uppercase text-[11px] tracking-widest transition-colors">
        {cancelLabel}
      </button>
      <button type="submit" form={submitForm} disabled={loading} className="flex-1 py-3 bg-black text-white font-light hover:bg-gray-800 disabled:opacity-50 uppercase text-[11px] tracking-widest transition-colors">
        {loading ? "Please wait…" : submitLabel}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setToken } = useAuth();
  const { currency, setCurrency } = useProducts();

  const [userData, setUserData] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const toggleAccordion = (name: string) => {
    setActiveAccordion((prev) => (prev === name ? null : name));
  };

  const [editProfile, setEditProfile] = useState({ name: "", email: "", image: "", imageFile: null as File | null });
  const [addressForm, setAddressForm] = useState({ street: "", city: "", state: "", zipcode: "", country: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  
  // Settings & Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    dropAlerts: true,
    currency: currency || '₹'
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCountryCode) {
      const states = State.getStatesOfCountry(selectedCountryCode);
      setStatesList(states || []);
    } else {
      setStatesList([]);
    }
  }, [selectedCountryCode]);

  const handleStateChange = (stateName: string) => {
    const foundState = statesList.find((s) => s.name === stateName);
    setAddressForm((prev) => ({ ...prev, state: stateName, city: "" }));
    if (foundState) {
      const cities = City.getCitiesOfState(selectedCountryCode, foundState.isoCode);
      setCitiesList(cities || []);
    } else {
      setCitiesList([]);
    }
  };

  const handleTogglePreference = (key: 'emailNotifications' | 'dropAlerts') => {
    const updated = !preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: updated }));
    toast.success(`${key === 'emailNotifications' ? 'Order status updates' : 'Artisan drop alerts'} ${updated ? 'enabled' : 'disabled'}`);
  };

  const handleSelectCurrency = (symbol: string) => {
    setCurrency(symbol);
    setPreferences((prev) => ({ ...prev, currency: symbol }));
    toast.success(`Display currency updated to ${symbol === '$' ? 'USD ($)' : symbol === '€' ? 'EUR (€)' : symbol === '£' ? 'GBP (£)' : 'INR (₹)'}`);
  };

  const [loading, setLoading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    if (currency) {
      setPreferences((p) => ({ ...p, currency }));
    }
  }, [currency]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.id !== id) {
        // verified session
      }
    } catch { router.push("/login"); return; }

    api.get(`/api/v1/user/profile/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.success) {
          setUserData(res.data.user);
          setEditProfile({ name: res.data.user.name, email: res.data.user.email, image: res.data.user.image || "", imageFile: null });
          if (res.data.user.address) {
            const userCountry = res.data.user.address.country || "";
            setAddressForm({
              street: res.data.user.address.street || "",
              city: res.data.user.address.city || "",
              state: res.data.user.address.state || "",
              zipcode: res.data.user.address.zipcode || "",
              country: userCountry
            });
            if (userCountry) {
              const matched = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === userCountry.toLowerCase());
              if (matched) setSelectedCountryCode(matched.isoCode);
            }
          }
        } else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [id, router]);

  useEffect(() => {
    try {
      setRecentlyViewed(JSON.parse(localStorage.getItem("recentlyViewed") || "[]"));
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken("");
    router.push("/login");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditProfile((p) => ({ ...p, imageFile: file, image: URL.createObjectURL(file) }));
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("name", editProfile.name);
      fd.append("email", editProfile.email);
      if (editProfile.imageFile) fd.append("image", editProfile.imageFile);
      const res = await api.put(`/api/v1/user/profile/${userData._id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        setUserData(res.data.user);
        setEditProfile({ name: res.data.user.name, email: res.data.user.email, image: res.data.user.image || "", imageFile: null });
        setActiveSection(null);
        toast.success("Profile updated successfully.");
      } else toast.error(res.data.message || "Failed to update profile.");
    } catch { toast.error("Failed to update profile."); }
    finally { setLoading(false); }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/api/v1/user/profile/${userData._id}`, { address: addressForm }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserData(res.data.user);
        setActiveSection(null);
        setActiveAccordion(null);
        toast.success("Delivery address updated successfully.");
      } else toast.error(res.data.message || "Failed to update address.");
    } catch { toast.error("Failed to update address."); }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/api/v1/user/change-password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setActiveSection(null);
        setActiveAccordion(null);
        toast.success("Password updated successfully.");
      } else toast.error(res.data.message || "Failed to update password.");
    } catch { toast.error("Failed to update password."); }
    finally { setLoading(false); }
  };

  const savePreferences = () => {
    setCurrency(preferences.currency);
    toast.success(`Display currency updated to ${preferences.currency}`);
    setActiveSection(null);
    setActiveAccordion(null);
  };

  const memberSince = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '2026';

  if (!userData) {
    return (
      <div className="min-h-screen bg-white text-black mt-16 flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Loading Profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black mt-16 sm:mt-20 pb-20">
      {/* LOGOUT MODAL */}
      {logoutModal && (
        <ModalShell onBackdropClick={() => setLogoutModal(false)} maxWidth="max-w-sm">
          <ModalHeader title="Confirm Sign Out" onClose={() => setLogoutModal(false)} />
          <div className="p-6">
            <p className="text-sm text-gray-500 font-light leading-relaxed">Are you sure you want to sign out of your Aharyas account?</p>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={() => setLogoutModal(false)} className="flex-1 py-3 border border-gray-200 uppercase text-[11px] tracking-widest font-light hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => { setLogoutModal(false); logout(); }} className="flex-1 py-3 bg-black text-white uppercase text-[11px] tracking-widest font-light hover:bg-gray-800 transition-colors">Sign Out</button>
          </div>
        </ModalShell>
      )}

      {/* EDIT PROFILE MODAL */}
      {activeSection === "Edit Profile" && (
        <ModalShell onBackdropClick={() => setActiveSection(null)} maxWidth="max-w-md">
          <ModalHeader title="Edit Profile" subtitle="Update your personal information" icon={<User size={18} />} onClose={() => setActiveSection(null)} />
          <div className="overflow-y-auto p-6">
            <form id="edit-profile-form" onSubmit={handleEditProfileSubmit} className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 shadow-sm">
                  {editProfile.image ? (
                    <Image src={editProfile.image} alt="Profile" fill className="object-cover" />
                  ) : (
                    <User size={26} strokeWidth={1.5} className="m-auto text-gray-300 relative top-1/2 -translate-y-1/2" />
                  )}
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors shadow-sm">
                    <Camera size={11} strokeWidth={1.5} />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium tracking-wide text-black">{editProfile.name || "—"}</p>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 uppercase tracking-wider">Tap camera icon to edit photo</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Full Name</label>
                <input
                  type="text" required value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Email Address</label>
                <input
                  type="email" required value={editProfile.email}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </form>
          </div>
          <ModalFooter onCancel={() => setActiveSection(null)} submitForm="edit-profile-form" submitLabel="Save Changes" loading={loading} />
        </ModalShell>
      )}



      {/* PAGE CONTAINER: SIDEBAR (LEFT) + MANAGEMENT HUB (RIGHT) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 pt-10">
        <div className="mb-10 text-center">
          <Title text1="MY" text2="ACCOUNT" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 items-start">
          {/* LEFT SIDEBAR: USER DETAILS & QUICK ACTIONS */}
          <aside className="border border-gray-100 bg-white p-6 lg:p-8 space-y-8 sticky top-24">
            {/* User Avatar + Identity */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-28 h-28 aspect-square relative border border-gray-200 bg-gray-50 overflow-hidden shadow-xs">
                  {userData.image ? (
                    <Image src={userData.image} alt={userData.name} fill className="object-cover" />
                  ) : (
                    <User size={40} strokeWidth={1.2} className="m-auto text-gray-300 relative top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <button
                  onClick={() => setActiveSection("Edit Profile")}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md z-10 border-2 border-white"
                  title="Change Photo"
                >
                  <Camera size={14} strokeWidth={1.5} />
                </button>
              </div>

              <h2 className="text-xl font-light tracking-wide text-black">{userData.name}</h2>
              <p className="text-xs text-gray-400 font-light mt-1 break-all">{userData.email}</p>
              

            </div>

            {/* Member Stats Box */}
            <div className="grid grid-cols-3 gap-0 border border-gray-100 divide-x divide-gray-100 py-3 bg-gray-50/50">
              <div className="text-center py-1">
                <p className="text-base font-light text-black">{userData?.orderCount ?? 0}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-0.5">Orders</p>
              </div>
              <div className="text-center py-1">
                <p className="text-base font-light text-black">{recentlyViewed.length}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-0.5">Saved</p>
              </div>
              <div className="text-center py-1">
                <p className="text-xs font-light text-black mt-1">{memberSince}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-0.5">Joined</p>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setActiveSection("Edit Profile")}
                className="w-full py-3 bg-black text-white text-[11px] uppercase tracking-widest font-light hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={13} strokeWidth={1.5} /> Edit Profile
              </button>
              <button
                onClick={() => setLogoutModal(true)}
                className="w-full py-3 border border-gray-200 text-gray-600 text-[11px] uppercase tracking-widest font-light hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={13} strokeWidth={1.5} /> Sign Out
              </button>
            </div>
          </aside>

          {/* RIGHT CONTENT HUB: MANAGE ACCOUNT & DETAILED SETTINGS */}
          <main className="space-y-10">
            {/* Quick Navigation Cards Grid */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">Quick Access</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/orders" className="group p-6 border border-gray-100 hover:border-black transition-all bg-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-gray-200 flex items-center justify-center text-gray-700 group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                      <ShoppingBag size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-black tracking-wide">Order History</h3>
                      <p className="text-xs text-gray-400 font-light mt-0.5">Track shipment & invoice logs</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} strokeWidth={1.5} className="text-gray-300 group-hover:text-black transition-colors" />
                </Link>

                <Link href="/wishlist" className="group p-6 border border-gray-100 hover:border-black transition-all bg-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-gray-200 flex items-center justify-center text-gray-700 group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                      <Heart size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-black tracking-wide">Saved Wishlist</h3>
                      <p className="text-xs text-gray-400 font-light mt-0.5">Your curated artisan pieces</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} strokeWidth={1.5} className="text-gray-300 group-hover:text-black transition-colors" />
                </Link>
              </div>
            </div>

            {/* Comprehensive Settings Section — Inline Accordions */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4 font-medium">Account Settings & Control</p>
              <div className="border border-gray-100 divide-y divide-gray-100 bg-white">
                
                {/* 1. Delivery Location Manager (Accordion) */}
                <div className="border-b border-gray-100 last:border-b-0">
                  <div
                    onClick={() => toggleAccordion('address')}
                    className="group p-6 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:border-black group-hover:text-black transition-colors">
                        <MapPin size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black tracking-wide">Delivery Address</p>
                        <p className="text-xs text-gray-400 font-light mt-0.5">Manage default delivery address and shipping details</p>
                      </div>
                    </div>
                    <ChevronDown size={18} strokeWidth={1.5} className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${activeAccordion === 'address' ? 'rotate-180 text-black' : ''}`} />
                  </div>

                  {activeAccordion === 'address' && (
                    <div className="p-6 bg-gray-50/40 border-t border-gray-100 animate-fadeIn">
                      <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-xl">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">Street Address</label>
                          <input
                            type="text" required value={addressForm.street}
                            placeholder="House number, Street name, Flat"
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                          />
                        </div>

                        {/* Country Selector with Flag Emojis & Custom Asian/Global List */}
                        <CustomThemedSelect
                          label="Country"
                          placeholder="Select Country"
                          options={GLOBAL_COUNTRIES.map((c) => ({
                            value: c.isoCode,
                            label: c.name,
                            flagIso: c.isoCode,
                          }))}
                          value={selectedCountryCode}
                          onChange={(iso) => {
                            const countryObj = GLOBAL_COUNTRIES.find(c => c.isoCode === iso);
                            setSelectedCountryCode(iso);
                            setAddressForm({ ...addressForm, country: countryObj?.name || '', state: '', city: '' });
                          }}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* State Selector */}
                          <div>
                            {statesList.length > 0 ? (
                              <CustomThemedSelect
                                label="State / Province"
                                placeholder="Select State"
                                options={statesList.slice().sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({
                                  value: s.name,
                                  label: s.name,
                                }))}
                                value={addressForm.state}
                                onChange={(val) => handleStateChange(val)}
                              />
                            ) : (
                              <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">State / Province</label>
                                <input
                                  type="text" required value={addressForm.state}
                                  placeholder="State / Province"
                                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                  className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                                />
                              </div>
                            )}
                          </div>

                          {/* City Selector */}
                          <div>
                            {citiesList.length > 0 ? (
                              <CustomThemedSelect
                                label="City"
                                placeholder="Select City"
                                options={citiesList.slice().sort((a, b) => a.name.localeCompare(b.name)).map((ct) => ({
                                  value: ct.name,
                                  label: ct.name,
                                }))}
                                value={addressForm.city}
                                onChange={(val) => setAddressForm({ ...addressForm, city: val })}
                              />
                            ) : (
                              <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">City</label>
                                <input
                                  type="text" required value={addressForm.city}
                                  placeholder="City"
                                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                  className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">Pincode / ZIP Code</label>
                          <input
                            type="text" required value={addressForm.zipcode}
                            placeholder="ZIP / Postal Code"
                            onChange={(e) => setAddressForm({ ...addressForm, zipcode: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button type="submit" disabled={loading} className="px-6 py-3 bg-black text-white uppercase text-[11px] tracking-widest font-light hover:bg-gray-800 transition-all">
                            {loading ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* 2. Security & Password Control (Accordion) */}
                <div className="border-b border-gray-100 last:border-b-0">
                  <div
                    onClick={() => toggleAccordion('security')}
                    className="group p-6 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:border-black group-hover:text-black transition-colors">
                        <Lock size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black tracking-wide">Password & Security</p>
                        <p className="text-xs text-gray-400 font-light mt-0.5">Update credentials & session security</p>
                      </div>
                    </div>
                    <ChevronDown size={18} strokeWidth={1.5} className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${activeAccordion === 'security' ? 'rotate-180 text-black' : ''}`} />
                  </div>

                  {activeAccordion === 'security' && (
                    <div className="p-6 bg-gray-50/40 border-t border-gray-100 space-y-4 max-w-xl animate-fadeIn">
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">Current Password</label>
                          <input
                            type="password" required value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">New Password</label>
                            <input
                              type="password" required value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 font-medium">Confirm New Password</label>
                            <input
                              type="password" required value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-gray-200 text-sm font-light focus:outline-none focus:border-black bg-white transition-colors"
                            />
                          </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button type="submit" disabled={loading} className="px-6 py-3 bg-black text-white uppercase text-[11px] tracking-widest font-light hover:bg-gray-800 transition-all">
                            {loading ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* 3. Notifications & Drop Alerts */}
                <div className="border-b border-gray-100 last:border-b-0">
                  <div
                    onClick={() => toggleAccordion('notifications')}
                    className="group p-6 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:border-black group-hover:text-black transition-colors">
                        <Bell size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black tracking-wide">Notifications & Alerts</p>
                        <p className="text-xs text-gray-400 font-light mt-0.5">Instant order updates & artisan collection drop alerts</p>
                      </div>
                    </div>
                    <ChevronDown size={18} strokeWidth={1.5} className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${activeAccordion === 'notifications' ? 'rotate-180 text-black' : ''}`} />
                  </div>

                  {activeAccordion === 'notifications' && (
                    <div className="p-6 bg-gray-50/40 border-t border-gray-100 space-y-3 animate-fadeIn">
                      {/* Full-width Toggle 1 */}
                      <div
                        onClick={() => handleTogglePreference('emailNotifications')}
                        className="w-full p-4 border border-gray-200 bg-white hover:border-black transition-all cursor-pointer flex items-center justify-between group select-none"
                      >
                        <div>
                          <p className="text-xs font-semibold text-black uppercase tracking-wider">Order Status Updates</p>
                          <p className="text-xs text-gray-400 font-light mt-0.5">Receive instant dispatch & delivery notifications</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center p-1 ${preferences.emailNotifications ? 'bg-black' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>

                      {/* Full-width Toggle 2 */}
                      <div
                        onClick={() => handleTogglePreference('dropAlerts')}
                        className="w-full p-4 border border-gray-200 bg-white hover:border-black transition-all cursor-pointer flex items-center justify-between group select-none"
                      >
                        <div>
                          <p className="text-xs font-semibold text-black uppercase tracking-wider">Artisan Collection Drops</p>
                          <p className="text-xs text-gray-400 font-light mt-0.5">Early access alerts for new handloom & jewelry releases</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center p-1 ${preferences.dropAlerts ? 'bg-black' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${preferences.dropAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Display & Currency Settings */}
                <div className="border-b border-gray-100 last:border-b-0">
                  <div
                    onClick={() => toggleAccordion('preferences')}
                    className="group p-6 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:border-black group-hover:text-black transition-colors">
                        <Globe size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black tracking-wide">Regional Preferences</p>
                        <p className="text-xs text-gray-400 font-light mt-0.5">
                          Select store pricing currency
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-black px-2.5 py-1 bg-gray-100 border border-gray-200 uppercase tracking-wider">
                        {currency === '$' ? 'USD ($)' : currency === '€' ? 'EUR (€)' : currency === '£' ? 'GBP (£)' : 'INR (₹)'}
                      </span>
                      <ChevronDown size={18} strokeWidth={1.5} className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${activeAccordion === 'preferences' ? 'rotate-180 text-black' : ''}`} />
                    </div>
                  </div>

                  {activeAccordion === 'preferences' && (
                    <div className="p-6 bg-gray-50/40 border-t border-gray-100 space-y-3 animate-fadeIn">
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-1">
                        Select Display Currency (Auto-Saves Instantly)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { symbol: '₹', code: 'INR', name: 'Indian Rupee', iso: 'in' },
                          { symbol: '$', code: 'USD', name: 'US Dollar', iso: 'us' },
                          { symbol: '€', code: 'EUR', name: 'Euro', iso: 'eu' },
                          { symbol: '£', code: 'GBP', name: 'British Pound', iso: 'gb' },
                        ].map((curr) => {
                          const isSelected = preferences.currency === curr.symbol;
                          return (
                            <button
                              key={curr.symbol}
                              type="button"
                              onClick={() => handleSelectCurrency(curr.symbol)}
                              className={`relative flex items-center justify-between p-4 border transition-all text-left group ${
                                isSelected
                                  ? 'border-black bg-gray-100 text-black ring-1 ring-black/10 shadow-xs'
                                  : 'border-gray-200 bg-white text-black hover:border-gray-400'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <span className="text-2xl font-serif font-bold text-black group-hover:scale-105 transition-transform">
                                  {curr.symbol}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold tracking-wider uppercase text-black">
                                      {curr.code}
                                    </span>
                                    <img
                                      src={`https://flagcdn.com/w40/${curr.iso}.png`}
                                      alt={curr.code}
                                      className="w-4 h-3 object-cover border border-gray-200 flex-shrink-0"
                                    />
                                  </div>
                                  <p className="text-[11px] font-light truncate mt-0.5 text-gray-500">
                                    {curr.name}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check size={16} strokeWidth={2.5} className="text-black flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Active Security & Device Overview Widget */}
            <div className="p-6 border border-gray-100 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} strokeWidth={1.5} className="text-emerald-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Active Device & Security Log</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-medium">Secured</span>
              </div>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Logged in via Web Browser • Session verified on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Recently Viewed Gallery */}
            {recentlyViewed.length > 0 ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400">Recently Viewed Pieces</p>
                  <Clock size={14} strokeWidth={1.5} className="text-gray-300" />
                </div>
                <div className="border border-gray-100 p-6 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    {recentlyViewed.slice(0, 4).map((item: any) => (
                      <ProductItem key={item._id} id={item._id} slug={item.slug} name={item.name} price={item.price} image={item.images} discount={item.discount || 0} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-100 py-12 px-6 text-center bg-white">
                <Package size={22} strokeWidth={1.2} className="mx-auto text-gray-300 mb-3" />
                <p className="text-xs text-gray-500 font-light">You haven&apos;t viewed any artisan pieces recently.</p>
                <Link href="/shop/collection" className="inline-block mt-3 text-[10px] uppercase tracking-widest border-b border-black pb-0.5 hover:text-gray-500 hover:border-gray-500 transition-colors">
                  Explore Handcrafted Collections
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
