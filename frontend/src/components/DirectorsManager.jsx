import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Trash2, X, Users, Mail, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const DirectorsManager = ({ subsidiaryId }) => {
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (subsidiaryId) fetchDirectors();
  }, [subsidiaryId]);

  const fetchDirectors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subsidiaries/${subsidiaryId}/directors`);
      setDirectors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/users/search?q=${searchQuery}`);
        setSearchResults(res.data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddDirector = async (user) => {
    try {
      // Check if user is already a director
      const isAlreadyDirector = directors.some(d => d.user_id === user.id);
      if (isAlreadyDirector) {
        alert(`${user.full_name} is already added as a director.`);
        return;
      }

      await axios.post(`${API_BASE}/subsidiaries/${subsidiaryId}/directors`, {
        user_id: user.id
      });
      setSearchQuery('');
      setShowDropdown(false);
      fetchDirectors();
    } catch (err) {
      console.error(err);
      alert('Error adding director');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_BASE}/subsidiaries/directors/${deleteTarget}`);
      setDeleteTarget(null);
      fetchDirectors();
    } catch (err) {
      console.error(err);
      alert('Error deleting director');
    }
  };

  const getDirectorImageUrl = (dir) => {
    if (dir.user_id) {
      if (dir.is_synced) {
        return `http://localhost:5000/api/users/office365/photo/${dir.email}`;
      }
      if (dir.user_profile_pic) {
        if (dir.user_profile_pic.startsWith('http://') || dir.user_profile_pic.startsWith('https://')) {
          return dir.user_profile_pic;
        }
        return `http://localhost:5000/uploads/${dir.user_profile_pic}`;
      }
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(dir.user_name || dir.name)}&background=f1f5f9&color=475569&bold=true`;
    } else {
      if (dir.image_url) {
        if (dir.image_url.startsWith('http://') || dir.image_url.startsWith('https://')) {
          return dir.image_url;
        }
        return `http://localhost:5000/uploads/${dir.image_url}`;
      }
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(dir.name)}&background=f1f5f9&color=475569&bold=true`;
    }
  };

  const getSearchUserImageUrl = (user) => {
    if (user.is_synced) {
      return `http://localhost:5000/api/users/office365/photo/${user.email}`;
    }
    if (user.profile_pic) {
      if (user.profile_pic.startsWith('http://') || user.profile_pic.startsWith('https://')) {
        return user.profile_pic;
      }
      return `http://localhost:5000/uploads/${user.profile_pic}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=f1f5f9&color=475569&bold=true`;
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-100">
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-red" />
          Board of Directors
        </h3>
        
        {/* Dynamic Search Bar */}
        <div ref={searchContainerRef} className="relative w-full">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search user name or email to add director..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-red/20 focus:border-slate-200 transition-all font-medium text-sm placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl z-[70] max-h-64 overflow-y-auto custom-scrollbar">
              {searchLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
                  Searching users...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-4 text-center text-slate-400 text-sm font-medium">
                  No users found
                </div>
              ) : (
                searchResults.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => handleAddDirector(user)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-b-0"
                  >
                    <img 
                      src={getSearchUserImageUrl(user)} 
                      alt={user.full_name} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=f1f5f9&color=475569&bold=true`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-xs truncate leading-tight">{user.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5 flex items-center gap-1.5">
                        <span>{user.email}</span>
                        {user.job_title && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="text-slate-450">{user.job_title}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
          Loading directors...
        </div>
      ) : directors.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[20px] p-10 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-bold text-sm">No directors assigned to this subsidiary.</p>
          <p className="text-xs text-slate-400 mt-1">Use the search bar above to find and add directors from the company directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {directors.map(dir => {
            const finalName = dir.user_id ? dir.user_name : dir.name;
            const finalTitle = dir.user_id ? dir.user_title : dir.title;
            const email = dir.user_id ? dir.email : '';
            return (
              <div 
                key={dir.id} 
                className="bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-white rounded-[20px] p-4 flex gap-4 relative group transition-all"
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button" 
                    onClick={() => setDeleteTarget(dir.id)} 
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Director"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-14 h-14 bg-white rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/60 shadow-sm relative">
                  <img 
                    src={getDirectorImageUrl(dir)} 
                    alt={finalName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=f1f5f9&color=475569&bold=true`;
                    }}
                  />
                </div>
                
                <div className="min-w-0 pr-8 flex-1 flex flex-col justify-center">
                  <h4 className="font-black text-slate-800 text-sm truncate leading-snug">{finalName}</h4>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-red truncate mt-0.5">{finalTitle || 'Director'}</p>
                  {email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Director Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-2">Remove Director?</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">Are you sure you want to remove this director from the subsidiary?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="button" onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DirectorsManager;
