import { useState, useEffect } from 'react';
import {
  Search,
  Newspaper,
  Calendar,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Filter,
  Building2 as BuildingIcon,
  Globe,
  Rss,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const News = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Tab switching states (corporate insights vs external RSS news)
  const [feedType, setFeedType] = useState('corporate'); 
  const [externalNews, setExternalNews] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);

  // Sync feed type from URL param on load
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('feed') === 'external') {
      setFeedType('external');
    }
  }, []);

  // Fetch corporate news & active alerts
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/news`, {
          params: {
            subsidiaryId: user?.subsidiary_id,
            role: user?.role
          }
        });
        setNews(response.data);
      } catch (err) {
        console.error('Failed to fetch news', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchNews();
    }
  }, [user]);

  // Fetch external news when switched to external tab
  useEffect(() => {
    const fetchExternalNews = async () => {
      try {
        setExternalLoading(true);
        const response = await axios.get(`${API_BASE}/news/external-feed`);
        setExternalNews(response.data);
      } catch (err) {
        console.error('Failed to fetch external news feed', err);
      } finally {
        setExternalLoading(false);
      }
    };
    if (feedType === 'external' && externalNews.length === 0) {
      fetchExternalNews();
    }
  }, [feedType, externalNews.length]);

  const categories = ['All', 'Corporate', 'Healthcare', 'Teas', 'Technology', 'Travel', 'Leisure'];

  // Filtering corporate news
  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtering and mapping external RSS news to match the corporate data structure
  const mappedExternalNews = externalNews.filter(item => {
    return item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
  }).map(item => ({
    id: item.link,
    title: item.title,
    content: item.description,
    image_url: item.thumbnail || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000',
    publish_date: item.pubDate,
    category: 'Business News',
    subsidiary_name: item.source || 'Ada Derana',
    subsidiary_id: null,
    isExternal: true,
    link: item.link
  }));

  // Determine active feed
  const currentNews = feedType === 'corporate' ? filteredNews : mappedExternalNews;
  const featuredNews = currentNews[0];
  const otherNews = currentNews.slice(1);

  // Click handler to redirect external news or show internal news details modal
  const handleNewsClick = (item) => {
    if (item.isExternal || item.link) {
      window.open(item.link, '_blank');
    } else {
      setSelectedArticle(item);
    }
  };

  // Stagger variants for news grid entries
  const gridContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.98 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        stiffness: 140, 
        damping: 18 
      } 
    }
  };

  // Calculate read time estimation
  const getReadTime = (content) => {
    if (!content) return '1 min read';
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 225);
    return `${minutes} min read`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">

      {/* SECTION 1 — PREMIUM HERO SECTION */}
      <section className="mb-6 sm:px-1">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="group relative mx-auto h-[170px] sm:h-[210px] lg:h-[270px] max-w-[1280px] overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/90 bg-[#f6e7dc] shadow-[0_22px_55px_-30px_rgba(88,28,33,0.42)]"
        >
          <img
            src="/news-media-center-hero-v2.png"
            className="h-full w-full object-cover object-[26%_center] sm:object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.012]"
            alt="George Steuart Media Center — Latest from The Group"
            onError={(e) => {
              e.target.src = '/media_center_hero.jpg';
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/35" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        </motion.div>
      </section>

      {/* SECTION 2 — NAVIGATION & FILTERS */}
      <section className="sticky top-4 z-50 mb-8">
        <div className="bg-white/88 backdrop-blur-2xl border border-white/70 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] rounded-2xl p-2 flex flex-wrap items-center justify-between gap-3 ring-1 ring-slate-200/60">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Premium Feed Switcher */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-[20px] dark:bg-slate-900/80 border border-slate-200/20 shadow-sm">
              <button
                onClick={() => {
                  setFeedType('corporate');
                  setSelectedCategory('All');
                }}
                className={`px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${feedType === 'corporate' ? 'bg-white text-brand-red shadow-sm dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <BuildingIcon className="w-3.5 h-3.5" /> Company News
              </button>
              <button
                onClick={() => setFeedType('external')}
                className={`px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${feedType === 'external' ? 'bg-white text-brand-red shadow-sm dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Globe className="w-3.5 h-3.5" /> Live Business Pulse (RSS)
              </button>
            </div>

            {/* Vertical Divider */}
            {feedType === 'corporate' && (
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            )}

            {/* Category Filters (Only for Corporate updates) */}
            {feedType === 'corporate' && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[500px]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Source Badge (Only for RSS Feed) */}
            {feedType === 'external' && (
              <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed: Ada Derana
              </span>
            )}
          </div>

          <div className="flex w-full lg:w-auto lg:ml-auto items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                aria-label="Search news"
                className="w-full rounded-xl border border-slate-100 bg-slate-50/90 py-2.5 pl-10 pr-4 text-[11px] font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-red/20 focus:bg-white focus:ring-4 focus:ring-brand-red/5"
              />
            </div>
            <div className="hidden xl:flex items-center gap-2 px-3 border-l border-slate-100">
              <TrendingUp className="w-4 h-4 text-brand-red" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {currentNews.length} Total Stories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURED ARTICLE */}
      {featuredNews ? (
        <section className="mb-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => handleNewsClick(featuredNews)}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-lg cursor-pointer hover:shadow-xl hover:border-brand-red/10 transition-all duration-300"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] group shadow-lg">
              <img
                src={featuredNews.image_url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={featuredNews.title}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=1000'; }}
              />
              <div className="absolute top-6 left-6 px-4 py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-[3px] rounded-full shadow-xl">
                Featured Story
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <span className="flex items-center gap-2 text-xs font-black text-brand-red uppercase tracking-widest">
                  <Tag className="w-4 h-4" />
                  {featuredNews.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                {featuredNews.subsidiary_id ? (
                  <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">
                    <BuildingIcon className="w-3.5 h-3.5" />
                    {featuredNews.subsidiary_name || 'Entity'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/50">
                    {featuredNews.isExternal ? <Globe className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    {featuredNews.subsidiary_name || 'All Staff'}
                  </span>
                )}
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  {new Date(featuredNews.publish_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter line-clamp-3">
                {featuredNews.title}
              </h2>

              <p className="text-lg text-slate-500 font-medium leading-relaxed line-clamp-4">
                {featuredNews.content}
              </p>

              <div className="flex items-center gap-6 pt-4">
                <button 
                  onClick={() => handleNewsClick(featuredNews)}
                  className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[22px] font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-xl group cursor-pointer"
                >
                  {featuredNews.isExternal ? 'Open Source Link' : 'View Full Article'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      ) : (
        <div className="py-24 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-[50px] bg-white max-w-5xl mx-auto mb-16">
          <Rss className="w-16 h-16 mx-auto mb-4 opacity-25" />
          <p className="text-sm uppercase tracking-widest">No articles found matching search criteria</p>
        </div>
      )}

      {/* SECTION 4 — DYNAMIC STAGGERED NEWS GRID */}
      {otherNews.length > 0 && (
        <section className="px-4">
          <motion.div 
            variants={gridContainerVariants}
            initial="hidden"
            animate="show"
            key={selectedCategory + feedType + searchQuery}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            {otherNews.map((item, i) => (
              <motion.div
                key={i}
                variants={cardVariants}
                onClick={() => handleNewsClick(item)}
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="relative h-[190px] overflow-hidden">
                  <img
                    src={item.image_url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={item.title}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&q=80&w=800'; }}
                  />
                  <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-[3px] rounded-full shadow-lg">
                    {item.category}
                  </div>
                </div>

                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.publish_date).toLocaleDateString()}
                    </span>
                    {item.subsidiary_id ? (
                      <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50 shrink-0">
                        <BuildingIcon className="w-2.5 h-2.5" />
                        {item.subsidiary_name || 'Entity'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100/50 shrink-0">
                        <Globe className="w-2.5 h-2.5" />
                        {item.subsidiary_name || 'All Staff'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-6 leading-tight group-hover:text-brand-red transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-slate-550 font-semibold text-xs mb-8 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                      {item.isExternal ? 'Open Source' : 'Read More'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <button className="text-slate-300 hover:text-slate-650">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* LOAD MORE */}
          {currentNews.length > 6 && (
            <div className="flex justify-center mt-20">
              <button className="flex items-center gap-4 px-12 py-5 bg-white border border-slate-100 rounded-[28px] text-[11px] font-black uppercase tracking-[4px] text-slate-400 hover:text-brand-red hover:border-brand-red/20 transition-all shadow-sm hover:shadow-xl group">
                Explore More Stories
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </section>
      )}

      {(loading || externalLoading) && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin mb-6" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[5px] animate-pulse">GS Media Center</p>
          </div>
        </div>
      )}

      {/* ── PREMIUM ARTICLE DETAILS MODAL (MAGAZINE STYLE) ── */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
            />
            
            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 25 }}
              className="relative bg-white dark:bg-[#0F1524] w-full max-w-4xl max-h-[85vh] rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 flex flex-col text-left"
            >
              {/* Reading Progress Bar indicator at the top of the modal */}
              <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-900/60 relative">
                <motion.div 
                  className="h-full bg-gradient-to-r from-brand-red to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>

              {/* Close Button overlay */}
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all z-20 shadow-sm border border-slate-100 dark:border-slate-850 cursor-pointer"
                title="Close Article"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable Main Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 md:p-14 space-y-8">
                
                {/* Meta details list */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5 text-brand-red">
                    <Tag className="w-3.5 h-3.5" />
                    {selectedArticle.category}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  {selectedArticle.subsidiary_id ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-md border border-emerald-100/50 dark:border-emerald-900/20">
                      <BuildingIcon className="w-3.5 h-3.5" />
                      {selectedArticle.subsidiary_name || 'Entity'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-md border border-blue-100/50 dark:border-blue-900/20">
                      <Globe className="w-3.5 h-3.5" />
                      {selectedArticle.subsidiary_name || 'All Staff'}
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedArticle.publish_date || selectedArticle.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <Clock className="w-3.5 h-3.5" />
                    {getReadTime(selectedArticle.content)}
                  </span>
                </div>

                {/* Article Main Title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-850 dark:text-white leading-[1.15] tracking-tight">
                  {selectedArticle.title}
                </h2>

                {/* Image panel */}
                {selectedArticle.image_url && (
                  <div className="relative rounded-[32px] overflow-hidden aspect-[16/9] w-full shadow-lg border border-slate-100 dark:border-slate-800">
                    <img
                      src={selectedArticle.image_url}
                      className="w-full h-full object-cover"
                      alt={selectedArticle.title}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=2000'; }}
                    />
                  </div>
                )}

                {/* Content with drop cap layout styling */}
                <div className="space-y-6">
                  {selectedArticle.content && (
                    <p className="text-base sm:text-lg text-slate-650 dark:text-slate-350 font-medium leading-relaxed whitespace-pre-wrap">
                      <span className="float-left text-5xl sm:text-6xl font-black text-brand-red mr-2.5 leading-none mt-1 select-none">
                        {selectedArticle.content.trim().charAt(0)}
                      </span>
                      {selectedArticle.content.trim().slice(1)}
                    </p>
                  )}
                </div>
              </div>

              {/* Reader footer bar */}
              <div className="px-8 py-5.5 border-t border-slate-50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>George Steuart corporate newsroom</span>
                <span>Thank you for reading</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default News;
