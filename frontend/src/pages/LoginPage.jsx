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
    const clientId = '5e0cce25-8863-4546-b82c-7746f232378a';
    const tenantId = 'e146d540-8607-402e-a38e-441e00d4ec27';
    const redirectUri = 'http://localhost:5000/api/auth/microsoft/callback'; // matches the configured redirect URI in Azure AD
    const scope = encodeURIComponent('openid profile email User.Read');
    const state = 'microsoft-auth-flow';
    
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}&state=${state}`;
    
    window.location.href = authUrl;
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
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-0 lg:p-6 font-sans">
      
      {/* Main Container */}
      <div className="w-full h-full lg:h-auto lg:max-w-[1200px] bg-white lg:rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Dynamic Branding Panel */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-brand-red">
          <img 
            src="/login page.png" 
            alt="GS Branding" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Authentication Form */}
        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-[400px] mx-auto w-full">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-brand-red rounded-[24px] flex items-center justify-center shadow-xl p-4 mb-6">
                <img src="/api_logo.png" alt="API" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign in</h1>
              {authStatusMessage ? (
                <p className="text-brand-red font-bold text-sm animate-pulse">{authStatusMessage}</p>
              ) : (
                <p className="text-slate-400 font-medium text-sm">Enter your credentials to access your account</p>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-slate-700 font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-red transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-slate-700 font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <div className="relative w-5 h-5">
                      <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="w-5 h-5 border-2 border-slate-200 rounded group-hover:border-brand-red peer-checked:bg-brand-red peer-checked:border-brand-red transition-all"></div>
                      <Check className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                   </div>
                   <span className="text-sm font-bold text-slate-500 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-black text-brand-red hover:underline">Forgot password?</Link>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-red text-white py-4 rounded-xl font-bold tracking-tight shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-slate-400 font-medium">or continue with</span></div>
            </div>

            {/* Social Logins */}
            <div className="flex flex-col gap-4">
              <button 
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all group disabled:opacity-50"
              >
                <img src="https://www.svgrepo.com/show/303416/microsoft-icon.svg" alt="Microsoft" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {isLoading && authStatusMessage ? 'Connecting...' : 'Sign in with Microsoft'}
              </button>
            </div>

            {/* Sign up Link */}
            <p className="mt-10 text-center text-slate-500 font-bold text-sm">
              Don't have an account? <Link to="/register" className="text-brand-red hover:underline ml-1">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
