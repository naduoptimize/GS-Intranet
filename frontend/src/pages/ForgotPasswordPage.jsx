import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Lock, Mail, ArrowRight, ArrowLeft, Eye, EyeOff, Hash, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1 = Verify identity, 2 = Set new password, 3 = Success
  const [email, setEmail] = useState('');
  const [employeeNo, setEmployeeNo] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-identity', {
        email,
        employee_no: employeeNo,
        nic_number: nicNumber
      });
      
      if (response.data.success) {
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please double-check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email,
        employee_no: employeeNo,
        nic_number: nicNumber,
        newPassword
      });
      setStep(3);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-0 lg:p-6 font-sans">
      
      {/* Main Container */}
      <div className="w-full h-full lg:h-auto lg:max-w-[1200px] bg-white lg:rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-100">
        
        {/* Left Side: Dynamic Branding Panel */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-brand-red">
          <img 
            src="/login page.png" 
            alt="GS Branding" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Password Reset Form / Wizard */}
        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center min-h-[600px]">
          <div className="max-w-[400px] mx-auto w-full">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-brand-red rounded-[20px] flex items-center justify-center shadow-xl p-3 mb-4">
                <img src="/api_logo.png" alt="API" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                {step === 1 && 'Reset Password'}
                {step === 2 && 'Choose Password'}
                {step === 3 && 'Success!'}
              </h1>
              <p className="text-slate-400 font-medium text-xs text-center">
                {step === 1 && 'Confirm your official employee details to recover your account.'}
                {step === 2 && 'Set a new secure password for your API Family account.'}
                {step === 3 && 'Your account security has been updated successfully.'}
              </p>
            </div>

            {/* Step Indicators */}
            {step < 3 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-brand-red' : 'w-2 bg-slate-200'}`} />
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-brand-red' : 'w-2 bg-slate-200'}`} />
              </div>
            )}

            {/* Error Message Box */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-red-700">{errorMsg}</p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyIdentity} 
                  className="space-y-5"
                >
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-red transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="janidu@gs.com"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all text-slate-800 font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* Employee ID Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-red transition-colors">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        required
                        value={employeeNo}
                        onChange={(e) => setEmployeeNo(e.target.value)}
                        placeholder="GS-001"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all text-slate-800 font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* NIC Number Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIC Number</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-red transition-colors">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        required
                        value={nicNumber}
                        onChange={(e) => setNicNumber(e.target.value)}
                        placeholder="199012345678"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all text-slate-800 font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Verify */}
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-red/20 hover:bg-brand-red-dark hover:shadow-brand-red-dark/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Identity'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="text-center pt-4">
                    <Link to="/login" className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                      <ArrowLeft className="w-3 h-3" /> Back to Sign In
                    </Link>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetPassword} 
                  className="space-y-5"
                >
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-bold">Identity Verified! Please enter your new password below.</span>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-red transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all text-slate-800 font-bold text-sm"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-red transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all text-slate-800 font-bold text-sm"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Reset */}
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-red/20 hover:bg-brand-red-dark hover:shadow-brand-red-dark/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
                  >
                    {isLoading ? 'Resetting Password...' : 'Update Password'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-between pt-4">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <Link to="/login" className="text-xs font-black text-brand-red hover:underline uppercase tracking-widest">
                      Cancel
                    </Link>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-500"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Credentials Updated</h3>
                    <p className="text-xs font-medium text-slate-400 max-w-[320px] mx-auto">
                      Your password has been successfully reset. You can now use your new security key to log back in to the API Intranet.
                    </p>
                  </div>

                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-red/20 hover:bg-brand-red-dark active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    Sign In to Portal
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-300 text-[9px] font-black uppercase tracking-widest">
               © George Steuart & Co. 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
