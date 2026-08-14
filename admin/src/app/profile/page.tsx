'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Edit3, Camera, Save, Lock } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { backendUrl } from '@/config';
import { useRouter } from 'next/navigation';

const isTokenValid = (token: string | null) => {
  if (!token) return false;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 > Date.now() + 30_000;
  } catch { return false; }
};

export default function ProfilePage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isTokenValid(token)) {
        toast.error('Session expired. Please login again.');
        logout();
        return;
      }
      try {
        const decoded = jwtDecode<{ id: string }>(token!);
        const res = await axios.get(`${backendUrl}/api/v1/user/profile/${decoded.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setAdminData(res.data.user);
          setFormData({
            name: res.data.user.name || '',
            email: res.data.user.email || '',
            phone: res.data.user.phone || '',
            address: res.data.user.address || '',
          });
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
          router.push('/');
        }
      }
    };
    if (token) fetchAdminData();
  }, [token, logout, router]);

  const handleSave = async () => {
    if (!isTokenValid(token)) { toast.error('Session expired.'); return; }
    try {
      setSaving(true);
      const decoded = jwtDecode<{ id: string }>(token!);
      const res = await axios.put(
        `${backendUrl}/api/v1/user/profile/${decoded.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAdminData(res.data.user);
        setEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired.');
        logout();
        router.push('/');
      } else toast.error('Failed to update profile.');
    } fontally: { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (!isTokenValid(token)) { toast.error('Session expired.'); return; }
    try {
      setSaving(true);
      const res = await axios.put(
        `${backendUrl}/api/v1/user/change-password`,
        { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  if (!adminData) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-light text-black uppercase tracking-wide">Profile</h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-light mt-1 uppercase tracking-wider">Manage your account</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-gray-300 hover:border-black text-xs uppercase tracking-wide font-light transition-all"
            >
              <Edit3 size={12} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>

        {/* Avatar */}
        <div className="bg-white border border-gray-200 p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50">
              {adminData.avatar
                ? <img src={adminData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <User size={32} className="text-gray-400" />
              }
            </div>
            {editing && (
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-black text-white flex items-center justify-center border-2 border-white hover:bg-gray-800 transition-colors">
                <Camera size={12} />
              </button>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-black">{adminData.name}</p>
            <p className="text-xs text-gray-500 font-light uppercase tracking-wider mt-0.5">Administrator</p>
          </div>
        </div>

        {/* Info fields */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-medium uppercase tracking-wide text-black">Personal Information</h3>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {[
              { label: 'Full Name', key: 'name' as const, icon: <User size={14} />, type: 'text' },
              { label: 'Email', key: 'email' as const, icon: <Mail size={14} />, type: 'email' },
              { label: 'Phone', key: 'phone' as const, icon: <Phone size={14} />, type: 'tel' },
              { label: 'Address', key: 'address' as const, icon: <MapPin size={14} />, type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  {field.label}
                </label>
                {editing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{field.icon}</span>
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black transition-colors font-light"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                    <span className="text-gray-400">{field.icon}</span>
                    <span className="text-sm text-black font-light">{formData[field.key] || '—'}</span>
                  </div>
                )}
              </div>
            ))}

            {editing && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Save size={12} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setEditing(false); setFormData({ name: adminData.name || '', email: adminData.email || '', phone: adminData.phone || '', address: adminData.address || '' }); }}
                  className="px-4 py-2 border border-gray-300 text-xs uppercase tracking-wide hover:border-black transition-colors font-light"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-gray-600" />
              <h3 className="text-xs font-medium uppercase tracking-wide text-black">Security</h3>
            </div>
            {!changingPassword && (
              <button
                onClick={() => setChangingPassword(true)}
                className="text-[10px] font-light uppercase tracking-wide text-gray-500 hover:text-black transition-colors"
              >
                Change Password
              </button>
            )}
          </div>
          {changingPassword ? (
            <div className="p-4 sm:p-6 space-y-4">
              {[
                { label: 'Current Password', key: 'currentPassword' as const },
                { label: 'New Password', key: 'newPassword' as const },
                { label: 'Confirm Password', key: 'confirmPassword' as const },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="password"
                    value={passwordData[field.key]}
                    onChange={e => setPasswordData(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black transition-colors font-light"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Lock size={12} />
                  {saving ? 'Updating…' : 'Update Password'}
                </button>
                <button
                  onClick={() => { setChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                  className="px-4 py-2 border border-gray-300 text-xs uppercase tracking-wide hover:border-black transition-colors font-light"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <p className="text-xs text-gray-500 font-light">Password last changed: —</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
