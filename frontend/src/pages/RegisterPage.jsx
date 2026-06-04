import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ShieldCheck, Lock, User, ArrowRight, Mail, Hash, Calendar, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    nic_number: '',
    employee_no: '',
    date_of_birth: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register-super-admin', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        nic_number: formData.nic_number,
        employee_no: formData.employee_no,
        date_of_birth: formData.date_of_birth
      });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-0 lg:p-6 font-sans">
      <div className="w-full h-full lg:h-auto lg:max-w-[1200px] bg-white lg:rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-100">

        {/* Left: Branding Panel */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between">
          
          {/* Full cover background image */}
          <img
            src="/register.png"
            alt="GS Super Admin"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Multi-layer overlay: bottom-to-top gradient + red tint */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-[#C8102E]/30" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E]/20 via-transparent to-transparent" />

          {/* Top: Logo block */}
          <div className="relative z-10 p-10">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl">
              <div className="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center shadow-lg">
                <img src="/api_logo.png" alt="GS" className="w-5 h-5 object-contain brightness-0 invert" />
              </div>
              <div>
                <p className="text-white font-black text-sm tracking-tight leading-none">GS Intranet</p>
                <p className="text-white/50 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Bottom: Main content */}
          <div className="relative z-10 p-10 pb-12">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red/80 backdrop-blur-sm border border-red-400/30 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Super Admin Setup</span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight mb-3">
              System<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-white">Administrator</span><br />
              Registration
            </h2>
            <p className="text-white/55 text-sm font-medium leading-relaxed mb-8 max-w-[280px]">
              This portal is exclusively for setting up the first Super Administrator account of the GS Intranet platform.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                { icon: '⚡', text: 'Full platform access & control' },
                { icon: '👥', text: 'Create sub-admins across subsidiaries' },
                { icon: '🏢', text: 'Manage all employees & departments' },
                { icon: '⚙️', text: 'Configure system-wide settings' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm shrink-0 group-hover:bg-white/15 transition-all">
                    {item.icon}
                  </div>
                  <p className="text-white/75 text-sm font-semibold group-hover:text-white/90 transition-colors">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Bottom trust line */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white/40 text-[11px] font-semibold">Secured · George Steuart & Co. 2026</p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 bg-white p-8 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-[480px] mx-auto w-full">

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center">
                <img src="/api_logo.png" alt="GS" className="w-6 h-6 object-contain brightness-0 invert" />
              </div>
              <span className="font-black text-slate-900 text-lg">GS Intranet</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-red/8 border border-brand-red/15 rounded-full mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
                <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">Super Admin Setup</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create Super Admin</h1>
              <p className="text-slate-400 font-medium text-sm">
                Register the primary system administrator account. This account will have full access to manage the entire GS Intranet.
              </p>
            </div>

            {/* Success State */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Super Admin Created!</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    Your administrator account has been set up successfully. You can now sign in and begin configuring the platform.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-red/20 hover:bg-brand-red-dark active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Sign In to Portal <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <>
                {/* Error Box */}
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

                <form onSubmit={handleRegister} className="space-y-5">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                      <input
                        required type="text" placeholder="Sarva Ameresekere"
                        value={formData.full_name}
                        onChange={e => handleChange('full_name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                      <input
                        required type="email" placeholder="admin@georgesteuart.lk"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  {/* Employee ID & NIC — 2 col */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                        <input
                          required type="text" placeholder="GS-001"
                          value={formData.employee_no}
                          onChange={e => handleChange('employee_no', e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIC Number</label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                        <input
                          required type="text" placeholder="199012345678"
                          value={formData.nic_number}
                          onChange={e => handleChange('nic_number', e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                      <input
                        required type="date"
                        value={formData.date_of_birth}
                        onChange={e => handleChange('date_of_birth', e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                      <input
                        required type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={e => handleChange('password', e.target.value)}
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                      <input
                        required type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                        value={formData.confirm_password}
                        onChange={e => handleChange('confirm_password', e.target.value)}
                        className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-red outline-none transition-all font-bold text-slate-800 text-sm"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                      This account will be granted <strong>Super Admin</strong> privileges. After setup, use the Admin panel to create sub-admins and employee accounts.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-red/20 hover:bg-brand-red-dark active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 group"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Super Admin Account'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Login link */}
                  <div className="text-center pt-2">
                    <p className="text-sm font-bold text-slate-400">
                      Already have an account?{' '}
                      <Link to="/login" className="text-brand-red hover:underline font-black uppercase tracking-widest text-xs">Sign In</Link>
                    </p>
                  </div>
                </form>
              </>
            )}

            <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-300 text-[9px] font-black uppercase tracking-widest">
              © George Steuart & Co. 2026 · Super Admin Portal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
