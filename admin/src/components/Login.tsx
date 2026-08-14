'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Shield, Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login, backendUrl: authBackendUrl } = useAuth();
  const backendUrl = authBackendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3040';

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    setOtp(updated.join(''));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter a valid email');
    if (!password) return toast.error('Please enter a password');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!confirmPassword) return toast.error('Please confirm your password');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/forgot-password-otp`, {
        email,
        newPassword: password,
      });
      if (res.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        toast.success('OTP sent to your email');
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/reset-password`, { email, otp });
      if (res.data.success) {
        toast.success(res.data.message || 'Password reset successful');
        resetForm();
        setIsForgotPassword(false);
      } else {
        toast.error(res.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/admin-login`, { email, password });
      if (res.data.success) {
        toast.success('Admin login successful');
        login(res.data.token);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/admin-google-auth`, {
        credential: credentialResponse.credential,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Signed in with Google!');
        login(res.data.token);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setOtp(''); setOtpSent(false); setOtpDigits(Array(6).fill(''));
    setOtpTimer(0); setShowPassword(false); setShowConfirmPassword(false);
  };

  const handleForgotPassword = () => { setIsForgotPassword(true); resetForm(); };
  const handleBackToLogin = () => { setIsForgotPassword(false); resetForm(); };

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const inputClass = "w-full pl-10 pr-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm bg-white text-black placeholder-gray-400";
  const labelClass = "block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-black flex items-center justify-center flex-shrink-0">
              {isForgotPassword ? <KeyRound className="text-black" size={20} /> : <Shield className="text-black" size={20} />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-medium text-black uppercase tracking-wide">Aharyas Admin</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-light">
                {isForgotPassword ? 'Password Recovery' : 'Management Panel'}
              </p>
            </div>
          </div>
          <div className="w-full h-0.5 bg-black"></div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200">

          {!isForgotPassword && !otpSent && (
            <div className="border-b border-gray-200">
              <div className="py-3 sm:py-4 px-4 bg-black text-white text-center">
                <span className="text-xs font-medium uppercase tracking-wider">Sign In</span>
              </div>
            </div>
          )}

          {(isForgotPassword || otpSent) && (
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 sm:gap-3">
                {isForgotPassword
                  ? <KeyRound size={18} className="text-gray-600" />
                  : <Mail size={18} className="text-gray-600" />}
                <div>
                  <h2 className="text-sm sm:text-base font-medium uppercase tracking-wide text-black">
                    {otpSent ? 'Verify OTP' : 'Reset Password'}
                  </h2>
                  <p className="text-xs text-gray-500 font-light uppercase tracking-wider">
                    {otpSent ? `Code sent to ${email}` : 'Enter your email and new password'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={isForgotPassword ? handleSendOtp : handleLogin} className="p-5 sm:p-8 space-y-4 sm:space-y-5">

              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="email" placeholder="admin@aharyas.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
              </div>

              <div>
                <label className={labelClass}>{isForgotPassword ? 'New Password' : 'Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm bg-white text-black placeholder-gray-400"
                    required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isForgotPassword && (
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm bg-white text-black placeholder-gray-400"
                      required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {!isForgotPassword && (
                <div className="flex justify-end">
                  <button type="button" onClick={handleForgotPassword}
                    className="text-xs text-gray-500 hover:text-black uppercase tracking-wider font-light transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full bg-black text-white py-3 sm:py-4 px-6 font-light text-sm uppercase tracking-wide hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    isForgotPassword ? 'Send Reset Code' : 'Sign In'
                  )}
                </button>
              </div>

              {isForgotPassword && (
                <button type="button" onClick={handleBackToLogin}
                  className="w-full py-2 text-xs text-gray-500 hover:text-black uppercase tracking-wider font-light transition-colors border border-gray-200 hover:border-black">
                  Back to Sign In
                </button>
              )}

              {!isForgotPassword && (
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-light">or</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google sign-in failed. Please try again.')}
                      text="signin_with"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                    />
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 font-light uppercase tracking-wider mb-1">Enter the 6-digit code sent to</p>
                <p className="text-sm font-medium text-black uppercase tracking-wide break-all">{email}</p>
              </div>

              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, i) => (
                  <input key={i} type="text" maxLength={1}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center border-2 border-gray-300 focus:border-black focus:outline-none text-lg sm:text-2xl font-medium text-black transition-all duration-300"
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 font-light mb-2 uppercase tracking-wider">Didn&apos;t receive the code?</p>
                <button type="button" onClick={handleSendOtp} disabled={otpTimer > 0 || loading}
                  className="text-xs font-medium uppercase tracking-wider text-black hover:text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1">
                  {otpTimer > 0 ? (
                    <><div className="w-3 h-3 border border-gray-400 border-t-black rounded-full animate-spin"></div> Resend in {otpTimer}s</>
                  ) : (
                    <>Resend Code</>
                  )}
                </button>
              </div>

              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-black text-white py-3 sm:py-4 px-6 font-light text-sm uppercase tracking-wide hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Reset Password'
                )}
              </button>

              <button type="button" onClick={() => setOtpSent(false)}
                className="w-full py-2 text-xs text-gray-500 hover:text-black uppercase tracking-wider font-light transition-colors border border-gray-200 hover:border-black">
                Back to Reset Form
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-light">
            <Shield size={12} />
            <span>Secure admin access · Aharyas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
