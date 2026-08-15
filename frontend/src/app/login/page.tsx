'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { assets } from '../../assets/assets';

export default function LoginPage() {
  const router = useRouter();
  const [currentState, setCurrentState] = useState<'Login' | 'Sign Up'>('Login');
  const { token, setToken } = useAuth();
  const { backendUrl } = useProducts();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    setOtp(updated.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handlePostLoginRedirect = useCallback(() => {
    const returnUrl = typeof window !== 'undefined' ? sessionStorage.getItem('returnUrl') : null;
    if (returnUrl) {
      sessionStorage.removeItem('returnUrl');
    }
    router.push(returnUrl && returnUrl !== '/login' ? returnUrl : '/');
  }, [router]);

  useEffect(() => {
    if (token) {
      handlePostLoginRedirect();
    }
  }, [token, handlePostLoginRedirect]);

  const resetForm = () => {
    setName('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setErrors({});
    setOtpSent(false);
    setOtp('');
    setOtpError('');
    setOtpTimer(0);
    setOtpDigits(Array(6).fill(''));
  };

  const handleSendOtp = async () => {
    setOtpError('');
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setOtpLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/send-otp`, {
        email,
        name,
        password
      });
      if (res.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        toast.success('OTP sent to your email');
      } else {
        const errorMsg = res.data.message || 'Failed to send OTP';
        setOtpError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error sending OTP';
      setOtpError(errorMsg);
      toast.error(errorMsg);
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError('');

    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/verify-otp`, {
        email,
        otp,
      });

      if (res.data.success) {
        toast.success('Account created successfully!');
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.userId);
      } else {
        setOtpError(res.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error verifying OTP';
      setOtpError(errorMsg);
      toast.error(errorMsg);
    }
    setIsLoading(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/v1/user/login`, {
        email,
        password
      });

      if (response.data.success) {
        toast.success('Welcome back!');
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Something went wrong. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/v1/user/google-auth`, {
        credential: credentialResponse.credential,
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Signed in with Google!');
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSendOtp = async () => {
    setOtpError('');
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'New password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setOtpLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/forgot-password-otp`, { email, newPassword: password });
      if (res.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        toast.success('Password reset OTP sent to your email');
      } else {
        const msg = res.data.message || 'Failed to send OTP';
        setOtpError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error sending OTP';
      setOtpError(msg);
      toast.error(msg);
    }
    setOtpLoading(false);
  };

  const handleForgotPasswordVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError('');
    if (!otp || otp.length !== 6) { setOtpError('Please enter a valid 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/v1/user/reset-password`, { email, otp });
      if (res.data.success) {
        toast.success('Password reset successfully! Please sign in.');
        setIsForgotPassword(false);
        setCurrentState('Login');
        resetForm();
      } else {
        setOtpError(res.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error resetting password';
      setOtpError(msg);
      toast.error(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="flex h-full">
        {/* Left Panel */}
        <div className="hidden lg:block lg:w-1/2 relative h-full">
          <img
            src="https://okhai.org/cdn/shop/files/2_Block_Printing.jpg?format=webp&v=1712064644&width=350"
            alt="Aharyas Heritage"
            className="w-full h-full object-cover filter grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />
          <div className="absolute inset-0 flex items-center justify-center p-16">
            <div className="text-white max-w-lg">
              <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
                <Image src={assets.logo} alt="Aharyas" width={176} height={40} className="w-36 md:w-44 h-auto mix-blend-screen contrast-200 invert" />
              </Link>
              <div className="w-20 h-0.5 bg-white mb-8" />
              <p className="text-xl font-light leading-relaxed opacity-90">
                Where heritage meets high design, rooted deeply in culture, craft, and community.
              </p>
              <blockquote className="mt-12 border-l-2 border-white/40 pl-6 italic text-lg font-light opacity-80">
                &quot;Fashion should honor hands and carry stories forward.&quot;
              </blockquote>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
            <div className="w-full max-w-md">
              <div className="lg:hidden flex flex-col items-center mb-12">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <Image src={assets.logo} alt="Aharyas" width={128} height={32} className="w-32" />
                </Link>
              </div>

              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-3">
                  {isForgotPassword
                    ? (otpSent ? 'CHECK EMAIL' : 'RESET PASSWORD')
                    : currentState === 'Login' ? 'WELCOME BACK' : otpSent ? 'VERIFY EMAIL' : 'JOIN US'}
                </h2>
                <div className="w-16 h-0.5 bg-black mb-6" />
                <p className="text-gray-600 font-light leading-relaxed">
                  {isForgotPassword
                    ? (otpSent
                      ? 'Enter the 6-digit code sent to your email to reset your password'
                      : 'Enter your email and a new password. We\'ll send you a verification code.')
                    : currentState === 'Login'
                      ? 'Sign in to continue your journey with conscious luxury'
                      : otpSent
                        ? 'Enter the 6-digit code sent to your email'
                        : 'Create an account to begin your journey with handcrafted heritage'}
                </p>
              </div>

              {currentState === 'Login' && !isForgotPassword && (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border-b-2 bg-transparent ${errors.email ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-2 font-light">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-3.5 border-b-2 bg-transparent ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-2 font-light">{errors.password}</p>}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); resetForm(); }}
                      className="text-xs text-gray-500 hover:text-black uppercase tracking-widest font-light transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-8 py-4 bg-black text-white font-light tracking-[0.2em] text-sm hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 shadow-lg"
                  >
                    {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                  </button>

                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-light">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="flex justify-center mt-4">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google sign-in failed. Please try again.')}
                      useOneTap={false}
                      text="signin_with"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                    />
                  </div>
                </form>
              )}

              {isForgotPassword && !otpSent && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">Email Address</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border-b-2 bg-transparent ${errors.email ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-2 font-light">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">New Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-3.5 border-b-2 bg-transparent ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-2 font-light">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">Confirm New Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-3.5 border-b-2 bg-transparent ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-2 font-light">{errors.confirmPassword}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPasswordSendOtp}
                    disabled={otpLoading}
                    className="w-full mt-8 py-4 bg-black text-white font-light tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-lg"
                  >
                    {otpLoading ? 'SENDING...' : 'SEND RESET CODE'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); resetForm(); }}
                    className="w-full py-3 text-xs text-gray-500 hover:text-black uppercase tracking-widest font-light transition-colors border border-gray-200 hover:border-black"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}

              {isForgotPassword && otpSent && (
                <form onSubmit={handleForgotPasswordVerifyOtp} className="space-y-8">
                  <div>
                    <p className="text-sm text-gray-600 font-light text-center mb-8">
                      We sent a verification code to<br />
                      <span className="font-normal text-black">{email}</span>
                    </p>
                    <div className="flex gap-3 justify-center mb-2">
                      {Array(6).fill(0).map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          value={otpDigits[i] || ''}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 text-center text-lg font-light border-b-2 border-gray-300 focus:border-black focus:outline-none transition-all bg-transparent"
                        />
                      ))}
                    </div>
                  </div>
                  {otpError && (
                    <div className="bg-red-50 border-l-2 border-red-500 p-3">
                      <p className="text-red-600 text-sm font-light">{otpError}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-black text-white font-light tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-lg"
                  >
                    {isLoading ? 'RESETTING...' : 'RESET PASSWORD'}
                  </button>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); setOtpDigits(Array(6).fill('')); setOtpError(''); }}
                      className="text-sm text-gray-600 hover:text-black transition-colors font-light tracking-wide"
                    >
                      BACK
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPasswordSendOtp}
                      disabled={otpLoading || otpTimer > 0}
                      className="text-sm text-gray-600 hover:text-black transition-colors font-light tracking-wide"
                    >
                      {otpTimer > 0 ? `RESEND IN ${otpTimer}S` : 'RESEND CODE'}
                    </button>
                  </div>
                </form>
              )}

              {currentState === 'Sign Up' && !otpSent && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">Full Name</label>
                    <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border-b-2 bg-transparent ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="Your full name"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-2 font-light">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">Email Address</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border-b-2 bg-transparent ${errors.email ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-2 font-light">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-700 mb-3 font-light">Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-3.5 border-b-2 bg-transparent ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-black'} focus:outline-none transition-colors font-light text-base`}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-2 font-light">{errors.password}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="w-full mt-8 py-4 bg-black text-white font-light tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-lg"
                  >
                    {otpLoading ? 'SENDING...' : 'CONTINUE'}
                  </button>

                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-light">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="flex justify-center mt-4">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google sign-in failed. Please try again.')}
                      text="signup_with"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                    />
                  </div>
                </div>
              )}

              {currentState === 'Sign Up' && otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div>
                    <p className="text-sm text-gray-600 font-light text-center mb-8">
                      We sent a verification code to<br />
                      <span className="font-normal text-black">{email}</span>
                    </p>
                    <div className="flex gap-3 justify-center mb-2">
                      {Array(6).fill(0).map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          value={otpDigits[i] || ''}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 text-center text-lg font-light border-b-2 border-gray-300 focus:border-black focus:outline-none transition-all bg-transparent"
                        />
                      ))}
                    </div>
                  </div>
                  {otpError && (
                    <div className="bg-red-50 border-l-2 border-red-500 p-3">
                      <p className="text-red-600 text-sm font-light">{otpError}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-black text-white font-light tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-lg"
                  >
                    {isLoading ? 'VERIFYING...' : 'VERIFY & CREATE ACCOUNT'}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); setOtpDigits(Array(6).fill('')); setOtpError(''); }}
                      className="text-sm text-gray-600 hover:text-black transition-colors font-light tracking-wide"
                    >
                      BACK
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || otpTimer > 0}
                      className="text-sm text-gray-600 hover:text-black transition-colors font-light tracking-wide"
                    >
                      {otpTimer > 0 ? `RESEND IN ${otpTimer}S` : 'RESEND CODE'}
                    </button>
                  </div>
                </form>
              )}

              {!isForgotPassword && (
                <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 font-light">
                    {currentState === 'Login' ? (
                      <>
                        New to Aharyas?{' '}
                        <button
                          type="button"
                          onClick={() => { setCurrentState('Sign Up'); resetForm(); }}
                          className="text-black font-normal hover:underline transition-all tracking-wide"
                        >
                          Create an account
                        </button>
                      </>
                    ) : (
                      <>
                        Already part of our community?{' '}
                        <button
                          type="button"
                          onClick={() => { setCurrentState('Login'); resetForm(); }}
                          className="text-black font-normal hover:underline transition-all tracking-wide"
                        >
                          Sign In
                        </button>
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="mt-8 text-center">
                <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-black uppercase tracking-[0.2em] font-light transition-all">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
