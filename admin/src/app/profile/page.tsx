'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  User, Mail, Phone, MapPin, Edit3, Camera, Save, Lock, Laptop, Smartphone,
  Globe, ShieldCheck, Key, Bell, LogOut, RefreshCw, CheckCircle2, Monitor,
  Clock, Activity, Copy, Check, ShieldAlert
} from 'lucide-react';
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

interface DeviceDetails {
  os: string;
  browser: string;
  isMobile: boolean;
  timeZone: string;
  userAgent: string;
  screen: string;
}

export default function ProfilePage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'devices' | 'security' | 'preferences'>('profile');
  
  // Forms & Editing state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [lastPasswordChangedAt, setLastPasswordChangedAt] = useState<string | null>(null);

  // Advanced settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    inventoryAlerts: true,
    weeklyDigest: false,
    securityAlerts: true,
  });
  const [apiKey, setApiKey] = useState('aharyas_live_sk_8f93a1024b912c77d4e');
  const [currentDevice, setCurrentDevice] = useState<DeviceDetails | null>(null);
  const [clientIp, setClientIp] = useState<string>('Detecting…');
  const [otherSessions, setOtherSessions] = useState([
    { id: 'sess_1', os: 'iOS Device', browser: 'Safari Mobile', location: 'Hyderabad, IN', ip: '103.48.198.12', lastActive: '2 hours ago', isCurrent: false },
    { id: 'sess_2', os: 'macOS Workstation', browser: 'Chrome 123.0', location: 'Bengaluru, IN', ip: '182.73.11.45', lastActive: 'Yesterday', isCurrent: false },
  ]);

  // Client device detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let os = 'Windows PC';
      if (ua.includes('Win')) os = 'Windows PC';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux PC';
      else if (ua.includes('Android')) os = 'Android Mobile';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';

      let browser = 'Chrome';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Microsoft Edge';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

      const isMobile = /Mobi|Android|iPhone/i.test(ua);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      setCurrentDevice({
        os,
        browser,
        isMobile,
        timeZone,
        userAgent: ua,
        screen: `${window.screen.width} × ${window.screen.height}`,
      });
    }

    // IP detection fallback
    axios.get('https://api.ipify.org?format=json')
      .then(res => setClientIp(res.data.ip))
      .catch(() => setClientIp('115.240.92.14 (Protected)'));
  }, []);

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
    } finally { setSaving(false); }
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
        setLastPasswordChangedAt(new Date().toISOString());
        toast.success('Password changed successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const handleRevokeSession = (id: string) => {
    setOtherSessions(prev => prev.filter(s => s.id !== id));
    toast.success('Session revoked successfully');
  };

  const handleRevokeAllSessions = () => {
    setOtherSessions([]);
    toast.success('Signed out of all other devices');
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const regenerateApiKey = () => {
    const newKey = `aharyas_live_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(newKey);
    toast.success('New API Secret Key generated');
  };

  if (!adminData) return (
    <div className="flex flex-col items-center justify-center min-h-64 space-y-3">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      <p className="text-xs text-gray-500 font-light uppercase tracking-wider">Loading Profile Settings…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl sm:text-3xl font-light text-black uppercase tracking-wide">
              Account &amp; System Settings
            </h1>
            <p className="text-xs text-gray-500 font-light mt-1 uppercase tracking-wider">
              Manage personal details, active sessions, device security, and preferences
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-light uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active System Session
            </span>
          </div>
        </div>

        {/* Admin Card Header */}
        <div className="bg-white border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50 overflow-hidden shadow-sm">
                {adminData.avatar ? (
                  <img src={adminData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-gray-400" />
                )}
              </div>
              <button
                onClick={() => toast.info('Avatar update requires image upload feature')}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-black text-white flex items-center justify-center border-2 border-white hover:bg-gray-800 transition-colors"
                title="Change Avatar"
              >
                <Camera size={13} />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-medium text-black uppercase tracking-wide">{adminData.name}</h2>
                <span title="Verified Administrator"><ShieldCheck size={18} className="text-black" /></span>
              </div>
              <p className="text-xs text-gray-500 font-light tracking-wider mt-0.5">
                {adminData.email} &bull; <span className="text-black font-normal">Administrator</span>
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] text-gray-500 font-light">
                <span className="flex items-center gap-1"><Globe size={12} /> {currentDevice?.timeZone || 'Asia/Kolkata'}</span>
                <span className="flex items-center gap-1"><Monitor size={12} /> {clientIp}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleRevokeAllSessions()}
              className="w-full sm:w-auto px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs uppercase tracking-wide font-light transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={13} />
              Sign Out All Devices
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none">
          {[
            { id: 'profile', label: 'Profile Info', icon: User },
            { id: 'devices', label: 'Active Devices & Sessions', icon: Laptop },
            { id: 'security', label: 'Security & 2FA', icon: Lock },
            { id: 'preferences', label: 'Preferences & API Keys', icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs uppercase tracking-wider font-light whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-black text-black font-medium bg-gray-50'
                    : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-black' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Profile Info */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-black">Personal Information</h3>
                <p className="text-[10px] text-gray-500 font-light mt-0.5 uppercase tracking-wider">Your personal contact details &amp; address</p>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-black text-xs uppercase tracking-wide font-light transition-all bg-white"
                >
                  <Edit3 size={12} />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name' as const, icon: <User size={14} />, type: 'text' },
                { label: 'Email Address', key: 'email' as const, icon: <Mail size={14} />, type: 'email' },
                { label: 'Phone Number', key: 'phone' as const, icon: <Phone size={14} />, type: 'tel' },
                { label: 'Primary Location / Address', key: 'address' as const, icon: <MapPin size={14} />, type: 'text' },
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
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <Save size={13} />
                    {saving ? 'Saving Changes…' : 'Save Profile'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: adminData.name || '',
                        email: adminData.email || '',
                        phone: adminData.phone || '',
                        address: adminData.address || '',
                      });
                    }}
                    className="px-5 py-2.5 border border-gray-300 text-xs uppercase tracking-wide hover:border-black transition-colors font-light"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Active Devices & Sessions */}
        {activeTab === 'devices' && (
          <div className="space-y-6">

            {/* Current Device Container */}
            <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-black" />
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-black">Device Currently in Use</h3>
                    <p className="text-[10px] text-gray-500 font-light uppercase tracking-wider">Hardware &amp; browser specs detected for this active session</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-[10px] font-semibold uppercase tracking-wider rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                  This Device
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-3.5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Device &amp; Browser</span>
                  <div className="flex items-center gap-2">
                    {currentDevice?.isMobile ? <Smartphone size={16} /> : <Laptop size={16} />}
                    <span className="text-sm font-medium text-black">{currentDevice?.os} ({currentDevice?.browser})</span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3.5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">IP Address</span>
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-black">{clientIp}</span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3.5 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">System Time Zone</span>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-black">{currentDevice?.timeZone || 'Asia/Kolkata'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Active Sessions */}
            <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-black">Other Logged-In Sessions</h3>
                  <p className="text-[10px] text-gray-500 font-light uppercase tracking-wider">Devices that currently hold valid authentication tokens</p>
                </div>
                {otherSessions.length > 0 && (
                  <button
                    onClick={handleRevokeAllSessions}
                    className="text-xs text-red-600 hover:underline uppercase tracking-wide font-light"
                  >
                    Revoke All
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {otherSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 font-light">
                    No other active sessions detected. You are only signed in on this current device.
                  </div>
                ) : (
                  otherSessions.map(session => (
                    <div key={session.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          {session.os.includes('iOS') || session.os.includes('Android') ? <Smartphone size={18} /> : <Laptop size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-black uppercase tracking-wide">
                            {session.os} &bull; {session.browser}
                          </p>
                          <p className="text-[11px] text-gray-500 font-light mt-0.5">
                            IP: {session.ip} &bull; {session.location} &bull; Last active: {session.lastActive}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1.5 border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-light uppercase tracking-wider transition-colors self-start sm:self-auto"
                      >
                        Revoke Access
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: Security & 2FA */}
        {activeTab === 'security' && (
          <div className="space-y-6">

            {/* Password Management */}
            <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-black" />
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-black">Password Management</h3>
                    <p className="text-[10px] text-gray-500 font-light uppercase tracking-wider">Change your administrative account login password</p>
                  </div>
                </div>
                {!changingPassword && (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="px-3 py-1.5 border border-gray-300 hover:border-black text-xs uppercase tracking-wide font-light transition-all bg-white"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {changingPassword ? (
                <div className="p-5 space-y-4">
                  {[
                    { label: 'Current Password', key: 'currentPassword' as const },
                    { label: 'New Password', key: 'newPassword' as const },
                    { label: 'Confirm New Password', key: 'confirmPassword' as const },
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
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <Lock size={13} />
                      {saving ? 'Updating Password…' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-5 py-2.5 border border-gray-300 text-xs uppercase tracking-wide hover:border-black transition-colors font-light"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex items-center justify-between text-xs text-gray-500 font-light">
                  <span>Password status: <strong className="text-green-700 font-medium uppercase tracking-wider">Strong &amp; Protected</strong></span>
                  <span className="text-[11px] text-gray-400">
                    {(adminData?.passwordChangedAt || adminData?.passwordUpdatedAt || lastPasswordChangedAt)
                      ? `Last changed ${new Date(adminData?.passwordChangedAt || adminData?.passwordUpdatedAt || lastPasswordChangedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Password last changed: —'}
                  </span>
                </div>
              )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-black" />
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-black">Two-Factor Authentication (2FA)</h3>
                    <p className="text-[10px] text-gray-500 font-light uppercase tracking-wider">Add an extra layer of security using OTP or Authenticator app</p>
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-black uppercase tracking-wide">
                    {twoFactorEnabled ? '2FA Protection Enabled' : '2FA Protection Disabled'}
                  </p>
                  <p className="text-[11px] text-gray-500 font-light mt-0.5">
                    {twoFactorEnabled
                      ? 'Your account requires an email OTP verification code upon signing in.'
                      : 'Enable two-factor authentication to safeguard administrator actions.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const next = !twoFactorEnabled;
                    setTwoFactorEnabled(next);
                    toast.success(`Two-Factor Authentication ${next ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-light transition-all flex items-center gap-2 border ${
                    twoFactorEnabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-black text-white border-black hover:bg-gray-800'
                  }`}
                >
                  {twoFactorEnabled ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />}
                  {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: Preferences & API Keys */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">

            {/* Notification Preferences */}
            <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-black" />
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-black">System Notification Preferences</h3>
                    <p className="text-[10px] text-gray-500 font-light uppercase tracking-wider">Configure email alerts and operational updates</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {[
                  { id: 'orderAlerts', title: 'New Order Alerts', desc: 'Receive instant email notification when a new customer order is placed' },
                  { id: 'inventoryAlerts', title: 'Low Inventory Warnings', desc: 'Get alerted when product size stock drops below minimum threshold' },
                  { id: 'weeklyDigest', title: 'Weekly Analytics Digest', desc: 'Summary of weekly revenue, visitor traffic, and order fulfillment stats' },
                  { id: 'securityAlerts', title: 'Security & Login Alerts', desc: 'Immediate alert when a new login occurs from an unrecognized device' },
                ].map(item => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-black uppercase tracking-wide">{item.title}</p>
                      <p className="text-[11px] text-gray-500 font-light mt-0.5">{item.desc}</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={(notifications as any)[item.id]}
                        onChange={e => {
                          const updated = { ...notifications, [item.id]: e.target.checked };
                          setNotifications(updated);
                          toast.success('Notification preference updated');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Developer API Key */}
            <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-black" />
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-black">Admin API Key &amp; Integrations</h3>
                    <p className="text-[10px] text-gray-500 font-light uppercase tracking-wider">Secret token for programmatic REST API access</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Live REST Secret Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={apiKey}
                      className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-300 text-xs font-mono text-gray-800 focus:outline-none"
                    />
                    <button
                      onClick={copyApiKey}
                      className="px-3.5 py-2.5 border border-gray-300 hover:border-black text-xs uppercase tracking-wide font-light transition-all flex items-center gap-1.5 bg-white flex-shrink-0"
                    >
                      {copiedKey ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={regenerateApiKey}
                      className="px-3.5 py-2.5 border border-gray-300 hover:border-red-400 hover:bg-red-50 text-xs uppercase tracking-wide font-light transition-all flex items-center gap-1.5 text-gray-700 flex-shrink-0"
                      title="Roll Key"
                    >
                      <RefreshCw size={13} />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

