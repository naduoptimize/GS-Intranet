import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
   ArrowLeft,
   MapPin,
   Globe,
   Target,
   Zap,
   Users,
   TrendingUp,
   ShieldCheck,
   Rss,
   Heart,
   Globe2,
   Lightbulb,
   Building2,
   Award,
   CheckCircle2,
   ArrowRight,
   Phone,
   ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const resolveImgUrl = (url) => {
   if (!url) return null;
   if (url.startsWith('http://') || url.startsWith('https://')) return url;
   if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
   if (url.startsWith('uploads/')) return `http://localhost:5000/${url}`;
   return url;
};

const SubsidiaryDetail = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [subsidiary, setSubsidiary] = useState(null);
   const [loading, setLoading] = useState(true);
   const [staff, setStaff] = useState([]);
   const [directors, setDirectors] = useState([]);

   const getBrandConfig = (name) => {
      const lowName = name?.toLowerCase() || '';

      // Health
      if (lowName.includes('health') || lowName.includes('pharmaceutical') || lowName.includes('gs health')) {
         return {
            primary: 'text-[#0082CA]',
            secondary: 'bg-[#0082CA]',
            accent: 'bg-[#0082CA]/10',
            light: 'bg-[#0082CA]/5',
            border: 'border-[#0082CA]/10',
            icon: ShieldCheck,
            tagline: 'Revolutionizing Healthcare Since 1986',
            hex: '#0082CA',
            logo: '/health_logo.png',
            cover: '/health_cover.png',
            insight: "A premier distributor of pharmaceuticals and medical equipment, representing over 70 global partners like B Braun and Abbott.",
            leadership: [
               { name: 'Eran Ranasinghe', role: 'Managing Director' },
               { name: 'Sarva Ameresekere', role: 'Group Chairman' },
               { name: 'Thulitha Jayasooriya', role: 'Director' },
               { name: 'Sanjiva Wijesekera', role: 'Director' },
               { name: 'Thushantha Nakandala', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ],
            showcase: [
               { title: 'Pharmaceuticals', desc: '600+ Therapeutic Products', img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=800', url: 'https://www.gshealth.lk/' },
               { title: 'Diagnostics', desc: 'Rapid Diagnostic Technologies', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800', url: 'https://www.gshealth.lk/' },
               { title: 'Consumer Health', desc: 'Wellness & Personal Care', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800', url: 'https://www.gshealth.lk/' },
               { title: 'Sports Medicine', desc: 'Athletic Recovery Solutions', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800', url: 'https://www.gshealth.lk/' }
            ],
            widgets: [
               { title: '70+', desc: 'Global Partners', icon: Globe },
               { title: '5,100+', desc: 'Pharmacy Network', icon: Users },
               { title: 'Top Tier', desc: 'National Provider', icon: Award }
            ]
         };
      }

      // Insurance
      if (lowName.includes('insurance')) {
         return {
            primary: 'text-[#BE1E2D]',
            secondary: 'bg-[#BE1E2D]',
            accent: 'bg-[#D4AF37]/10',
            light: 'bg-[#BE1E2D]/5',
            border: 'border-[#BE1E2D]/10',
            icon: ShieldCheck,
            tagline: 'Representing Your Interests',
            hex: '#BE1E2D',
            logo: '/insurance_logo.png',
            cover: '/insurance_cover.png',
            insight: "As a premier IRCSL licensed insurance broker, George Steuart Insurance Brokers specializes in providing independent, expert advisory and risk transfer solutions for both personal and corporate clients.",
            leadership: [
               { name: 'Joachim Caspersz', role: 'Managing Director' },
               { name: 'T S Arulanandan', role: 'Director' },
               { name: 'Kumar Muthiah', role: 'Director' },
               { name: 'Rohana Weerasinghe', role: 'Director' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' },
               { name: 'Dharani Fernando', role: 'Director' }
            ],
            showcase: [
               { title: 'Corporate Risk', desc: 'Enterprise Risk Transfer', img: 'https://images.unsplash.com/photo-1454165833767-027ffea7028c?auto=format&fit=crop&q=80&w=800', url: 'https://gsinsurance.lk/' },
               { title: 'Personal Lines', desc: 'Home, Motor & Travel', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800', url: 'https://gsinsurance.lk/' },
               { title: 'Medical Insurance', desc: 'Tailored Health Protection', img: 'https://images.unsplash.com/photo-1505751172107-573225a917bb?auto=format&fit=crop&q=80&w=800', url: 'https://gsinsurance.lk/' },
               { title: 'Reinsurance', desc: 'Specialized Risk Solutions', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800', url: 'https://gsinsurance.lk/' }
            ],
            widgets: [
               { title: 'IRCSL', desc: 'Licensed Broker', icon: ShieldCheck },
               { title: 'Expert', desc: 'Independent Advisory', icon: Award },
               { title: 'Trust', desc: 'Client-Centric Risk Mgmt', icon: Heart }
            ]
         };
      }

      // Finance / Invest / Asset Management
      if (lowName.includes('invest') || lowName.includes('asset') || lowName.includes('finance')) {
         const isInvest = lowName.includes('invest');
         const isAsset = lowName.includes('asset');

         return {
            primary: isInvest ? 'text-[#701A75]' : (isAsset ? 'text-[#EC4899]' : 'text-[#8A2432]'),
            secondary: isInvest ? 'bg-[#701A75]' : (isAsset ? 'bg-[#EC4899]' : 'bg-[#8A2432]'),
            accent: isInvest ? 'bg-[#701A75]/10' : (isAsset ? 'bg-[#EC4899]/10' : 'bg-[#8A2432]/10'),
            light: isInvest ? 'bg-[#701A75]/5' : (isAsset ? 'bg-[#EC4899]/5' : 'bg-[#8A2432]/5'),
            border: isInvest ? 'border-[#701A75]/10' : (isAsset ? 'border-[#EC4899]/10' : 'border-[#8A2432]/10'),
            icon: isAsset ? ShieldCheck : TrendingUp,
            tagline: isInvest ? 'Interbank Money Dealer Excellence' : (isAsset ? 'Constructing Unique Portfolios for Long-Term Growth' : 'Strategic Financial Partners'),
            hex: isInvest ? '#701A75' : (isAsset ? '#EC4899' : '#8A2432'),
            logo: isInvest ? '/investments_logo.png' : (isAsset ? '/asset_management_logo.png' : '/api_logo.png'),
            cover: isInvest ? '/investments_cover.png' : null,
            insight: isInvest ? "As a CBSL licensed Interbank Money Dealer, George Steuart Investments leverages over two decades of expertise to provide unblemished excellence in money market and treasury solutions." : (isAsset ? "As an SEC-licensed Investment Manager, George Steuart Asset Management specializes in constructing unique, high-performance portfolios that withstand market volatility for sustainable long-term growth." : "Our financial services division provides comprehensive interbank and money market brokerage solutions, maintaining the highest regulatory standards."),
            leadership: isInvest ? [
               { name: 'Sudath De Silva', role: 'Executive Director' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ] : (isAsset ? [
               { name: 'Sudath De Silva', role: 'Managing Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' },
               { name: 'Harsha Fernando', role: 'Director' },
               { name: 'Vasula Premawardhana', role: 'Director' },
               { name: 'W.A.A. Perera', role: 'Director' },
               { name: 'P.N. Mahawatte', role: 'Director' }
            ] : []),
            showcase: isInvest ? [
               { title: 'Interbank Dealer', desc: 'CBSL Licensed Money Dealer', img: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-investments' },
               { title: 'Forex Consultancy', desc: 'Expert Market Advisory', img: 'https://images.unsplash.com/photo-1611974715853-268fd9f396ae?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-investments' },
               { title: 'Money Market', desc: 'Strategic Treasury Solutions', img: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-investments' },
               { title: 'Wealth Advisory', desc: 'Institutional Asset Mgmt', img: 'https://images.unsplash.com/photo-1454165833767-027ffea7028c?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-investments' }
            ] : (isAsset ? [
               { title: 'Portfolio Management', desc: 'Discretionary Client Mandates', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-asset-management' },
               { title: 'Fixed Income', desc: 'T-Bills, Bonds & Debentures', img: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-asset-management' },
               { title: 'Equity Strategy', desc: 'Active Stock Market Participation', img: 'https://images.unsplash.com/photo-1611974715853-268fd9f396ae?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-asset-management' },
               { title: 'Private Wealth', desc: 'HNI & Institutional Advisory', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-asset-management' }
            ] : []),
            widgets: [
               { title: isInvest ? 'CBSL' : (isAsset ? 'SEC' : 'Licensed'), desc: 'Regulatory Excellence', icon: ShieldCheck },
               { title: isInvest ? '20+ Yrs' : (isAsset ? 'Expertise' : 'Strategic'), desc: isInvest ? 'Market Experience' : 'Long-Term Growth', icon: Award },
               { title: isInvest ? 'Treasury' : (isAsset ? 'Portfolio' : 'Solutions'), desc: 'Full Stack Solutions', icon: TrendingUp }
            ]
         };
      }

      // Consumer
      if (lowName.includes('consumer')) {
         return {
            primary: 'text-[#BE1E2D]',
            secondary: 'bg-[#BE1E2D]',
            accent: 'bg-[#BE1E2D]/10',
            light: 'bg-[#BE1E2D]/5',
            border: 'border-[#BE1E2D]/10',
            icon: Users,
            tagline: 'Bridging Science with Natural Ingredients',
            hex: '#BE1E2D',
            logo: '/consumer_logo.png',
            insight: "As the group's most recent sectoral venture, George Steuart Consumer is a fast-growing FMCG powerhouse specialized in bridging modern science with the purity of natural ingredients.",
            leadership: [
               { name: 'Tharanga Wickramasinghe', role: 'Executive Director / CEO' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ],
            showcase: [
               { title: 'Personal Care', desc: 'Seri & Ruvedha Naturals', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-consumer' },
               { title: 'Home & Hygiene', desc: 'Sterill Industrial Care', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-consumer' },
               { title: 'Beverage Range', desc: 'Rosa Kahata & Steuarts', img: 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-consumer' },
               { title: 'Ath Gunaya', desc: 'Traditional Spice Blends', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-consumer' }
            ],
            widgets: [
               { title: '12,500+', desc: 'Distribution Points', icon: Globe },
               { title: 'FMCG', desc: 'Powerhouse Venture', icon: Zap },
               { title: 'Natural', desc: 'Science-Backed Quality', icon: ShieldCheck }
            ]
         };
      }

      // Solutions
      if (lowName.includes('solutions')) {
         return {
            primary: 'text-[#A21CAF]',
            secondary: 'bg-[#A21CAF]',
            accent: 'bg-[#A21CAF]/10',
            light: 'bg-[#A21CAF]/5',
            border: 'border-[#A21CAF]/10',
            icon: Lightbulb,
            tagline: 'Efficient & Reliable',
            hex: '#A21CAF',
            logo: '/solutions_logo.png',
            insight: "As a truly Sri Lankan entity, George Steuart Solutions introduces the latest innovations in engineering and technology to add significant value to the industrial and hospitality sectors.",
            leadership: [
               { name: 'Manoj Pilimatalawwe', role: 'Executive Director / Lead' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' }
            ],
            showcase: [
               { title: 'Solar Energy', desc: 'On-grid & Hybrid Systems', img: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=80&w=800', url: 'https://www.gssolutions.lk/' },
               { title: 'Climate Control', desc: 'Gree & Samsung HVAC', img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=800', url: 'https://www.gssolutions.lk/' },
               { title: 'Vertical Mobility', desc: 'Canny Elevators & Escalators', img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=800', url: 'https://www.gssolutions.lk/' },
               { title: 'Industrial Power', desc: 'Backup & Backup Generation', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', url: 'https://www.gssolutions.lk/' }
            ],
            widgets: [
               { title: '#1 Solar', desc: 'Market Leader', icon: Zap },
               { title: 'Tech-Driven', desc: 'Latest Innovations', icon: Lightbulb },
               { title: 'Reliable', desc: 'Full Maintenance Svc', icon: ShieldCheck }
            ]
         };
      }

      // Recruitment
      if (lowName.includes('recruitment')) {
         return {
            primary: 'text-[#BE1E2D]',
            secondary: 'bg-[#BE1E2D]',
            accent: 'bg-[#F59E0B]/10',
            light: 'bg-[#BE1E2D]/5',
            border: 'border-[#BE1E2D]/10',
            icon: Users,
            tagline: 'With Renewed Vigor and Commitment',
            hex: '#BE1E2D',
            logo: '/recruitment_logo.png',
            insight: "A licensed foreign employment agency with a rich history of over 30 years, George Steuart Recruitment is dedicated to matching top Sri Lankan talent with global opportunities.",
            leadership: [
               { name: 'Amila Rajapaksha', role: 'Executive Director / General Manager' },
               { name: 'R.M. Rahaman', role: 'Executive Director' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ],
            showcase: [
               { title: 'Overseas Manpower', desc: 'Global Talent Solutions', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-recruitment' },
               { title: 'Foreign Employment', desc: 'SLBFE Licensed Agency', img: 'https://images.unsplash.com/photo-1454165833767-027ffea7028c?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-recruitment' },
               { title: 'Middle East Focus', desc: 'UAE, Qatar & Saudi Network', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-recruitment' },
               { title: 'Skilled Professionals', desc: 'Expert Talent Matching', img: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800', url: 'https://georgesteuart.lk/george-steuart-recruitment' }
            ],
            widgets: [
               { title: '30+ Yrs', desc: 'Industry Pioneer', icon: Award },
               { title: 'SLBFE', desc: 'Licensed Agency', icon: ShieldCheck },
               { title: 'Global', desc: 'Strategic Partnerships', icon: Globe }
            ]
         };
      }

      // Citrus Leisure
      if (lowName.includes('citrus')) {
         return {
            primary: 'text-[#f39221]',
            secondary: 'bg-[#f39221]',
            accent: 'bg-[#f39221]/10',
            light: 'bg-[#f39221]/5',
            border: 'border-[#f39221]/10',
            icon: Building2,
            tagline: 'Happiness is Citrus',
            hex: '#f39221',
            logo: 'https://citrusleisure.com/wp-content/themes/citrusleisure/img/logo.png',
            widgets: [
               { title: '3 Resorts', desc: 'Coastal & City Footprint', icon: Building2 },
               { title: '5-Star', desc: 'Award-Winning Luxury', icon: Award },
               { title: 'Revolving', desc: "Asia's Tallest Dining", icon: TrendingUp }
            ],
            leadership: [
               { name: 'Chandana Talwatte', role: 'Executive Director / CEO' },
               { name: 'Mani Sugathapala', role: 'Executive Director (Sales & Marketing)' },
               { name: 'Varuni Fernando', role: 'Non-Executive Director' },
               { name: 'Sarva Amarasekere', role: 'Non-Executive Director' }
            ],
            showcase: [
               { title: 'Citrus Waskaduwa', desc: '150 Rooms | 5-Star Luxury', img: 'https://citrusleisure.com/waskaduwa/wp-content/uploads/photo-gallery/imported_from_media_libray/thumb/sr1-1.jpg?bwg=1544697401', url: 'https://citrusleisure.com/waskaduwa/' },
               { title: 'Citrus Hikkaduwa', desc: '90 Rooms | Coastal Resort', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800', url: 'https://citrusleisure.com/hikkaduwa/' },
               { title: 'Blue Orbit', desc: '225 Guests | 231m High Revolving', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800', url: 'https://info.citrusleisure.com/blue-orbit' },
               { title: 'The Steuart', desc: '50 Rooms | Heritage Boutique', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800', url: 'https://citrusleisure.com/thesteuart/' }
            ],
            hotels: [
               {
                  name: 'Citrus Waskaduwa',
                  type: '5-Star Beach Resort',
                  address: 'Paradise Road, Waskaduwa, Sri Lanka.',
                  phone: '+94 38 223 5000',
                  email: 'waskaduwa@citrusleisure.com',
                  url: 'https://citrusleisure.com/waskaduwa/',
                  img: 'https://citrusleisure.com/waskaduwa/wp-content/uploads/photo-gallery/imported_from_media_libray/thumb/sr1-1.jpg?bwg=1544697401'
               },
               {
                  name: 'Citrus Hikkaduwa',
                  type: 'Beachfront Resort',
                  address: '390, Galle Road, Hikkaduwa, Sri Lanka.',
                  phone: '+94 91 227 7000',
                  email: 'hikkaduwa@citrusleisure.com',
                  url: 'https://citrusleisure.com/hikkaduwa/',
                  img: 'data:image/webp;base64,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'
               },
               {
                  name: 'The Steuart by Citrus',
                  type: 'City Boutique Hotel',
                  address: 'No. 12, Sir Baron Jayatilaka Mawatha, Colombo 01, Sri Lanka.',
                  phone: '+94 11 244 3244',
                  email: 'steuart@citrusleisure.com',
                  url: 'https://citrusleisure.com/steuart/',
                  img: 'https://citrusleisure.com/steuart/wp-content/uploads/photo-gallery/tsgl5.jpg?bwg=1545044576'
               }
            ]
         };
      }

      // GS Teas
      if (lowName.includes('teas') && !lowName.includes('heladiv')) {
         return {
            primary: 'text-[#007299]',
            secondary: 'bg-[#007299]',
            accent: 'bg-[#007299]/10',
            light: 'bg-[#007299]/5',
            border: 'border-[#007299]/10',
            icon: Target,
            tagline: 'The Original Ceylon Tea People',
            hex: '#007299',
            logo: '/gs_teas_logo.png',
            cover: '/gs_teas_cover.png',
            supplementaryImage: '/tea_products.png',
            insight: 'As the oldest mercantile establishment in Sri Lanka, we have perfected the art of Ceylon Tea since 1835, delivering unmatched quality to the world.',
            leadership: [
               { name: 'Dai Pathmanathan', role: 'Managing Director' },
               { name: 'Sarva Ameresekere', role: 'Group Chairman' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ],
            showcase: [
               { title: 'Steuarts Ceylon', desc: 'Premium Private Reserve', img: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsteas.lk/' },
               { title: 'Local Favourites', desc: 'Rosa Kahata & BOPF', img: 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsteas.lk/' },
               { title: 'James Coffee', desc: 'Authentic Artisan Roast', img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsteas.lk/' },
               { title: 'Gourmet Syrups', desc: 'Premium HoReCa Solutions', img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsteas.lk/' }
            ],
            widgets: [
               { title: 'Est. 1835', desc: 'Oldest Mercantile Exporter', icon: Award },
               { title: 'Global Reach', desc: '35+ Strategic Markets', icon: Globe },
               { title: 'Master Blenders', desc: 'Uncompromised Quality', icon: ShieldCheck }
            ]
         };
      }

      // Heladiv
      if (lowName.includes('heladiv')) {
         return {
            primary: 'text-[#8DC63F]',
            secondary: 'bg-[#8DC63F]',
            accent: 'bg-[#8DC63F]/10',
            light: 'bg-[#8DC63F]/5',
            border: 'border-[#8DC63F]/10',
            icon: Zap,
            tagline: 'Where Tea Meets Innovation',
            hex: '#8DC63F',
            logo: '/heladiv_logo.png',
            cover: '/sub_heladiv.png',
            supplementaryImage: '/image copy 2.png',
            insight: 'As the flagship brand of HVA Foods PLC, Heladiv leads the evolution of pure Ceylon tea through cutting-edge innovation and modern beverage solutions globally.',
            leadership: [
               { name: 'Sarva Ameresekere', role: 'Group Chairman' },
               { name: 'Charith Abeywardena', role: 'Director / CEO' },
               { name: 'V. S. A. Senadheera', role: 'Director' }
            ],
            showcase: [
               { title: 'Heladiv Iced Tea', desc: 'Ready-to-Drink Innovation', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800', url: 'https://www.heladiv.com/' },
               { title: 'Pure Ceylon', desc: 'Premium Teas & Infusions', img: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=800', url: 'https://www.heladiv.com/' },
               { title: 'Heladiv Tea Club', desc: 'Exclusive Lounge Experience', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800', url: 'https://www.heladiv.com/' },
               { title: 'Moringa & Health', desc: 'Superfood Integrations', img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800', url: 'https://www.heladiv.com/' }
            ],
            widgets: [
               { title: 'R&D Center', desc: 'Innovative Product Design', icon: Lightbulb },
               { title: 'Eco-Friendly', desc: 'Ozone-Friendly Certified', icon: ShieldCheck },
               { title: 'Global Export', desc: 'Leading Beverage Supplier', icon: Globe }
            ]
         };
      }

      // GS Travels
      if (lowName.includes('travel')) {
         return {
            primary: 'text-[#28a9c9]',
            secondary: 'bg-[#28a9c9]',
            accent: 'bg-[#28a9c9]/10',
            light: 'bg-[#28a9c9]/5',
            border: 'border-[#28a9c9]/10',
            icon: Globe2,
            tagline: 'Your travel partner since 1835',
            hex: '#28a9c9',
            logo: '/travel_logo.png',
            insight: "Heirs to a tradition of unblemished excellence in business spanning over a century and a half, George Steuart Travel is a full-service leader in bespoke outbound and inbound experiences.",
            leadership: [
               { name: 'Channe Wijemanne', role: 'Managing Director' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ],
            showcase: [
               { title: 'Corporate Travel', desc: 'Bespoke Management Solutions', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=80&w=800', url: 'https://gstravels.lk/' },
               { title: 'Visa Consultancy', desc: 'Global Processing Experts', img: 'https://images.unsplash.com/photo-1544850895-30fafd28286b?auto=format&fit=crop&q=80&w=800', url: 'https://gstravels.lk/' },
               { title: 'Holiday Packages', desc: 'Curated Global Destinations', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800', url: 'https://gstravels.lk/' },
               { title: 'Air Services', desc: 'End-to-End Flight Logistics', img: 'https://images.unsplash.com/photo-1464037862896-6a7522fbf4a0?auto=format&fit=crop&q=80&w=800', url: 'https://gstravels.lk/' }
            ],
            widgets: [
               { title: '185+ Yrs', desc: 'Legacy of Trust', icon: Award },
               { title: 'Global', desc: 'IATA Accredited', icon: Globe },
               { title: 'Full Svc', desc: 'End-to-End Solutions', icon: ShieldCheck }
            ]
         };
      }

      // Steuart Holidays
      if (lowName.includes('holiday')) {
         return {
            primary: 'text-[#00AEEF]',
            secondary: 'bg-[#00AEEF]',
            accent: 'bg-[#00AEEF]/10',
            light: 'bg-[#00AEEF]/5',
            border: 'border-[#00AEEF]/10',
            icon: Globe2,
            tagline: 'Explore Happiness!',
            hex: '#00AEEF',
            logo: '/holidays_logo.png',
            insight: "Heirs to the 187-year-old legacy of George Steuart & Co., Steuart Holidays delivers bespoke dream vacations with over 47 years of specialized travel expertise.",
            leadership: [
               { name: 'Channe Wijemanne', role: 'Managing Director' },
               { name: 'Sarva Ameresekere', role: 'Director' },
               { name: 'Varuni Fernando', role: 'Director' },
               { name: 'Ashika Karunathilaka', role: 'Director' },
               { name: 'Manoj Pilimatalawwe', role: 'Director' }
            ],
            showcase: [
               { title: 'Inbound Tours', desc: 'Sri Lanka in Style', img: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&q=80&w=800', url: 'https://www.steuartholidays.com/' },
               { title: 'Maldives Gateway', desc: 'Luxury Atoll Escapes', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800', url: 'https://www.steuartholidays.com/' },
               { title: 'Wildlife Safaris', desc: 'Experiential Nature Journeys', img: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', url: 'https://www.steuartholidays.com/' },
               { title: 'Sports Travel', desc: 'Specialized Cricket Tours', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800', url: 'https://www.steuartholidays.com/' }
            ],
            widgets: [
               { title: '47+ Yrs', desc: 'Industry Expertise', icon: Award },
               { title: 'Dream Svc', desc: 'Bespoke Itineraries', icon: Zap },
               { title: 'Trust', icon: ShieldCheck, desc: 'GS Group Legacy' }
            ]
         };
      }

      // Optimize
      if (lowName.includes('optimize')) {
         return {
            primary: 'text-[#2563EB]',
            secondary: 'bg-[#2563EB]',
            accent: 'bg-[#2563EB]/10',
            light: 'bg-[#2563EB]/5',
            border: 'border-[#2563EB]/10',
            icon: Lightbulb,
            tagline: 'Accelerating Digital Transformation',
            hex: '#2563EB',
            logo: '/solutions_logo.png',
            cover: '/industrial_premium.png',
            insight: 'George Steuart Optimize delivers enterprise digital transformation, cloud software engineering, cybersecurity, and strategic IT modernization across the group and external partners.',
            leadership: [
               { name: 'Janidu Perera', role: 'Chief Technology Officer' },
               { name: 'Chanika Dassanayake', role: 'Senior IT Executive' }
            ],
            showcase: [
               { title: 'Enterprise Software', desc: 'Custom Cloud Applications', img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsoptimize.lk/' },
               { title: 'Cloud Infrastructure', desc: 'Secure Azure & M365 Ecosystems', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsoptimize.lk/' },
               { title: 'Digital Workplace', desc: 'Group Intranet & Workflow Automation', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsoptimize.lk/' },
               { title: 'Cybersecurity', desc: 'Zero Trust & SOC Operations', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800', url: 'https://www.gsoptimize.lk/' }
            ],
            widgets: [
               { title: 'Cloud & AI', desc: 'Modern Tech Stack', icon: Zap },
               { title: 'Security', desc: 'Zero Trust Certified', icon: ShieldCheck },
               { title: 'Innovate', desc: 'Digital Transformation', icon: Lightbulb }
            ]
         };
      }

      // Default
      return {
         primary: 'text-brand-red',
         secondary: 'bg-brand-red',
         accent: 'bg-slate-900',
         light: 'bg-brand-red/5',
         border: 'border-brand-red/10',
         icon: Building2,
         tagline: 'George Steuart Entity',
         hex: '#BE1E2D'
      };
   };

   useEffect(() => {
      const fetchData = async () => {
         try {
            const subRes = await axios.get(`http://localhost:5000/api/subsidiaries/${id}`);
            const [staffResult, directorResult] = await Promise.allSettled([
               axios.get(`http://localhost:5000/api/users?subsidiaryId=${id}`),
               axios.get(`http://localhost:5000/api/subsidiaries/${id}/directors`)
            ]);
            setSubsidiary(subRes.data);
            setStaff(staffResult.status === 'fulfilled' ? staffResult.value.data : []);
            setDirectors(directorResult.status === 'fulfilled' ? directorResult.value.data : []);
         } catch (err) {
            console.error('Failed to fetch subsidiary data', err);
            navigate('/subsidiary');
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [id, navigate]);

   if (loading) return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
         <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin"></div>
         <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 animate-pulse">Loading Subsidiary Intelligence</p>
      </div>
   );

   if (!subsidiary) return null;

   const brand = getBrandConfig(subsidiary.name);

   // Use DB directors if available, else fallback to brand.leadership
   const leadershipDisplay = directors.length > 0
      ? directors.map(d => ({ name: d.name, role: d.title, image: d.image_url }))
      : brand.leadership;

   return (
      <div className="relative selection:bg-brand-red/10 pb-20 overflow-x-hidden">
         {/* Main Container */}
         <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-4 space-y-5 md:space-y-6">

            {/* Back Button */}
            <button
               onClick={() => navigate('/subsidiary')}
               className="flex items-center gap-2.5 bg-white border border-slate-200 p-1.5 pr-4 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group w-fit"
            >
               <div className={`w-7 h-7 rounded-lg ${brand.secondary} text-white flex items-center justify-center group-hover:-translate-x-0.5 transition-transform`}>
                  <ArrowLeft className="w-4 h-4" />
               </div>
               <span className="text-[9px] font-black text-slate-800 uppercase tracking-[2px]">Back to Portfolio</span>
            </button>

            {/* Hero Section */}
            <div className="relative group">
               <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative min-h-[410px] md:min-h-0 md:h-[320px] rounded-[26px] md:rounded-[30px] overflow-hidden shadow-[0_22px_60px_-34px_rgba(15,23,42,0.5)] border border-white/20"
               >
                  <img
                     src={resolveImgUrl(subsidiary.cover_image) || brand.cover || '/sub_1.png'}
                     alt={subsidiary.name}
                     className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${brand.secondary}/20 opacity-30 mix-blend-overlay`} />

                  <div className="absolute inset-0 p-6 md:p-8 lg:p-9 flex flex-col justify-center">
                     <div className="max-w-xl lg:max-w-[62%] space-y-4">
                        <div className="flex items-center gap-3.5">
                           <div className="h-12 md:h-13 px-4 bg-white rounded-xl shadow-lg flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500 min-w-[88px] md:min-w-[100px]">
                              <img src={resolveImgUrl(subsidiary.logo_url) || brand.logo || "/api_logo.png"} className="h-8 md:h-9 max-w-[150px] w-auto object-contain" />
                           </div>
                           <div className="h-8 w-px bg-white/25" />
                           <div>
                              <p className="text-white/40 font-black text-[7px] md:text-[9px] uppercase tracking-[2px] md:tracking-[4px] leading-none mb-1 md:mb-2">Entity Division</p>
                              <p className="text-white font-black text-[9px] md:text-[11px] uppercase tracking-[1px] md:tracking-[2px]">{subsidiary.category} Sector</p>
                           </div>
                        </div>
                        <div className="space-y-2.5">
                           <h1 className="text-4xl md:text-[42px] lg:text-[46px] font-black text-white leading-[0.95] tracking-[-0.045em] max-w-[620px]">
                              {subsidiary.name}
                           </h1>
                           <p className="text-sm text-white/75 font-medium max-w-xl leading-relaxed line-clamp-2">
                              {subsidiary.description}
                           </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                           <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-white/15 text-white text-[8px] font-black uppercase tracking-[1px]">
                              <MapPin className={`w-3 md:w-5 h-3 md:h-5 ${brand.primary}`} /> {subsidiary.location}
                           </div>
                           {subsidiary.website ? (
                              <a 
                                 href={subsidiary.website.startsWith('http') ? subsidiary.website : `https://${subsidiary.website}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-white/15 text-white text-[8px] font-black uppercase tracking-[1px] hover:bg-white/20 transition-all cursor-pointer max-w-[200px] truncate"
                              >
                                 <Globe2 className={`w-3 md:w-5 h-3 md:h-5 ${brand.primary}`} /> {subsidiary.website}
                              </a>
                           ) : (
                              <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-white/15 text-white text-[8px] font-black uppercase tracking-[1px]">
                                 <Globe2 className={`w-3 md:w-5 h-3 md:h-5 ${brand.primary}`} /> No Website
                              </div>
                           )}
                           <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-white/15 text-white text-[8px] font-black uppercase tracking-[1px]">
                              <Users className={`w-3 md:w-5 h-3 md:h-5 ${brand.primary}`} /> {staff.length + directors.length} Employees
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>

               {/* Entity Hub Overlay - Repositioned for mobile */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative md:absolute md:right-5 lg:right-6 md:bottom-5 lg:bottom-6 w-full md:w-[255px] bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-[22px] shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)] space-y-3.5 z-10 border border-white/70 mt-4 md:mt-0"
               >
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm md:text-base font-black text-slate-800 tracking-tight">Entity Pulse</h3>
                     <div className={`w-8 h-8 ${brand.light} ${brand.primary} rounded-lg flex items-center justify-center`}>
                        <Rss className="w-4 h-4" />
                     </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                     <div>
                        <p className="text-3xl md:text-4xl font-black text-slate-900 leading-none tracking-tighter">
                           {staff.length + directors.length}
                        </p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Staff</p>
                     </div>
                     <div className="flex flex-col items-center gap-1.5">
                        <div className="relative w-14 h-14">
                           <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                              <circle cx="50" cy="50" r="45" fill="none" stroke={brand.hex || '#10B981'} strokeWidth="8" strokeDasharray="282.7" strokeDashoffset="28" strokeLinecap="round" className="transition-all duration-1000" />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-black text-slate-800 tracking-tight">96%</span>
                           </div>
                        </div>
                        <p className={`text-[7px] font-black ${brand.primary} uppercase tracking-widest text-center leading-tight`}>Health Index · Stable</p>
                     </div>
                  </div>

                  <button className={`flex items-center gap-2 ${brand.primary} font-black text-[8px] uppercase tracking-widest group pt-1 border-t border-slate-100 w-full`}>
                     Enterprise Directory <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </button>
               </motion.div>
            </div>

            {/* Strategic Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-start">
               <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[36px] shadow-xl border border-slate-50 space-y-5 group hover:-translate-y-2 transition-all">
                  <div className={`w-11 h-11 ${brand.light} ${brand.primary} rounded-xl flex items-center justify-center`}>
                     <Target className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-base md:text-lg font-black text-slate-800">Our Mission</h3>
                     <p className="text-slate-500 font-medium leading-relaxed text-xs">
                        {subsidiary.mission || `To provide exceptional value in the ${subsidiary.category} sector.`}
                     </p>
                  </div>
               </div>

               <div className={`${brand.light} ${brand.border} border p-6 md:p-8 rounded-[24px] md:rounded-[36px] shadow-sm space-y-5 group hover:-translate-y-2 transition-all`}>
                  <div className={`w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center ${brand.primary}`}>
                     <Zap className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-base md:text-lg font-black text-slate-800">Our Vision</h3>
                     <p className="text-slate-500 font-medium leading-relaxed text-xs">
                        {subsidiary.vision || `To be the most trusted name in the global GS portfolio.`}
                     </p>
                  </div>
               </div>

               <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[36px] shadow-xl border border-slate-50 space-y-5 group hover:-translate-y-2 transition-all">
                  <div className={`w-11 h-11 ${brand.light} ${brand.primary} rounded-xl flex items-center justify-center`}>
                     <Heart className="w-5 h-5" />
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-base md:text-lg font-black text-slate-800">Our Values</h3>
                     <div className="space-y-2">
                        {['Strategic Integrity', 'Operational Excellence', 'Team Synergy', 'Innovation First'].map((v, i) => (
                           <div key={i} className="flex items-center gap-2.5 text-slate-600 font-bold text-[10px]">
                              <div className={`w-3.5 h-3.5 rounded-full ${brand.light} ${brand.primary} flex items-center justify-center shrink-0`}>
                                 <CheckCircle2 className="w-2 h-2" />
                              </div>
                              {v}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Contact Information Banner */}
            <div className={`mt-6 md:mt-8 bg-white rounded-[24px] md:rounded-[36px] shadow-xl border border-slate-50 overflow-hidden`}>
               <div className="flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <div className={`flex items-center gap-4 p-6 flex-1`}>
                     <div className={`w-10 h-10 ${brand.light} ${brand.primary} rounded-xl flex items-center justify-center shrink-0`}>
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className={`text-[9px] font-black ${brand.primary} uppercase tracking-widest mb-1`}>Company Address</p>
                        <p className="text-xs font-bold text-slate-700 leading-snug">{subsidiary.location || '—'}</p>
                     </div>
                  </div>
                  <div className={`flex items-center gap-4 p-6 flex-1`}>
                     <div className={`w-10 h-10 ${brand.light} ${brand.primary} rounded-xl flex items-center justify-center shrink-0`}>
                        <Globe className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className={`text-[9px] font-black ${brand.primary} uppercase tracking-widest mb-1`}>Email Address</p>
                        {subsidiary.email
                           ? <a href={`mailto:${subsidiary.email}`} className="text-xs font-bold text-slate-700 hover:text-brand-red transition-colors block truncate">{subsidiary.email}</a>
                           : <span className="text-xs font-bold text-slate-400">—</span>
                        }
                     </div>
                  </div>
                  <div className={`flex items-center gap-4 p-6 flex-1`}>
                     <div className={`w-10 h-10 ${brand.light} ${brand.primary} rounded-xl flex items-center justify-center shrink-0`}>
                        <Phone className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className={`text-[9px] font-black ${brand.primary} uppercase tracking-widest mb-1`}>Telephone</p>
                        <p className="text-xs font-bold text-slate-700">{subsidiary.phone || '—'}{subsidiary.phone_2 ? ` / ${subsidiary.phone_2}` : ''}</p>
                     </div>
                  </div>
               </div>
            </div>


            {/* Content & Sidebar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

               {/* Heritage Area */}
               <div className="lg:col-span-8 space-y-6 md:space-y-8">
                  <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[50px] shadow-xl border border-slate-50 space-y-6 md:space-y-8">
                     <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-4">
                        <div className={`w-1.5 h-6 md:h-8 ${brand.secondary} rounded-full`} />
                        Heritage & Highlights
                     </h3>

                     <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
                        <div className="w-full md:w-64 h-48 md:h-56 rounded-[25px] md:rounded-[40px] overflow-hidden shrink-0 shadow-2xl relative group/img">
                           <img src={brand.cover || subsidiary.cover_image || '/sub_1.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                           <div className={`absolute inset-0 bg-gradient-to-br ${brand.secondary}/30 mix-blend-overlay`} />
                        </div>
                        <div className="space-y-6 md:space-y-10 flex-1">
                           <p className="text-xl md:text-2xl text-slate-700 font-black leading-tight tracking-tight italic">
                              "{subsidiary.highlights?.split(';')[0] || `Contributing to the George Steuart legacy through excellence.`}"
                           </p>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
                              {subsidiary.highlights?.split(';')?.slice(1).map((h, i) => (
                                 <div key={i}>
                                    <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tighter">
                                       {h.trim().split(' ')[0] || 'GS'}
                                    </p>
                                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-tight">
                                       {h.trim().split(' ').slice(1).join(' ') || 'Excellence'}
                                    </p>
                                 </div>
                              ))}
                              {!subsidiary.highlights && brand.widgets?.map((w, i) => (
                                 <div key={i}>
                                    <p className="text-2xl md:text-4xl font-black text-slate-900 leading-none tracking-tighter">{w.title}</p>
                                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-tight">{w.desc}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Executive Insight & Leadership */}
                     <div className="space-y-8 md:space-y-10">
                        <div className={`bg-slate-50/50 p-6 md:p-10 rounded-[30px] md:rounded-[45px] border border-slate-100 flex flex-col md:flex-row gap-6 md:gap-8 items-center`}>
                           <div className={`w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center ${brand.primary} shadow-sm shrink-0 border border-slate-100`}>
                              <Lightbulb className="w-6 md:w-7 h-6 md:h-7" />
                           </div>
                           <div className="flex-1 space-y-4 md:space-y-6">
                              <p className="text-sm md:text-base text-slate-600 font-bold leading-relaxed italic border-l-4 border-slate-200 pl-4 md:pl-8">
                                 "{brand.insight || subsidiary.description}"
                              </p>
                              <div className="flex items-center gap-4 pl-4 md:pl-8">
                                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-xl overflow-hidden bg-slate-200">
                                    {leadershipDisplay?.[0]?.image ? (
                                       <img src={leadershipDisplay[0].image} className="w-full h-full object-cover" />
                                    ) : (
                                       <img src={`https://ui-avatars.com/api/?name=${leadershipDisplay?.[0]?.name || subsidiary.name}&background=random`} />
                                    )}
                                 </div>
                                 <div>
                                    <p className="text-[8px] md:text-[10px] font-black text-slate-900 uppercase tracking-tight">{leadershipDisplay?.[0]?.name || 'Managing Director'}</p>
                                    <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{leadershipDisplay?.[0]?.role || 'Business Lead'}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {leadershipDisplay && leadershipDisplay.length > 1 && (
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                              {leadershipDisplay.slice(1).map((leader, i) => (
                                 <div key={i} className="bg-white border border-slate-50 p-4 md:p-6 rounded-[20px] md:rounded-3xl hover:shadow-lg transition-all text-center space-y-2 md:space-y-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                                       {leader.image ? (
                                          <img src={leader.image} className="w-full h-full object-cover" />
                                       ) : (
                                          <Users className="w-5 md:w-6 h-5 md:h-6" />
                                       )}
                                    </div>
                                    <div>
                                       <p className="text-[8px] md:text-[9px] font-black text-slate-900 uppercase leading-tight truncate" title={leader.name}>{leader.name}</p>
                                       <p className="text-[6px] md:text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate" title={leader.role}>{leader.role}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {brand.supplementaryImage && (
                     <div className="group relative pt-6 flex justify-center">
                        <img
                           src={brand.supplementaryImage}
                           alt="Brand Feature"
                           className="w-1/2 max-w-[200px] md:max-w-xs h-auto object-contain transform group-hover:scale-105 transition-transform duration-1000 mix-blend-multiply"
                        />
                     </div>
                  )}

               </div>

               {/* Sidebar */}
               <div className="lg:col-span-4 space-y-6 md:space-y-8">
                  <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[50px] shadow-xl border border-slate-50 space-y-6 md:space-y-10">
                     <h3 className="text-lg md:text-xl font-black text-slate-800">Entity Quick Links</h3>
                     <div className="grid grid-cols-2 gap-4 md:gap-6">
                        {[
                           { name: 'Policies', icon: ShieldCheck },
                           { name: 'Financials', icon: TrendingUp },
                           { name: 'Personnel', icon: Users },
                           { name: 'Global Hub', icon: Globe }
                        ].map((link, i) => (
                           <div key={i} className="flex flex-col items-center gap-2 md:gap-3 group cursor-pointer">
                              <div className={`w-10 h-10 md:w-12 md:h-12 ${brand.light} ${brand.primary} rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:${brand.accent} group-hover:text-white transition-all shadow-sm`}>
                                 <link.icon className="w-5 h-5 text-slate-600" />
                              </div>
                              <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">{link.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Hotels Section - Citrus Specific (Full Width) */}
            {brand.hotels && (
               <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4">
                     <div className={`w-1.5 h-6 md:h-8 ${brand.secondary} rounded-full`} />
                     <h3 className="text-xl md:text-2xl font-black text-slate-800">Our Properties</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                     {brand.hotels.map((hotel, i) => (
                        <a key={i} href={hotel.url} target="_blank" rel="noopener noreferrer"
                           className="group bg-white border border-slate-100 rounded-[24px] md:rounded-[36px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                           <div>
                              <div className="h-48 md:h-56 w-full overflow-hidden relative">
                                 <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                 <div className={`absolute inset-0 bg-gradient-to-tr from-[#f39221]/30 to-transparent`} />
                                 <span className="absolute bottom-3 left-3 text-[8px] font-black text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-widest">{hotel.type}</span>
                              </div>
                              <div className="p-5 md:p-6 space-y-4">
                                 <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-black text-slate-900 text-sm md:text-base leading-tight group-hover:text-[#f39221] transition-colors">{hotel.name}</h4>
                                    <ExternalLink className={`w-4 h-4 ${brand.primary} shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity`} />
                                 </div>
                                 <div className="space-y-2.5">
                                    <div className="flex items-start gap-2.5 text-slate-500">
                                       <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                                       <span className="text-[10px] md:text-xs font-semibold leading-snug">{hotel.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-500">
                                       <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                       <span className="text-[10px] md:text-xs font-semibold">{hotel.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-500">
                                       <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                       <span className="text-[10px] md:text-xs font-semibold">{hotel.email}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </a>
                     ))}
                  </div>
               </div>
            )}

            {/* Dynamic Showcase */}
            <div className="space-y-8 md:space-y-10 pt-8 md:pt-10">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Operational Portfolio</h3>
                  <button className={`text-[9px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[3px] ${brand.primary} hover:translate-x-2 transition-transform w-fit`}>Discover All Units →</button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {(brand.showcase || [1, 2, 3]).map((unit, i) => (
                     <motion.div
                        key={i}
                        whileHover={{ y: -10 }}
                        onClick={() => unit.url && window.open(unit.url, '_blank')}
                        className="group cursor-pointer space-y-4 md:space-y-5"
                     >
                        <div className="relative h-48 md:h-64 rounded-[30px] md:rounded-[45px] overflow-hidden shadow-2xl">
                           <img
                              src={unit.img || subsidiary.cover_image || `/sub_${i + 1}.png`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                           />
                           <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`} />
                           <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                              <p className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest mb-1 md:mb-2">{unit.desc}</p>
                              <h4 className="text-lg md:text-xl font-black text-white leading-tight">{unit.title}</h4>
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default SubsidiaryDetail;
