'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
  ChevronRight, Heart, Clock, User, ShoppingBag, Settings, LogOut, X, Camera
} from 'lucide-react';
import Title from '../../../components/Title';
import ProductItem from '../../../components/ProductItem';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../context/api';
import { toast } from 'react-toastify';

function ModalShell({ onBackdropClick, zIndex = "z-50", maxWidth = "max-w-lg", children }: any) {
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center`}>
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={onBackdropClick} />
      <div className={`relative bg-white w-full ${maxWidth} shadow-2xl sm:rounded-sm z-10 flex flex-col max-h-[92dvh] sm:max-h-[88vh]`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, icon, onClose }: any) {
  return (
    <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-md font-medium tracking-wide uppercase truncate">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 font-light mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-700 p-1">
        <X size={18} />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, submitForm, submitLabel, loading, cancelLabel = "Cancel" }: any) {
  return (
    <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 bg-white flex flex-col-reverse sm:flex-row gap-2">
      <button type="button" onClick={onCancel} className="flex-1 sm:flex-none sm:w-28 py-3 border border-gray-300 text-black font-light hover:bg-gray-50 uppercase text-xs">
        {cancelLabel}
      </button>
      <button type="submit" form={submitForm} disabled={loading} className="flex-1 py-3 bg-black text-white font-light hover:bg-gray-800 disabled:opacity-50 uppercase text-xs">
        {loading ? "Please wait…" : submitLabel}
      </button>
    </div>
  );
}

export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setToken } = useAuth();

  const [userData, setUserData] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState({ name: "", email: "", image: "", imageFile: null as File | null });
  const [loading, setLoading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.id !== id) {
        // user accessing profile, allow or verify
      }
    } catch { router.push("/login"); return; }

    api.get(`/api/v1/user/profile/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.success) {
          setUserData(res.data.user);
          setEditProfile({ name: res.data.user.name, email: res.data.user.email, image: res.data.user.image || "", imageFile: null });
        } else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [id, router]);

  useEffect(() => {
    setRecentlyViewed(JSON.parse(localStorage.getItem("recentlyViewed") || "[]"));
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
      } else toast.error(res.data.message || "Failed to update profile.");
    } catch { toast.error("Failed to update profile."); }
    finally { setLoading(false); }
  };

  const menuItems = [
    { icon: <User size={18} />, text: "Delivery Address", description: "Manage your delivery locations" },
    { icon: <ShoppingBag size={18} />, text: "Order History", link: "/orders", description: "View your past orders" },
    { icon: <Heart size={18} />, text: "Wishlist", link: "/wishlist", description: "Items you've saved for later" },
    { icon: <Settings size={18} />, text: "Account Settings", description: "Notifications, password, privacy" },
  ];

  if (!userData) {
    return (
      <div className="min-h-screen bg-white text-black mt-16 py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black mt-16 sm:mt-20">
      {/* LOGOUT MODAL */}
      {logoutModal && (
        <ModalShell onBackdropClick={() => setLogoutModal(false)} maxWidth="max-w-sm">
          <ModalHeader title="Confirm Logout" onClose={() => setLogoutModal(false)} />
          <div className="p-5">
            <p className="text-sm text-gray-600 font-light">Are you sure you want to log out?</p>
          </div>
          <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
            <button onClick={() => setLogoutModal(false)} className="flex-1 py-3 border border-gray-300 uppercase text-xs font-light">Cancel</button>
            <button onClick={() => { setLogoutModal(false); logout(); }} className="flex-1 py-3 border border-gray-300 hover:bg-red-50 hover:text-red-600 uppercase text-xs font-light">Logout</button>
          </div>
        </ModalShell>
      )}

      {/* EDIT PROFILE MODAL */}
      {activeSection === "Edit Profile" && (
        <ModalShell onBackdropClick={() => setActiveSection(null)} maxWidth="max-w-md">
          <ModalHeader title="Edit Profile" onClose={() => setActiveSection(null)} />
          <div className="overflow-y-auto p-5">
            <form id="edit-profile-form" onSubmit={handleEditProfileSubmit} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full border border-gray-200 overflow-hidden">
                  {editProfile.image ? (
                    <Image src={editProfile.image} alt="Profile" fill className="object-cover" />
                  ) : (
                    <User size={24} className="m-auto text-gray-400" />
                  )}
                  <label className="absolute bottom-0 right-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center cursor-pointer">
                    <Camera size={10} />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium">{editProfile.name || "—"}</p>
                  <p className="text-xs text-gray-400">Tap camera icon to change photo</p>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Full Name</label>
                <input
                  type="text" required value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Email Address</label>
                <input
                  type="email" required value={editProfile.email}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-black"
                />
              </div>
            </form>
          </div>
          <ModalFooter onCancel={() => setActiveSection(null)} submitForm="edit-profile-form" submitLabel="Save Changes" loading={loading} />
        </ModalShell>
      )}

      {/* PROFILE HEADER & CONTENT */}
      <section className="py-8 sm:py-12 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto">
        <div className="text-2xl sm:text-3xl mb-8 text-center">
          <Title text1="MY" text2="PROFILE" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
          {/* Left Column: User info card */}
          <div className="border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200 mb-4">
                {userData.image ? (
                  <Image src={userData.image} alt={userData.name} fill className="object-cover" />
                ) : (
                  <User size={32} className="m-auto text-gray-400" />
                )}
              </div>
              <h2 className="text-lg font-medium text-black">{userData.name}</h2>
              <p className="text-xs text-gray-500 font-light mt-0.5">{userData.email}</p>
              <span className="inline-block mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase tracking-wider">
                Active Member
              </span>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <button
                onClick={() => setActiveSection("Edit Profile")}
                className="w-full py-3 bg-black text-white text-xs uppercase tracking-widest font-medium hover:bg-gray-900 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setLogoutModal(true)}
                className="w-full py-3 border border-gray-200 text-gray-700 text-xs uppercase tracking-widest font-light hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          {/* Right Column: Menu Items */}
          <div className="space-y-6">
            <div className="border border-gray-200 divide-y divide-gray-200">
              {menuItems.map((item, index) => {
                const content = (
                  <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => !item.link && setActiveSection(item.text)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black tracking-wide">{item.text}</p>
                        <p className="text-xs text-gray-500 font-light">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                );
                return item.link ? <Link href={item.link} key={index}>{content}</Link> : content;
              })}
            </div>

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
              <div className="border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Clock size={16} className="text-gray-400" />
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-700">Recently Viewed</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recentlyViewed.slice(0, 4).map((item: any) => (
                    <ProductItem key={item._id} id={item._id} slug={item.slug} name={item.name} price={item.price} image={item.images} discount={item.discount || 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
