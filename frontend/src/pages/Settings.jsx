import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  LogOut,
  ChevronRight,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Mail,
  MessageSquare,
  FileText,
  ShieldCheck
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { user, login, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('Profile');
  const [passFormData, setPassFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  // Deactivation States
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  const handleDeactivate = async () => {
    if (deactivateConfirmText !== 'DEACTIVATE') {
      setDeactivateError("Please type 'DEACTIVATE' exactly to confirm.");
      return;
    }
    
    setDeactivateSubmitting(true);
    setDeactivateError('');
    try {
      await axios.delete(`http://localhost:5000/api/users/${user.id}`);
      setShowDeactivateModal(false);
      logout();
    } catch (err) {
      console.error(err);
      setDeactivateError(err.response?.data?.message || 'Failed to deactivate account. Please try again.');
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  // Appearance Theme State
  const [appearanceTheme, setAppearanceTheme] = useState(() => {
    const saved = localStorage.getItem('gs-theme') || 'Light';
    return saved === 'Auto' ? 'Light' : saved;
  });

  // Theme Presets Definition
  const themePresets = {
    'George Steuart Heritage': { name: 'George Steuart Heritage', primary: '#C41230', dark: '#9E0E27', light: '#FFF0F3', sidebarDark: '#C41230', bg: 'linear-gradient(135deg, #9E0E27 0%, #C41230 62%, #C7A35A 100%)', desc: 'George Steuart crimson, antique gold and warm ivory corporate identity.' }
  };

  const [activePreset, setActivePreset] = useState(() => {
    return 'George Steuart Heritage';
  });

  // Sync theme changes reactively across other sections of the viewport
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('gs-theme') || 'Light';
      setAppearanceTheme(saved === 'Auto' ? 'Light' : saved);
      
      const savedPreset = 'George Steuart Heritage';
      setActivePreset(savedPreset);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (appearanceTheme === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gs-theme', appearanceTheme);
  }, [appearanceTheme]);

  // Synchronize dynamic brand theme presets to :root
  useEffect(() => {
    const preset = themePresets[activePreset] || themePresets['George Steuart Heritage'];
    const root = document.documentElement;
    root.style.setProperty('--color-brand-red', preset.primary);
    root.style.setProperty('--color-brand-red-dark', preset.dark);
    root.style.setProperty('--color-brand-red-light', preset.light);
    root.style.setProperty('--color-sidebar-dark', preset.sidebarDark);
    localStorage.setItem('gs-theme-preset', activePreset);
    
    // Alert other pages/components to refresh styling immediately
    window.dispatchEvent(new Event('storage'));
  }, [activePreset]);

  // State for user profile details
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    job_title: '',
    phone: '',
    bio: '',
    profile_pic: ''
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Notifications Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    emailAnnouncements: true,
    pushMessages: true,
    documentAlerts: false,
    securityAlerts: true
  });
  const [notifPrefMessage, setNotifPrefMessage] = useState({ text: '' });

  // File Upload State and Ref
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Load profile details dynamically from the database
  useEffect(() => {
    if (user?.id) {
      axios.get(`http://localhost:5000/api/users/${user.id}`)
        .then(res => {
          setProfileForm({
            full_name: res.data.full_name || '',
            email: res.data.email || '',
            job_title: res.data.job_title || 'Employee',
            phone: res.data.phone || '',
            bio: res.data.bio || '',
            profile_pic: res.data.profile_pic || ''
          });
        })
        .catch(err => console.error("Failed to load profile details", err));
    }
  }, [user?.id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const res = await axios.post('http://localhost:5000/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileForm(prev => ({ ...prev, profile_pic: res.data.imageUrl }));
      setProfileMessage({ type: 'success', text: 'Image uploaded successfully! Remember to click "Save Changes" to lock it in.' });
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const response = await axios.put(`http://localhost:5000/api/users/profile/${user.id}`, profileForm);
      
      // Update local authentication session context to sync headers, navs, and sidebar instantly
      login({
        ...user,
        full_name: response.data.user.full_name,
        email: response.data.user.email,
        profile_pic: response.data.user.profile_pic
      });

      setProfileMessage({ type: 'success', text: 'Profile details saved successfully!' });
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save changes' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const settingsGroups = [
    { name: 'Profile', icon: User, desc: 'Manage your personal details and bio.' },
    { name: 'Security', icon: Lock, desc: 'Update your password and 2FA settings.' },
    { name: 'Notifications', icon: Bell, desc: 'Configure how you receive updates.' },
    { name: 'Appearance', icon: Palette, desc: 'Customize the intranet theme and layout.' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Hidden File Input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      <div>
        <h2 className="text-3xl font-bold text-slate-800">Account Settings</h2>
        <p className="text-slate-500 mt-1 font-medium">Manage your profile, preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 grid-flow-row lg:grid-cols-4 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
           {settingsGroups.map((group, i) => (
             <button 
               key={i} 
               onClick={() => setActiveTab(group.name)}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left group ${activeTab === group.name ? 'bg-brand-red text-white shadow-xl shadow-brand-red/20' : 'hover:bg-white text-slate-500 hover:text-brand-red'}`}
             >
                <group.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <div className="flex-1 min-w-0">
                   <p className="font-bold text-sm truncate">{group.name}</p>
                </div>
                <ChevronRight className={`w-4 h-4 opacity-50 ${activeTab === group.name ? 'text-white' : ''}`} />
             </button>
           ))}
           <div className="pt-8">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-brand-red hover:bg-brand-red/5 transition-all font-bold group"
              >
                 <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 <span>Sign Out</span>
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
            {activeTab === 'Profile' && (
              <form onSubmit={handleSaveProfile} className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-8 bg-slate-50/30">
                   <div className="relative group mx-auto md:mx-0 shrink-0">
                      <div 
                         onClick={() => !uploading && fileInputRef.current?.click()}
                         className="w-32 h-32 rounded-[32px] bg-slate-100 overflow-hidden border-4 border-white shadow-2xl relative cursor-pointer group"
                      >
                         {uploading ? (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                           </div>
                         ) : (
                           <>
                             <img 
                                src={profileForm.profile_pic || `https://ui-avatars.com/api/?name=${profileForm.full_name || 'User'}&background=C8102E&color=fff&size=200`} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                             />
                             <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                             </div>
                           </>
                         )}
                      </div>
                      <button 
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-xl text-brand-red border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                         <Camera className="w-4 h-4" />
                      </button>
                   </div>
                   <div className="text-center md:text-left flex-1">
                      <h3 className="text-2xl font-black text-slate-800">{profileForm.full_name || 'Guest User'}</h3>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">{user?.role?.replace('_', ' ') || 'Employee'} • {user?.subsidiary_name || 'George Steuart Group'}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                         <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#C41230] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#9E0E27] transition-all shadow-lg shadow-brand-red/10"
                         >
                           Upload New Photo
                         </button>
                         {profileForm.profile_pic && (
                           <button 
                              type="button"
                              onClick={() => setProfileForm({ ...profileForm, profile_pic: '' })}
                              className="bg-slate-150 text-slate-500 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
                           >
                             Reset Avatar
                           </button>
                         )}
                      </div>
                   </div>
                </div>

                <div className="p-8 space-y-8">
                   {profileMessage.text && (
                     <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${profileMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-brand-red/10 text-brand-red'}`}>
                        {profileMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {profileMessage.text}
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                         <input 
                           type="text" 
                           value={profileForm.full_name}
                           onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none font-bold text-slate-700 text-sm"
                           required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                         <input 
                           type="email" 
                           value={profileForm.email}
                           onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none font-bold text-slate-700 text-sm"
                           required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Job Title</label>
                         <input 
                           type="text" 
                           value={profileForm.job_title}
                           onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none font-bold text-slate-700 text-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                         <input 
                           type="text" 
                           value={profileForm.phone}
                           onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none font-bold text-slate-700 text-sm"
                           placeholder="+94 77 123 4567"
                         />
                      </div>
                   </div>
  
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Bio / Personal Statement</label>
                      <textarea 
                        rows="4"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none resize-none font-bold text-slate-700 text-sm"
                        placeholder="Tell us about yourself..."
                      ></textarea>
                   </div>
  
                   <div className="flex justify-end pt-4">
                      <button 
                         type="submit"
                         disabled={profileSubmitting}
                         className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-10 py-4.5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                      >
                         {profileSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                         Save Changes
                      </button>
                   </div>
                </div>
              </form>
            )}

            {activeTab === 'Security' && (
              <div className="glass-card p-8 space-y-8">
                 <div className="border-b border-slate-100 pb-6">
                    <h3 className="text-xl font-bold">Change Password</h3>
                    <p className="text-sm text-slate-500 mt-1">Update your account password to stay secure.</p>
                 </div>

                 {passMessage.text && (
                   <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${passMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-brand-red/10 text-brand-red'}`}>
                      {passMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      {passMessage.text}
                   </div>
                 )}

                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (passFormData.newPassword !== passFormData.confirmPassword) {
                       setPassMessage({ type: 'error', text: 'New passwords do not match' });
                       return;
                    }
                    setPassSubmitting(true);
                    try {
                      await axios.put('http://localhost:5000/api/auth/change-password', {
                        userId: user.id,
                        currentPassword: passFormData.currentPassword,
                        newPassword: passFormData.newPassword
                      });
                      setPassMessage({ type: 'success', text: 'Password updated successfully!' });
                      setPassFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    } catch (err) {
                      setPassMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
                    } finally {
                      setPassSubmitting(false);
                    }
                 }} className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                       <input 
                         required
                         type="password" 
                         value={passFormData.currentPassword}
                         onChange={(e) => setPassFormData({ ...passFormData, currentPassword: e.target.value })}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none"
                         placeholder="••••••••"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                       <input 
                         required
                         type="password" 
                         value={passFormData.newPassword}
                         onChange={(e) => setPassFormData({ ...passFormData, newPassword: e.target.value })}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none"
                         placeholder="••••••••"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                       <input 
                         required
                         type="password" 
                         value={passFormData.confirmPassword}
                         onChange={(e) => setPassFormData({ ...passFormData, confirmPassword: e.target.value })}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all outline-none"
                         placeholder="••••••••"
                       />
                    </div>
                    <button 
                      disabled={passSubmitting}
                      type="submit"
                      className="bg-brand-red text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-brand-red/10 flex items-center gap-2"
                    >
                       {passSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                       Update Password
                    </button>
                 </form>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="space-y-6">
                 {notifPrefMessage.text && (
                   <div className="p-4 rounded-2xl flex items-center gap-3 font-bold text-sm bg-green-50 text-green-700 border border-green-200 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 animate-pulse shrink-0" />
                      {notifPrefMessage.text}
                   </div>
                 )}

                 <div className="glass-card p-8 space-y-8">
                    <div className="border-b border-slate-100 pb-6">
                       <h3 className="text-xl font-bold">Notification Preferences</h3>
                       <p className="text-sm text-slate-500 mt-1">Configure how you receive announcements, alerts, and direct messages.</p>
                    </div>

                    <div className="space-y-6">
                    {[
                      { 
                        key: 'emailAnnouncements',
                        title: 'Email Announcements', 
                        desc: 'Receive important company announcements and town hall notices directly in your corporate inbox.', 
                        icon: Mail 
                      },
                      { 
                        key: 'pushMessages',
                        title: 'Real-Time Direct Messages', 
                        desc: 'Enable instant browser push alerts for new chat messages from team members.', 
                        icon: MessageSquare 
                      },
                      { 
                        key: 'documentAlerts',
                        title: 'New Document Alerts', 
                        desc: 'Get notified when new official documents, policies, or templates are published.', 
                        icon: FileText 
                      },
                      { 
                        key: 'securityAlerts',
                        title: 'Security & Access Logs', 
                        desc: 'Receive immediate alerts upon password changes, new device logins, or security sync completions.', 
                        icon: ShieldCheck 
                      }
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-colors">
                        <div className="flex gap-4 items-start min-w-0 pr-4">
                          <div className="w-10 h-10 rounded-xl bg-[#C41230]/5 text-[#C41230] flex items-center justify-center shrink-0">
                            <pref.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{pref.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-normal">{pref.desc}</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNotifPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 outline-none ${
                            notifPrefs[pref.key] ? 'bg-brand-red' : 'bg-slate-200'
                          }`}
                        >
                          <span 
                            className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${
                              notifPrefs[pref.key] ? 'translate-x-6' : ''
                            }`} 
                          />
                        </button>
                      </div>
                    ))}
                 </div>

                 <div className="flex justify-end pt-4">
                    <button 
                       onClick={() => {
                         setNotifPrefMessage({ text: 'Notification preferences saved successfully!' });
                         setTimeout(() => setNotifPrefMessage({ text: '' }), 4000);
                       }}
                       className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-10 py-4.5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                    >
                       <Save className="w-4 h-4" />
                       Save Preferences
                     </button>
                  </div>
               </div>
             </div>
            )}

            {activeTab === 'Appearance' && (
              <div className="space-y-10 animate-fade-in">
                {/* Visual Customization Header */}
                <div className="glass-card p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-1">
                    <span className="text-[9px] font-black text-amber-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">Branding Engine</span>
                    <h3 className="text-2xl font-black tracking-tight mt-2">Subsidiary Branding playground</h3>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-xl">
                      Customize your workspace environment. Selecting a branding preset dynamically maps unique CSS custom properties across the portal.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Left Column: Preset Controllers */}
                  <div className="xl:col-span-2 space-y-8">
                    
                    {/* System Theme Mode Selection */}
                    <div className="glass-card p-6.5">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Base Theme Mode</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: 'Light', desc: 'Crisp light interface with soft shadows.' },
                          { name: 'Dark', desc: 'Sleek dark design optimized for focus.' }
                        ].map(mode => {
                          const isSelected = appearanceTheme === mode.name;
                          return (
                            <button
                              key={mode.name}
                              type="button"
                              onClick={() => setAppearanceTheme(mode.name)}
                              className={`p-5 rounded-2xl border text-left transition-all duration-300 relative group cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#C41230]/5 border-[#C41230]/30 text-slate-850 shadow-md'
                                  : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-800">{mode.name} Mode</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-[#C41230] bg-[#C41230]' : 'border-slate-300'
                                }`}>
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 font-bold leading-normal">{mode.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Brand Preset Color Palette Grid */}
                    <div className="glass-card p-6.5 space-y-6">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Subsidiary Presets</h4>
                      
                      <div className="space-y-3">
                        {Object.values(themePresets).map(preset => {
                          const isSelected = activePreset === preset.name;
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setActivePreset(preset.name)}
                              className={`w-full flex items-center justify-between p-4.5 rounded-2xl text-left border transition-all duration-300 group cursor-pointer ${
                                isSelected 
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10 scale-101' 
                                  : 'bg-white border-slate-100/80 hover:bg-slate-50/50 hover:border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-4 min-w-0 pr-4">
                                {/* Theme Gradient Chip */}
                                <div 
                                  className="w-10 h-10 rounded-xl shrink-0 border border-white/10 shadow-md"
                                  style={{ background: preset.bg }}
                                />
                                <div className="min-w-0">
                                  <h5 className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-850'}`}>
                                    {preset.name}
                                  </h5>
                                  <p className={`text-[10px] truncate mt-1 leading-normal ${isSelected ? 'text-slate-400' : 'text-slate-450'}`}>
                                    {preset.desc}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isSelected ? 'bg-white/15 text-amber-400' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {isSelected ? 'Active' : 'Select'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Portal live preview block */}
                  <div className="space-y-6">
                    <div className="glass-card p-6.5 space-y-6 flex flex-col justify-between h-full bg-slate-50/50 border-slate-100">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Live Theme Preview</h4>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Observe how colors and interactive highlights dynamically update across the interface coordinates.
                        </p>
                      </div>

                      {/* Mockup Dashboard Element */}
                      <div className="w-full bg-white dark:bg-[#131B2E] border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden relative select-none">
                        
                        {/* Mock header bar */}
                        <div className="bg-slate-50/80 dark:bg-slate-900/60 px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themePresets[activePreset].primary }} />
                            <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Portal Mockup</span>
                          </div>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${themePresets[activePreset].primary}15` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themePresets[activePreset].primary }} />
                          </div>
                        </div>

                        {/* Mock Dashboard Body */}
                        <div className="p-5 space-y-4">
                          
                          {/* Mini Stat Card */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                            <div className="flex items-center justify-between text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              <span>Headcount Tracker</span>
                              <span style={{ color: themePresets[activePreset].primary }}>Active</span>
                            </div>
                            <h5 className="text-base font-black text-slate-850 dark:text-white leading-none">148 Employees</h5>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Ceylon Steuart branch operations.</p>
                          </div>

                          {/* Mini Button and Badge */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest shrink-0" style={{ backgroundColor: `${themePresets[activePreset].primary}15`, color: themePresets[activePreset].primary }}>
                              Level Up
                            </div>
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: '70%', backgroundColor: themePresets[activePreset].primary }} />
                            </div>
                          </div>

                          {/* Dynamic Action Button */}
                          <button
                            type="button"
                            className="w-full py-2.5 text-[8.5px] font-black text-white uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 border border-transparent cursor-default outline-none"
                            style={{ 
                              backgroundColor: themePresets[activePreset].primary, 
                              boxShadow: `0 4px 12px ${themePresets[activePreset].primary}20` 
                            }}
                          >
                            <Save className="w-3 h-3 text-white" />
                            Save Config
                          </button>

                        </div>

                      </div>

                      {/* Applied Status */}
                      <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[9.5px] font-bold text-emerald-600">Preset Applied Globally in Real-time.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="glass-card p-8 border-red-105 bg-red-50/10">
                   <div className="flex items-center gap-6 mb-6">
                      <div className="w-14 h-14 bg-red-100 text-brand-red rounded-2xl flex items-center justify-center">
                         <Trash2 className="w-7 h-7" />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800">Deactivate Account</h4>
                         <p className="text-sm text-slate-500">Temporarily disable your intranet access. Your data will be preserved.</p>
                      </div>
                   </div>
                     <button 
                       type="button"
                       onClick={() => setShowDeactivateModal(true)}
                       className="text-brand-red font-black text-xs uppercase tracking-widest hover:underline cursor-pointer"
                     >
                        Request Deactivation
                     </button>
                  </div>
                </div>
              )}
         </div>
       </div>

       {/* ── SECURE DEACTIVATION MODAL ── */}
       <AnimatePresence>
         {showDeactivateModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                 setShowDeactivateModal(false);
                 setDeactivateConfirmText('');
                 setDeactivateError('');
               }}
               className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
             />

             {/* Modal Box */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-md bg-white dark:bg-[#0F1524] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-8 z-10 flex flex-col items-center text-center overflow-hidden"
             >
               <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-brand-red rounded-2xl flex items-center justify-center mb-6">
                 <Trash2 className="w-8 h-8" />
               </div>

               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Deactivate your account?</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                 Are you absolutely sure you want to deactivate your intranet access? This will temporarily disable your profile and log you out immediately. To reactivate, you must contact your subsidiary HR department.
               </p>

               {deactivateError && (
                 <div className="w-full mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-950/20 text-brand-red border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-bold text-left flex items-center gap-2">
                   <AlertCircle className="w-4 h-4 shrink-0" />
                   <span>{deactivateError}</span>
                 </div>
               )}

               <div className="w-full mb-6">
                 <label className="block text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                   Type 'DEACTIVATE' to confirm
                 </label>
                 <input 
                   type="text"
                   placeholder="DEACTIVATE"
                   value={deactivateConfirmText}
                   onChange={(e) => setDeactivateConfirmText(e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-850 dark:text-white text-center font-bold tracking-wider uppercase text-sm focus:outline-none focus:border-brand-red/50 transition-colors"
                 />
               </div>

               <div className="flex gap-3 w-full">
                 <button 
                   onClick={() => {
                     setShowDeactivateModal(false);
                     setDeactivateConfirmText('');
                     setDeactivateError('');
                   }}
                   className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold text-xs uppercase tracking-widest transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   disabled={deactivateConfirmText !== 'DEACTIVATE' || deactivateSubmitting}
                   onClick={handleDeactivate}
                   className={`flex-1 px-5 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all ${
                     deactivateConfirmText === 'DEACTIVATE' && !deactivateSubmitting
                     ? 'bg-brand-red hover:bg-brand-red-dark shadow-lg shadow-brand-red/20 active:scale-95 cursor-pointer'
                     : 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                   }`}
                 >
                   {deactivateSubmitting ? 'Deactivating...' : 'Confirm'}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
   );
 };

export default Settings;
