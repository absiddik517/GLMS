import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, HelpCircle, Eye, EyeOff, Stamp, Landmark, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  onSuccess: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  
  // View states: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা');
  const [officeName, setOfficeName] = useState('উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়');
  
  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('প্রদত্ত ইমেইল অথবা পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('ইমেইল/পাসওয়ার্ড সাইন-ইন পদ্ধতিটি আপনার ফায়ারবেস কনসোলে বন্ধ করা রয়েছে। আপনি নিচের "গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন" বোতাম ব্যবহার করে অবিলম্বে লগইন করতে পারবেন।');
      } else {
        setErrorMsg('লগইন ব্যর্থ হয়েছে। আপনার নেটওয়ার্ক সংযোগ যাচাই করে পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !name || !officeName) {
      setErrorMsg('অনুগ্রহ করে সকল তারকা চিহ্নিত (*) ঘরগুলো পূরণ করুন।');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('নিরাপত্তার স্বার্থে পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, name, designation, officeName);
      setSuccessMsg('কার্যালয় অ্যাকাউন্ট সফলভাবে গঠিত হয়েছে! ড্যাশবোর্ড লোড করা হচ্ছে...');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে। অন্য ইমেইল ব্যবহার করুন।');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('ইমেইল/পাসওয়ার্ড সাইন-ইন পদ্ধতিটি আপনার ফায়ারবেস কনসোলে বন্ধ করা রয়েছে। আপনি নিচের "গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন" বোতাম ব্যবহার করে অবিলম্বে লগইন করতে পারবেন।');
      } else {
        setErrorMsg('অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ডাটা ঠিক করুন।');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      setSuccessMsg('গুগল অ্যাকাউন্ট দিয়ে সফলভাবে লগইন হয়েছে!');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('গুগল সাইন-ইন করতে ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('পাসওয়ার্ড লিংক পাঠাতে আপনার ইমেইলটি দিন।');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccessMsg('পাসওয়ার্ড পরিবর্তনের লিংকটি আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে চেক করুন।');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('পাসওয়ার্ড জটিলতা নিরাময়কারী লিংক পাঠাতে ত্রুটি হয়েছে। ইমেইলটি ঠিক আছে কি না দেখুন।');
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-seed instant Demo Trigger for fast review
  const handleQuickDemoAccess = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    
    const demoEmail = 'demoofficer@glms.gov.bd';
    const demoPassword = 'demopassword123';
    
    try {
      // Try logs in
      await login(demoEmail, demoPassword);
      onSuccess();
    } catch (err: any) {
      // If none found, auto registers instantly!
      try {
        await register(
          demoEmail, 
          demoPassword, 
          'জনাব আবু সিদ্দীক', 
          'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা',
          'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়, হালুয়াঘাট, ময়মনসিংহ'
        );
        onSuccess();
      } catch (innerErr) {
        console.error("Demo registration crash:", innerErr);
        setErrorMsg('ডেমো লগইন করতে ক্রাশ হয়েছে। দয়া করে স্ট্যান্ডার্ড সাইন-আপ ব্যবহার করুন।');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
      
      {/* CAPITOL BANNER / HEADLINE */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-150 overflow-hidden text-gray-800 transition-all duration-300">
        
        {/* TOP DECORATIVE GOVT BARS */}
        <div className="h-2 bg-[#006A4E]"></div>
        <div className="h-1 bg-[#F42A41]"></div>

        <div className="p-8 flex flex-col items-center">
          {/* Circular National crest simulation */}
          <div className="w-16 h-16 rounded-full border border-gray-200 bg-emerald-50 text-[#006A4E] flex items-center justify-center p-2 mb-4 font-bold select-none shadow-xs">
            <Landmark size={32} />
          </div>

          <h1 className="text-lg font-bold text-center text-[#006A4E] leading-snug">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
          </h1>
          <h2 className="text-sm font-bold text-gray-700 text-center mt-1 leading-snug">
            Government Letter Management System (GLMS)
          </h2>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1 border-b pb-4 w-full text-center">
            দাপ্তরিক চিঠিপত্র ও নথি ব্যবস্থাপনা সংরক্ষণাগার
          </p>

          {errorMsg && (
            <div className="w-full mt-4 p-3 bg-red-50 text-red-700 border border-red-150 rounded-lg text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="w-full mt-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg text-xs font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="w-full mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                  <Mail size={12} />
                  দাপ্তরিক ইমেইল (Government Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@office.gov.bd"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">পাসওয়ার্ড (Password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-gray-500 hover:text-[#006A4E] transition"
                >
                  পাসওয়ার্ড ভুলে গিয়েছেন?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-[#006A4E] hover:bg-opacity-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <LogIn size={14} />
                {submitting ? 'লগইন হচ্ছে...' : 'লগইন করুন (Sign In)'}
              </button>
            </form>
          )}

          {/* MODE: SIGN UP (OFFICE CREATION) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="w-full mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">অফিসার নাম (Full Name) *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: আবু সিদ্দীক"
                  className="w-full p-2 p-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">পদবি (Designation)</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা"
                  className="w-full p-2 p-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">কার্যালয়ের নাম (Office Name) *</label>
                <input
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়, হালুয়াঘাট"
                  className="w-full p-2 p-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ইমেইল ঠিকানা (Email) *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="unfeohaluaghat@gmail.com"
                  className="w-full p-2 p-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">পাসওয়ার্ড (Password - Min 6) *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পছন্দসই সিকিউর পাসওয়ার্ড"
                  className="w-full p-2 p-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-[#006A4E] hover:bg-opacity-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <UserPlus size={14} />
                {submitting ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'নতুন কার্যালয় অ্যাকাউন্ট খুলুন'}
              </button>
            </form>
          )}

          {/* MODE: FORGOT */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="w-full mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">প্রবিষ্ট ইমেইল (Registered Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@office.gov.bd"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-[#006A4E] hover:bg-opacity-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                ল্যাপ লিংকের জন্য পাঠান
              </button>
            </form>
          )}

          {/* GOOGLE SIGN-IN BUTTON */}
          <div className="w-full mt-4 border-t pt-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন (Google Sign In)
            </button>
          </div>

          {/* BACK CHORES / SWITCH LINKS */}
          <div className="mt-4 flex justify-between items-center w-full text-[10px] text-gray-500 border-t pt-4">
            {mode === 'signin' ? (
              <p>
                নতুন কার্যালয়?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#006A4E] font-bold hover:underline cursor-pointer"
                >
                  রেজিস্টার করুন
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-[#006A4E] font-bold hover:underline cursor-pointer"
              >
                লগইন বক্সে ফিরে যান
              </button>
            )}
          </div>

          {/* MASSIVE FAST PRE-SEED DEMO BLOCK */}
          <div className="w-full mt-6 border-t border-dashed pt-4 select-none">
            <button
              onClick={handleQuickDemoAccess}
              disabled={submitting}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006A4E] border border-emerald-200 hover:border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck size={14} />
              ডেমো হিসেবে প্রবেশ করুন (Demo Fast In)
            </button>
            <p className="text-[9px] text-center text-gray-400 mt-1.5 leading-snug">
              পরীক্ষামূলক ব্যবহারের জন্য ইমেইল ছাড়াই তাৎক্ষণিক ডেমো সেশনের সংযোগ পেতে উপরের বোতামটি চাপুন।
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
