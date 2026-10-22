import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Lock, User, ArrowRight, Eye, EyeOff, Globe, Zap, Users, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Microsoft OAuth authorize URL construction and redirect
  const handleMicrosoftLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/microsoft';
  };

  // Check for OAuth credentials in query params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userJson = urlParams.get('user');
    const error = urlParams.get('error');
    
    if (error) {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(decodeURIComponent(error));
    }
    
    if (token && userJson) {
      window.history.replaceState({}, document.title, window.location.pathname);
      try {
        const userObj = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem('gs_token', token);
        login(userObj);
        navigate('/');
      } catch (err) {
        console.error('Failed to parse user details:', err);
        alert('Authentication failed to parse user payload.');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const { user, token } = response.data;
      localStorage.setItem('gs_token', token);
      login(user);
      
      // Handle password change requirement
      if (user.needs_password_change) {
        navigate('/force-password-change');
      } else {
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans">
      
      {/* Main Container */}
      <div className="w-full max-w-[840px] bg-white rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden my-auto max-h-[94vh]">
        
        {/* Left Side: Dynamic Branding Panel */}
        <div className="hidden lg:block lg:w-[44%] relative overflow-hidden bg-brand-red min-h-[420px]">
          <img 
            src="/login page.png" 
            alt="GS Branding" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Authentication Form */}
        <div className="flex-1 bg-white p-5 sm:p-8 lg:p-7 xl:p-8 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-[360px] mx-auto w-full">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-4 sm:mb-5">
              <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg p-2.5 mb-2.5">
                <img src="/api_logo.png" alt="API" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Sign in</h1>
              {authStatusMessage ? (
                <p className="text-brand-red font-bold text-xs animate-pulse">{authStatusMessage}</p>
              ) : (
                <p className="text-slate-400 font-medium text-xs">Enter your credentials to access your account</p>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-slate-700 font-medium text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-slate-700 font-medium text-xs sm:text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <div className="relative w-4 h-4">
                      <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="w-4 h-4 border-2 border-slate-200 rounded group-hover:border-brand-red peer-checked:bg-brand-red peer-checked:border-brand-red transition-all"></div>
                      <Check className="absolute inset-0 m-auto w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                   </div>
                   <span className="text-xs font-semibold text-slate-500 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-brand-red hover:underline">Forgot password?</Link>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-red text-white py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight shadow-md shadow-brand-red/20 hover:bg-brand-red-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-3.5 sm:my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[11px]"><span className="px-3 bg-white text-slate-400 font-medium">or continue with</span></div>
            </div>

            {/* Social Logins */}
            <div className="flex flex-col gap-2">
              <button 
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition-all group disabled:opacity-50 cursor-pointer"
              >
                <img src="https://www.svgrepo.com/show/303416/microsoft-icon.svg" alt="Microsoft" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {isLoading && authStatusMessage ? 'Connecting...' : 'Sign in with Microsoft'}
              </button>
            </div>

            {/* Sign up Link */}
            <p className="mt-3.5 sm:mt-4 text-center text-slate-500 font-medium text-xs">
              Don't have an account? <Link to="/register" className="text-brand-red font-bold hover:underline ml-1">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
