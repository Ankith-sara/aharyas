import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { jwtDecode } from "jwt-decode";
import {
  ChevronRight, Heart, Clock, User, ShoppingBag, Settings, LogOut, Edit2, Trash2,
  MapPinHouse, X, Mail, Calendar, Plus, ArrowRight, AlertCircle, Eye, EyeOff, Lock, Camera
} from "lucide-react";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from '../context/api';

function ModalShell({ onBackdropClick, zIndex = "z-50", maxWidth = "max-w-lg", children }) {
  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center`}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={onBackdropClick} />
      <div
        className={`
          relative bg-white w-full ${maxWidth} shadow-2xl sm:rounded-sm z-10 animate-slideUp
          flex flex-col max-h-[92dvh] sm:max-h-[88vh]
        `}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function ModalHeader({ title, subtitle, icon, onClose }) {
  return (
    <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-md font-medium tracking-wide uppercase truncate">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 font-light mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1 -mr-1"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, submitForm, submitLabel, loading, cancelLabel = "Cancel" }) {
  return (
    <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 bg-white flex flex-col-reverse sm:flex-row gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 sm:flex-none sm:w-28 py-3 border border-gray-300 text-black font-light hover:border-black hover:bg-gray-50 transition-all uppercase text-md tracking-wide"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={submitForm}
        disabled={loading}
        className="flex-1 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all disabled:opacity-50 uppercase text-sm"
      >
        {loading ? "Please wait…" : submitLabel}
      </button>
    </div>
  );
}

function PasswordField({ label, value, show, onToggle, onChange, error, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`w-full px-3 py-3 pr-10 border bg-white focus:outline-none focus:border-black transition-colors font-light text-sm ${error ? "border-red-400" : "border-gray-300"}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
          onClick={onToggle}
        >
          {show ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1 font-light">{error}</p>}
    </div>
  );
}

