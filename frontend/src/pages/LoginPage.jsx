import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userJson = params.get('user');
    const errParam = params.get('error');

    if (errParam === 'not_registered') {
      setError('Your Microsoft account is not registered on this system. Please contact your IT administrator.');
    } else if (errParam === 'auth_failed') {
      setError('Microsoft authentication failed. Please try again.');
    } else if (errParam === 'no_email') {
      setError('Unable to retrieve email from your Microsoft profile.');
    } else if (errParam === 'server_error') {
      setError('An internal server error occurred during authentication.');
    } else if (errParam) {
      setError('Authentication failed. Please check your credentials and try again.');
    }

    if (token && userJson) {
      setIsLoading(true);
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem('gs_token', token);
        login(parsedUser);
        
        // Handle password change requirement or redirect
        if (parsedUser.needs_password_change) {
          navigate('/force-password-change');
        } else {
          navigate('/');
        }
      } catch (e) {
        console.error('Failed to parse user details from callback', e);
        setError('Login failed during authentication callback.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [location, login, navigate]);

  const handleMicrosoftSignIn = () => {
    setIsLoading(true);
    setError(null);
    window.location.href = 'http://localhost:5000/api/auth/microsoft';
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-0 lg:p-6 font-sans relative overflow-hidden">
      
      {/* Background Animated Waves - Top */}
      <div className="absolute top-0 left-0 w-full rotate-180 z-0 select-none pointer-events-none opacity-40">
        <svg className="w-full h-[120px] min-h-[90px]" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1300,60 1400,60 L1400,120 L0,120 Z" fill="rgba(200, 16, 46, 0.05)" className="wave-layer-1" />
          <path d="M0,60 C200,30 400,90 600,40 C800,90 1000,30 1200,60 L1200,120 L0,120 Z" fill="rgba(245, 158, 11, 0.02)" className="wave-layer-2" />
          <path d="M0,80 C150,50 350,110 500,80 C650,50 850,110 1000,80 C1150,50 1300,80 1400,80 L1400,120 L0,120 Z" fill="rgba(200, 16, 46, 0.02)" className="wave-layer-3" />
        </svg>
      </div>

      {/* Background Animated Waves - Bottom */}
      <div className="absolute bottom-0 left-0 w-full z-0 select-none pointer-events-none opacity-40">
        <svg className="w-full h-[120px] min-h-[90px]" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1300,60 1400,60 L1400,120 L0,120 Z" fill="rgba(200, 16, 46, 0.05)" className="wave-layer-1" />
          <path d="M0,60 C200,30 400,90 600,40 C800,90 1000,30 1200,60 L1200,120 L0,120 Z" fill="rgba(245, 158, 11, 0.02)" className="wave-layer-2" />
          <path d="M0,80 C150,50 350,110 500,80 C650,50 850,110 1000,80 C1150,50 1300,80 1400,80 L1400,120 L0,120 Z" fill="rgba(200, 16, 46, 0.02)" className="wave-layer-3" />
        </svg>
      </div>
      
      {/* Main Container */}
      <div className="w-full h-full lg:h-auto lg:max-w-[1000px] bg-white lg:rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative z-10">
        
        {/* Left Side: Dynamic Branding Panel */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-brand-red min-h-[500px]">
          <img 
            src="/login page.png" 
            alt="GS Branding" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Authentication Panel */}
        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-[360px] mx-auto w-full">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center shadow-xl p-3 mb-6 border border-slate-100">
                <img src="/api_logo.png" alt="George Steuart" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign in</h1>
              <p className="text-slate-400 font-medium text-sm text-center">Use your George Steuart corporate account</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 mb-6 bg-red-50 text-red-800 rounded-xl border border-red-100 text-xs font-semibold leading-relaxed"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Microsoft SSO Action Button */}
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleMicrosoftSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 border border-slate-200 hover:border-brand-red/30 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] transition-all group disabled:opacity-60 cursor-pointer sso-button-shimmer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-brand-red" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
                      <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
                      <path d="M0 12H11V23H0V12Z" fill="#01A6F0"/>
                      <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
                    </svg>
                    <span>Sign in with Microsoft</span>
                  </>
                )}
              </button>
            </div>

            {/* Single Sign-On Info */}
            <p className="mt-8 text-center text-slate-400 font-semibold text-[10px] uppercase tracking-wider leading-relaxed">
              Secure single sign-on powered by Microsoft Azure Active Directory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