function AddressForm({ initial, onSave }) {
  const [form, setForm] = useState({
    label: initial.label || "",
    address: initial.address || "",
    city: initial.city || "",
    state: initial.state || "",
    zip: initial.zip || "",
    country: initial.country || "",
    phone: initial.phone || "",
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const inp =
    "w-full px-3 py-2.5 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light text-sm";
  const lbl =
    "block text-sm font-medium text-gray-500 uppercase tracking-wider mb-1.5";
  const req = <span className="text-red-400 ml-0.5">*</span>;

  return (
    <form
      id="address-form"
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
        <div>
          <label className={lbl}>Label</label>
          <input className={inp} value={form.label} onChange={set("label")} placeholder="Home / Office" />
        </div>
        <div>
          <label className={lbl}>Street Address{req}</label>
          <input className={inp} value={form.address} onChange={set("address")} placeholder="123 Main Street" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>City{req}</label>
          <input className={inp} value={form.city} onChange={set("city")} placeholder="City" required />
        </div>
        <div>
          <label className={lbl}>State{req}</label>
          <input className={inp} value={form.state} onChange={set("state")} placeholder="State" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>ZIP / Postal{req}</label>
          <input className={inp} value={form.zip} onChange={set("zip")} placeholder="110001" required />
        </div>
        <div>
          <label className={lbl}>Country{req}</label>
          <input className={inp} value={form.country} onChange={set("country")} placeholder="India" required />
        </div>
      </div>

      <div>
        <label className={lbl}>Phone Number</label>
        <input type="tel" className={inp} value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
      </div>
    </form>
  );
}

const MyProfile = () => {
  const [userData, setUserData] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [editProfile, setEditProfile] = useState({ name: "", email: "", image: "" });
  const [addressModal, setAddressModal] = useState({ open: false, address: {}, index: -1 });
  const [loading, setLoading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteAddressModal, setDeleteAddressModal] = useState({ open: false, index: -1 });
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState({});

  const { setToken, navigate } = useAuth();

  /* body scroll lock */
  useEffect(() => {
    const anyOpen = logoutModal || deleteAddressModal.open || errorModal.open || activeSection !== null || addressModal.open;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [logoutModal, deleteAddressModal.open, errorModal.open, activeSection, addressModal.open]);

  /* ESC to close */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (addressModal.open) { setAddressModal({ open: false, address: {}, index: -1 }); return; }
      if (activeSection) { setActiveSection(null); return; }
      if (errorModal.open) { setErrorModal({ open: false, message: "" }); return; }
      if (deleteAddressModal.open) { setDeleteAddressModal({ open: false, index: -1 }); return; }
      if (logoutModal) { setLogoutModal(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [addressModal.open, activeSection, errorModal.open, deleteAddressModal.open, logoutModal]);

  /* fetch user */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    let userId;
    try { userId = jwtDecode(token).id; }
    catch { navigate("/login"); return; }
    api
      .get(`/api/v1/user/profile/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.success) {
          setUserData(res.data.user);
          setEditProfile({ name: res.data.user.name, email: res.data.user.email, image: res.data.user.image || "" });
        } else navigate("/login");
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  useEffect(() => {
    setRecentlyViewed(JSON.parse(localStorage.getItem("recentlyViewed")) || []);
  }, []);

  const logout = () => {
    navigate("/login");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditProfile((p) => ({ ...p, imageFile: file, image: URL.createObjectURL(file) }));
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("name", editProfile.name);
      fd.append("email", editProfile.email);
      if (editProfile.imageFile) fd.append("image", editProfile.imageFile);
      const res = await api.put(
        `/api/v1/user/profile/${userData._id}`, fd,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        setUserData(res.data.user);
        setEditProfile({ name: res.data.user.name, email: res.data.user.email, image: res.data.user.image || "" });
        setActiveSection(null);
      }
      else setErrorModal({ open: true, message: res.data.message || "Failed to update profile." });
    } catch { setErrorModal({ open: true, message: "Failed to update profile." }); }
    finally { setLoading(false); }
  };

  const saveAddress = async (addressObj, index = -1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        `/api/v1/user/address/${userData._id}`,
        { addressObj, index },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUserData((p) => ({ ...p, addresses: res.data.addresses }));
        setAddressModal({ open: false, address: {}, index: -1 });
      }
      else setErrorModal({ open: true, message: res.data.message || "Failed to save address." });
    } catch { setErrorModal({ open: true, message: "Failed to save address." }); }
    setLoading(false);
  };

  const confirmDeleteAddress = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete(
        `/api/v1/user/address/${userData._id}`,
        { data: { index: deleteAddressModal.index }, headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUserData((p) => ({ ...p, addresses: res.data.addresses }));
        setDeleteAddressModal({ open: false, index: -1 });
      }
      else setErrorModal({ open: true, message: res.data.message || "Failed to delete address." });
    } catch { setErrorModal({ open: true, message: "Failed to delete address." }); }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) errs.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 8) errs.newPassword = "Minimum 8 characters";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        `/api/v1/user/change-password/${userData._id}`,
        { password: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setActiveSection(null);
      } 
      else setErrorModal({ open: true, message: res.data.message || "Failed to update password" });
    } catch (err) {
      setErrorModal({ open: true, message: err.response?.data?.message || "Failed to update password" });
    } finally { setLoading(false); }
  };

  const closePasswordModal = () => {
    setActiveSection(null);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
  };

  const menuItems = [
    { icon: <MapPinHouse size={18} />, text: "Delivery Address", description: "Manage your delivery locations" },
    { icon: <ShoppingBag size={18} />, text: "Order History", link: "/orders", description: "View your past orders" },
    { icon: <Heart size={18} />, text: "Wishlist", link: "/wishlist", description: "Items you've saved for later" },
    { icon: <Settings size={18} />, text: "Account Settings", description: "Notifications, password, privacy" },
  ];

  /* loading skeleton */
  if (!userData) {
    return (
      <div className="min-h-screen bg-white text-black mt-16">
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-2xl sm:text-3xl mb-4 sm:mb-6"><Title text1="MY" text2="PROFILE" /></div>
            </div>
            <div className="flex items-center justify-center py-20 animate-pulse">
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-200 w-16 h-16 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-200 h-4 w-1/2 rounded" />
                    <div className="bg-gray-200 h-3 w-1/3 rounded" />
                  </div>
                </div>
                <div className="bg-gray-200 h-32 w-full rounded" />
                <div className="bg-gray-200 h-32 w-full rounded" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black mt-16">

      {/* LOGOUT */}
      {logoutModal && (
        <ModalShell onBackdropClick={() => setLogoutModal(false)} maxWidth="max-w-sm">
          <ModalHeader title="Confirm Logout" onClose={() => setLogoutModal(false)} />
          <div className="flex-1 p-5">
            <p className="text-sm text-gray-600 font-light leading-relaxed">Are you sure you want to log out?</p>
          </div>
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 flex gap-3">
            <button onClick={() => setLogoutModal(false)} className="flex-1 py-3 border border-gray-300 text-black font-light hover:bg-gray-50 transition-all uppercase text-sm">Cancel</button>
            <button onClick={() => { setLogoutModal(false); logout(); }} className="flex-1 py-3 border border-gray-300 text-black font-light hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all uppercase text-sm">Logout</button>
          </div>
        </ModalShell>
      )}

      {/* DELETE ADDRESS */}
      {deleteAddressModal.open && (
        <ModalShell onBackdropClick={() => setDeleteAddressModal({ open: false, index: -1 })} maxWidth="max-w-sm">
          <ModalHeader title="Delete Address" onClose={() => setDeleteAddressModal({ open: false, index: -1 })} />
          <div className="flex-1 p-5">
            <p className="text-sm text-gray-600 font-light leading-relaxed">Are you sure? This action cannot be undone.</p>
          </div>
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 flex gap-3">
            <button onClick={() => setDeleteAddressModal({ open: false, index: -1 })} className="flex-1 py-3 border border-gray-300 text-black font-light hover:bg-gray-50 transition-all uppercase text-sm">Cancel</button>
            <button onClick={confirmDeleteAddress} disabled={loading} className="flex-1 py-3 bg-red-500 text-white font-light hover:bg-red-600 transition-all uppercase disabled:opacity-50 text-sm">{loading ? "Deleting…" : "Delete"}</button>
          </div>
        </ModalShell>
      )}

      {/* ERROR */}
      {errorModal.open && (
        <ModalShell onBackdropClick={() => setErrorModal({ open: false, message: "" })} maxWidth="max-w-sm">
          <ModalHeader title="Error" icon={<AlertCircle size={15} className="text-red-500" />} onClose={() => setErrorModal({ open: false, message: "" })} />
          <div className="flex-1 p-5">
            <p className="text-sm text-gray-600 font-light leading-relaxed break-words">{errorModal.message}</p>
          </div>
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200">
            <button onClick={() => setErrorModal({ open: false, message: "" })} className="w-full py-3 bg-black text-white font-light hover:bg-gray-800 transition-all uppercase text-sm">OK</button>
          </div>
        </ModalShell>
      )}

      {activeSection === "Edit Profile" && (
        <ModalShell onBackdropClick={() => setActiveSection(null)} maxWidth="max-w-md">
          <ModalHeader title="Edit Profile" onClose={() => setActiveSection(null)} />

          <div className="flex-1 overflow-y-auto">
            <form id="edit-profile-form" onSubmit={handleEditProfileSubmit} className="p-5 space-y-5">

              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                    {editProfile.image
                      ? <img src={editProfile.image} alt="Profile" className="w-full h-full object-cover" />
                      : <User size={24} className="text-gray-400" />}
                  </div>
                  <label className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <Camera size={10} />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-md font-medium text-black truncate">{editProfile.name || "—"}</p>
                  <p className="text-sm text-gray-400 font-light mt-0.5">Tap the camera icon to change photo</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Full Name</label>
                <input
                  className="w-full px-3 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light text-sm"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light text-sm"
                  value={editProfile.email}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </form>
          </div>

          <ModalFooter
            onCancel={() => setActiveSection(null)}
            submitForm="edit-profile-form"
            submitLabel="Save Changes"
            loading={loading}
          />
        </ModalShell>
      )}

      {activeSection === "Account Settings" && (
        <ModalShell onBackdropClick={closePasswordModal} maxWidth="max-w-lg">
          <ModalHeader
            title="Change Password"
            subtitle="Update your account password"
            icon={<Lock size={13} />}
            onClose={closePasswordModal}
          />

          <div className="flex-1 overflow-y-auto">
            <form id="password-form" onSubmit={handleChangePassword} className="p-5 space-y-4">
              <PasswordField
                label="Current Password"
                value={passwordForm.currentPassword}
                show={showPw.current}
                onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                onChange={(v) => setPasswordForm((f) => ({ ...f, currentPassword: v }))}
                error={passwordErrors.currentPassword}
                placeholder="Enter current password"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField
                  label="New Password"
                  value={passwordForm.newPassword}
                  show={showPw.next}
                  onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, newPassword: v }))}
                  error={passwordErrors.newPassword}
                  placeholder="Min. 8 characters"
                />
                <PasswordField
                  label="Confirm Password"
                  value={passwordForm.confirmPassword}
                  show={showPw.confirm}
                  onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, confirmPassword: v }))}
                  error={passwordErrors.confirmPassword}
                  placeholder="Repeat new password"
                />
              </div>

              <p className="text-xs text-gray-400 font-light">
                Min. 8 characters · Must differ from current password
              </p>
            </form>
          </div>

          <ModalFooter
            onCancel={closePasswordModal}
            submitForm="password-form"
            submitLabel="Update Password"
            loading={loading}
          />
        </ModalShell>
      )}

      {/* DELIVERY ADDRESS LIST */}
      {activeSection === "Delivery Address" && (
        <ModalShell onBackdropClick={() => setActiveSection(null)} maxWidth="max-w-2xl">
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPinHouse size={14} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-medium tracking-wide uppercase truncate">Delivery Addresses</h2>
                <p className="text-xs text-gray-500 font-light mt-0.5">Manage your delivery locations</p>
              </div>
            </div>
            <button
              onClick={() => setAddressModal({ open: true, address: {}, index: -1 })}
              className="flex-shrink-0 flex items-center gap-1.5 bg-black text-white px-3 py-2 text-xs font-light hover:bg-gray-800 transition-colors uppercase tracking-wide"
            >
              <Plus size={12} />
              Add New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {(!userData.addresses || userData.addresses.length === 0) ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-2 border-gray-300 flex items-center justify-center mx-auto mb-4">
                  <MapPinHouse size={20} className="text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-black mb-2 tracking-wide uppercase">No Addresses Found</h3>
                <p className="text-sm text-gray-500 font-light mb-5">Add your first delivery address to get started</p>
                <button onClick={() => setAddressModal({ open: true, address: {}, index: -1 })} className="px-5 py-2.5 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors uppercase">
                  Add Address
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userData.addresses.map((addr, idx) => (
                  <div key={idx} className="border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black tracking-wide mb-0.5 truncate">
                          {addr.label || `Address ${idx + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 font-light leading-relaxed">
                          {[addr.address, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")}
                          {addr.phone && <span className="ml-1">· {addr.phone}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setAddressModal({ open: true, address: addr, index: idx })} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors" aria-label="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteAddressModal({ open: true, index: idx })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" aria-label="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 bg-white flex justify-end">
            <button onClick={() => setActiveSection(null)} className="px-5 py-2.5 border border-gray-300 text-black text-sm font-light hover:border-black hover:bg-gray-50 transition-all uppercase">
              Close
            </button>
          </div>
        </ModalShell>
      )}

      {/* ADDRESS FORM */}
      {addressModal.open && (
        <ModalShell
          onBackdropClick={() => setAddressModal({ open: false, address: {}, index: -1 })}
          zIndex="z-[60]"
          maxWidth="max-w-xl"
        >
          <ModalHeader
            title={addressModal.index >= 0 ? "Edit Address" : "Add New Address"}
            onClose={() => setAddressModal({ open: false, address: {}, index: -1 })}
          />

          <div className="flex-1 overflow-y-auto">
            <AddressForm
              initial={addressModal.address}
              onSave={(addr) => saveAddress(addr, addressModal.index)}
            />
          </div>

          <ModalFooter
            onCancel={() => setAddressModal({ open: false, address: {}, index: -1 })}
            submitForm="address-form"
            submitLabel="Save Address"
            loading={loading}
          />
        </ModalShell>
      )}

      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
            <Title text1="MY" text2="PROFILE" />
          </div>
          <p className="text-sm sm:text-base text-gray-500 font-light">Manage your account and personal preferences</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-20 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid xl:grid-cols-[1fr_2fr] gap-4 sm:gap-6 lg:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Information</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col items-center mb-4 sm:mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden">
                        <img src={userData.image} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <button
                        className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 bg-black/20 transition-all duration-200"
                        onClick={() => setActiveSection("Edit Profile")}
                      >
                        <Edit2 className="text-white" size={16} />
                      </button>
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-black mt-3 sm:mt-4 mb-2 tracking-wide text-center break-words max-w-full px-2">{userData.name}</h3>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500 font-light uppercase tracking-wider">Active Member</span>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</span>
                      </div>
                      <p className="text-xs sm:text-sm text-black font-light break-all">{userData.email}</p>
                    </div>
                    <div className="border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={12} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</span>
                      </div>
                      <p className="text-xs sm:text-sm text-black font-light">
                        {new Date(userData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full py-2.5 sm:py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all uppercase text-sm"
                    onClick={() => setActiveSection("Edit Profile")}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 shadow-sm">
                <button
                  className="w-full flex items-center justify-center gap-3 p-4 sm:p-6 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all font-light"
                  onClick={() => setLogoutModal(true)}
                >
                  <LogOut size={16} />
                  <span className="uppercase text-sm tracking-wide">Sign Out</span>
                </button>
              </div>
            </div>

            {/* ── Account management ── */}
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Management</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {menuItems.map((item, index) => {
                    const row = (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => !item.link && setActiveSection(item.text)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-200 text-gray-600 flex-shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-black tracking-wide text-sm sm:text-base truncate">{item.text}</p>
                            <p className="text-xs sm:text-sm text-gray-500 font-light truncate">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    );
                    return item.link ? <Link to={item.link} key={index}>{row}</Link> : row;
                  })}
                </div>
              </div>

              {/* Recently viewed */}
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recently Viewed</span>
                  </div>
                </div>
                {recentlyViewed.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-gray-300 flex items-center justify-center mb-4 sm:mb-6">
                      <Clock size={20} className="text-gray-400" />
                    </div>
                    <div className="text-center max-w-md mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 tracking-wide uppercase">No Recent Activity</h3>
                      <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
                        Start browsing our collection to see recently viewed items here
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/collection")}
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all text-sm"
                    >
                      <span>DISCOVER PRODUCTS</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {recentlyViewed.slice(0, 8).map((item) => (
                        <ProductItem key={item._id} id={item._id} slug={item.slug} name={item.name} price={item.price} image={item.images} discount={item.discount || 0} />
                      ))}
                    </div>
                    {recentlyViewed.length > 8 && (
                      <div className="text-center mt-4 sm:mt-6">
                        <button className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-black font-light tracking-wide hover:border-black hover:bg-gray-50 transition-all uppercase text-sm">
                          View More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default MyProfile;