import React, { useMemo } from 'react';
import { RefreshCw, Droplets, Wind, Thermometer, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────────
   WeatherCard  —  iPhone‑style immersive weather card
   Props:
     weatherData      – { temp, feelsLike, humidity, windspeed, description,
                          code, todayHourly[], forecast[] }
     weatherUpdatedAt – Date | null
     weatherRefreshing – bool
     onRefresh        – () => void
   ───────────────────────────────────────────────────────────────────────────── */

// ── WMO code helpers ─────────────────────────────────────────────────────────
const isSunnyCode   = (c) => [0, 1].includes(c);
const isRainyCode   = (c) => [51,53,55,61,63,65,80,81,82].includes(c);
const isHeavyRain   = (c) => [63,65,81,82].includes(c);
const isStormCode   = (c) => [95,96,99].includes(c);
const isSnowCode    = (c) => [71,73,75,77,85,86].includes(c);
const isFogCode     = (c) => [45,48].includes(c);
const isCloudyCode  = (c) => [2,3].includes(c);
const isPartlyCode  = (c) => [1,2].includes(c);

const getCondition = (code) => {
  if (isSunnyCode(code))  return 'sunny';
  if (isHeavyRain(code))  return 'heavy-rain';
  if (isRainyCode(code))  return 'rain';
  if (isStormCode(code))  return 'storm';
  if (isSnowCode(code))   return 'snow';
  if (isFogCode(code))    return 'fog';
  if (isCloudyCode(code)) return 'cloudy';
  return 'partly-cloudy';
};

// ── Sky gradient per condition ────────────────────────────────────────────────
const SKY = {
  sunny:         { from: '#1e6db5', via: '#3a99f5', to: '#f9a825', label: 'Clear Sky' },
  'partly-cloudy': { from: '#1a4f8a', via: '#2d7dd2', to: '#7eaee0', label: 'Partly Cloudy' },
  cloudy:        { from: '#2c3e50', via: '#495a6d', to: '#6b7f93', label: 'Overcast' },
  fog:           { from: '#3a4454', via: '#6b7d8e', to: '#b0bec5', label: 'Foggy' },
  rain:          { from: '#0d1b2a', via: '#1c3555', to: '#2a4a72', label: 'Rainy' },
  'heavy-rain':  { from: '#060e1a', via: '#0e1f35', to: '#162d4e', label: 'Heavy Rain' },
  storm:         { from: '#0a0614', via: '#1a0f30', to: '#360d6e', label: 'Thunderstorm' },
  snow:          { from: '#e8edf5', via: '#c5d5e8', to: '#a0b8d4', label: 'Snowy' },
};

// ── Period emoji helpers ─────────────────────────────────────────────────────
const getPeriodEmoji = (label) => {
  if (label === 'Morning')   return '🌅';
  if (label === 'Afternoon') return '☀️';
  if (label === 'Evening')   return '🌇';
  if (label === 'Night')     return '🌙';
  return '🌤';
};

const getWeatherEmoji = (code) => {
  if (isSunnyCode(code))  return '☀️';
  if (isHeavyRain(code))  return '🌧';
  if (isRainyCode(code))  return '🌦';
  if (isStormCode(code))  return '⛈';
  if (isSnowCode(code))   return '❄️';
  if (isFogCode(code))    return '🌫';
  if (isCloudyCode(code)) return '☁️';
  return '⛅';
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑component: animated sky scenes
// ─────────────────────────────────────────────────────────────────────────────

/* Sun scene — animated sun disc + rotating rays */
const SunScene = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
    {/* Horizon glow */}
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, height:'45%',
      background:'linear-gradient(to top, rgba(255,180,0,0.28), transparent)',
    }}/>
    {/* Atmosphere haze */}
    <div style={{
      position:'absolute', top:0, left:0, right:0, height:'60%',
      background:'linear-gradient(to bottom, rgba(30,109,181,0.55), transparent)',
    }}/>
    {/* Sun disc + halo */}
    <div style={{
      position:'absolute', top:'12%', right:'12%',
      width:88, height:88,
      borderRadius:'50%',
      background:'radial-gradient(circle, #ffe082 0%, #ffc107 55%, rgba(255,193,7,0) 100%)',
      boxShadow:'0 0 60px 28px rgba(255,200,0,0.45), 0 0 100px 50px rgba(255,160,0,0.22)',
      animation: 'ws-sun-pulse 6s ease-in-out infinite',
    }}/>
    {/* Rotating ray disc */}
    <div style={{
      position:'absolute', top: '-2%', right:'-4%',
      width:340, height:340,
      background:'repeating-conic-gradient(from 0deg, rgba(255,220,60,0.11) 0deg 12deg, transparent 12deg 24deg)',
      borderRadius:'50%',
      animation:'ws-spin-rays 40s linear infinite',
    }}/>
    {/* Lens flare dot */}
    <div style={{
      position:'absolute', top:'18%', right:'30%',
      width:12, height:12, borderRadius:'50%',
      background:'rgba(255,255,200,0.55)',
      filter:'blur(3px)',
      animation:'ws-flare 5s ease-in-out infinite',
    }}/>
    {/* Light beam sweeps */}
    {[...Array(5)].map((_,i)=>(
      <div key={i} style={{
        position:'absolute', top:0, right: `${14+i*7}%`,
        width:2, height:'50%',
        background:`linear-gradient(to bottom, rgba(255,230,100,${0.10-i*0.015}), transparent)`,
        transform:`rotate(${-15+i*4}deg)`,
        transformOrigin:'top center',
        animation:`ws-beam 7s ease-in-out ${i*1.4}s infinite`,
      }}/>
    ))}
  </div>
);

/* Cloud scene — realistic fluffy cumulus silhouettes */
// A proper puffy cloud path (single cloud, viewBox 0 0 200 80)
const CloudPath = ({ fill, fillOpacity }) => (
  <path
    fillOpacity={fillOpacity}
    fill={fill}
    d="
      M160,62
      C160,62 170,62 174,55
      C178,48 174,40 166,39
      C167,35 165,29 158,27
      C152,18 140,18 134,24
      C129,16 118,13 108,18
      C100,10  86,11  81,20
      C72,17  60,22  59,32
      C51,32  44,39  46,47
      C44,56  50,62  60,62
      Z
    "
  />
);

const CloudScene = ({ condition }) => {
  const isDark = condition === 'cloudy';

  // Fluffy cloud layers — positioned naturally across the card
  const clouds = isDark
    ? [
        { w:240, h:96,  top:'4%',  left:'-4%',  dur:24, delay:0,   op:0.72, fill:'#c8d4de' },
        { w:200, h:80,  top:'28%', left:'25%',  dur:30, delay:5,   op:0.60, fill:'#b8c8d6' },
        { w:180, h:72,  top:'12%', left:'58%',  dur:20, delay:9,   op:0.50, fill:'#d0dce6' },
        { w:260, h:104, top:'52%', left:'-8%',  dur:36, delay:2,   op:0.40, fill:'#a8bac8' },
        { w:160, h:64,  top:'62%', left:'55%',  dur:26, delay:12,  op:0.35, fill:'#bccad8' },
      ]
    : [
        { w:200, h:80,  top:'5%',  left:'-2%',  dur:26, delay:0,   op:0.52, fill:'#e8f4fd' },
        { w:160, h:64,  top:'30%', left:'28%',  dur:32, delay:4,   op:0.40, fill:'#daeef9' },
        { w:220, h:88,  top:'10%', left:'60%',  dur:22, delay:8,   op:0.36, fill:'#f0f8ff' },
        { w:180, h:72,  top:'55%', left:'-6%',  dur:38, delay:3,   op:0.28, fill:'#d8ecf8' },
      ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Sky depth overlay */}
      <div style={{
        position:'absolute', inset:0,
        background: isDark
          ? 'linear-gradient(180deg,rgba(36,50,62,0.55) 0%,rgba(60,78,94,0.30) 100%)'
          : 'linear-gradient(180deg,rgba(20,68,130,0.35) 0%,rgba(40,110,190,0.15) 100%)',
      }}/>

      {/* Fluffy clouds */}
      {clouds.map((c, i) => (
        <svg
          key={i}
          style={{
            position:'absolute', top:c.top, left:c.left,
            width:c.w, height:c.h,
            overflow:'visible',
            animation:`ws-cloud-drift-${(i % 3) + 1} ${c.dur}s ease-in-out ${c.delay}s infinite`,
            filter: isDark
              ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.22))'
              : 'drop-shadow(0 4px 12px rgba(100,160,220,0.18))',
          }}
          viewBox="0 0 200 80"
        >
          <CloudPath fill={c.fill} fillOpacity={c.op} />
        </svg>
      ))}

      {/* Subtle bottom haze for depth */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'30%',
        background: isDark
          ? 'linear-gradient(to top, rgba(44,62,80,0.35), transparent)'
          : 'linear-gradient(to top, rgba(26,79,138,0.15), transparent)',
      }}/>
    </div>
  );
};

/* Rain scene — streaking drops with optional heavy mode */
const RainScene = ({ heavy }) => {
  const dropCount = heavy ? 30 : 18;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Dark rain sky */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(to bottom, rgba(6,14,26,0.7), rgba(18,36,60,0.5))',
      }}/>
      {/* Distant backdrop rain layer */}
      {[...Array(Math.floor(dropCount/2))].map((_,i)=>(
        <div key={`bg-${i}`} style={{
          position:'absolute',
          left:`${(i*(100/Math.floor(dropCount/2)))+1}%`,
          top:-18, width:1, height:16,
          borderRadius:2,
          background:'linear-gradient(to bottom, rgba(150,210,255,0.30), transparent)',
          transform:'rotate(18deg)',
          animation:`ws-rain ${(1.8+Math.random()*0.8).toFixed(2)}s linear ${(Math.random()*1.8).toFixed(2)}s infinite`,
        }}/>
      ))}
      {/* Foreground drops */}
      {[...Array(dropCount)].map((_,i)=>(
        <div key={i} style={{
          position:'absolute',
          left:`${(i*(100/dropCount))+Math.random()*3}%`,
          top:-24, width: heavy ? 2 : 1.5,
          height: heavy ? 28 : 20,
          borderRadius:3,
          background:`linear-gradient(to bottom, rgba(140,210,255,${heavy?0.85:0.75}), rgba(100,180,255,0.2), transparent)`,
          transform:'rotate(16deg)',
          animation:`ws-rain ${(0.8+Math.random()*0.5).toFixed(2)}s linear ${(Math.random()*1.2).toFixed(2)}s infinite`,
        }}/>
      ))}
      {/* Puddle ripple at bottom */}
      {heavy && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:40,
          background:'linear-gradient(to top, rgba(100,160,255,0.15), transparent)',
        }}/>
      )}
    </div>
  );
};

/* Storm / Thunder scene — rain + lightning flash */
const StormScene = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
    {/* Deep storm sky */}
    <div style={{
      position:'absolute', inset:0,
      background:'linear-gradient(to bottom, rgba(10,6,20,0.85), rgba(26,15,48,0.6))',
    }}/>
    {/* Heavy rain in storm */}
    {[...Array(28)].map((_,i)=>(
      <div key={i} style={{
        position:'absolute',
        left:`${(i*3.7)+Math.random()*2}%`, top:-22,
        width:1.5, height:24,
        borderRadius:2,
        background:`linear-gradient(to bottom, rgba(160,210,255,0.80), transparent)`,
        transform:'rotate(18deg)',
        animation:`ws-rain ${(0.75+Math.random()*0.4).toFixed(2)}s linear ${(Math.random()*1.0).toFixed(2)}s infinite`,
      }}/>
    ))}
    {/* Lightning bolts */}
    <svg style={{
      position:'absolute', top:'5%', left:'15%', width:60, height:130,
      animation:'ws-lightning-bolt 6s ease-in-out 0s infinite', opacity:0,
      filter:'drop-shadow(0 0 8px #c0a0ff)',
    }} viewBox="0 0 40 120">
      <polyline points="30,0 14,55 26,55 10,120" fill="none" stroke="#d8b4fe" strokeWidth="3" strokeLinejoin="round"/>
    </svg>
    <svg style={{
      position:'absolute', top:'3%', right:'18%', width:45, height:100,
      animation:'ws-lightning-bolt 6s ease-in-out 2.5s infinite', opacity:0,
      filter:'drop-shadow(0 0 6px #a78bfa)',
    }} viewBox="0 0 40 120">
      <polyline points="28,0 12,50 22,50 8,120" fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeLinejoin="round"/>
    </svg>
    {/* Full-screen flash */}
    <div style={{
      position:'absolute', inset:0,
      background:'rgba(220,200,255,0.18)',
      animation:'ws-lightning-flash 6s ease-in-out 0s infinite',
    }}/>
    <div style={{
      position:'absolute', inset:0,
      background:'rgba(200,180,255,0.12)',
      animation:'ws-lightning-flash 6s ease-in-out 2.5s infinite',
    }}/>
  </div>
);

/* Snow scene — falling snowflakes */
const SnowScene = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
    <div style={{
      position:'absolute', inset:0,
      background:'linear-gradient(to bottom, rgba(232,237,245,0.4), rgba(197,213,232,0.2))',
    }}/>
    {[...Array(22)].map((_,i)=>(
      <div key={i} style={{
        position:'absolute',
        left:`${(i*4.6)+Math.random()*3}%`,
        top:-16,
        width: 4+Math.random()*5,
        height: 4+Math.random()*5,
        borderRadius:'50%',
        background:`rgba(255,255,255,${0.7+Math.random()*0.3})`,
        boxShadow:'0 0 4px rgba(255,255,255,0.8)',
        animation:`ws-snow ${(3+Math.random()*2.5).toFixed(2)}s linear ${(Math.random()*3).toFixed(2)}s infinite`,
      }}/>
    ))}
  </div>
);

/* Fog scene — slow drifting mist layers */
const FogScene = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
    {[0,1,2,3].map(i=>(
      <div key={i} style={{
        position:'absolute',
        left:'-20%', right:'-20%',
        height: 55+i*18,
        top: `${15+i*18}%`,
        background:`linear-gradient(to right, transparent, rgba(176,190,197,${0.28-i*0.04}), transparent)`,
        borderRadius:'50%',
        animation:`ws-fog-drift ${12+i*6}s ease-in-out ${i*2}s infinite alternate`,
        filter:'blur(12px)',
      }}/>
    ))}
    {/* Ambient haze */}
    <div style={{
      position:'absolute', inset:0,
      background:'rgba(176,190,197,0.18)',
    }}/>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CSS keyframes injected once
// ─────────────────────────────────────────────────────────────────────────────
const WEATHER_STYLES = `
  @keyframes ws-sun-pulse {
    0%,100% { transform:scale(1); opacity:1; box-shadow:0 0 60px 28px rgba(255,200,0,0.45),0 0 100px 50px rgba(255,160,0,0.22); }
    50%      { transform:scale(1.08); opacity:0.92; box-shadow:0 0 80px 38px rgba(255,220,0,0.55),0 0 130px 65px rgba(255,180,0,0.28); }
  }
  @keyframes ws-spin-rays  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ws-flare {
    0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.5)}
  }
  @keyframes ws-beam {
    0%,100%{opacity:0.4;transform:scaleY(1) rotate(var(--r,0deg))}
    50%{opacity:0.8;transform:scaleY(1.15) rotate(var(--r,0deg))}
  }
  @keyframes ws-rain {
    0%   { transform:translateY(-30px) rotate(16deg); opacity:0; }
    8%   { opacity:1; }
    92%  { opacity:1; }
    100% { transform:translateY(115vh) translateX(45px) rotate(16deg); opacity:0; }
  }
  @keyframes ws-cloud-drift-1 {
    0%,100%{transform:translateX(0) translateY(0) scale(1)}
    50%{transform:translateX(28px) translateY(-8px) scale(1.03)}
  }
  @keyframes ws-cloud-drift-2 {
    0%,100%{transform:translateX(0) translateY(0) scale(1.02)}
    50%{transform:translateX(-32px) translateY(10px) scale(0.97)}
  }
  @keyframes ws-cloud-drift-3 {
    0%,100%{transform:translateX(0) translateY(0) scale(0.98)}
    50%{transform:translateX(22px) translateY(-12px) scale(1.04)}
  }
  @keyframes ws-lightning-bolt {
    0%,88%,100%{opacity:0} 90%,94%{opacity:1} 92%,96%{opacity:0.3}
  }
  @keyframes ws-lightning-flash {
    0%,88%,100%{opacity:0} 90%,94%{opacity:1} 92%,96%{opacity:0.3}
  }
  @keyframes ws-snow {
    0%   { transform:translateY(-20px) translateX(0); opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:0.8; }
    100% { transform:translateY(115vh) translateX(25px); opacity:0; }
  }
  @keyframes ws-fog-drift {
    0%   { transform:translateX(-15%) scaleY(1); }
    100% { transform:translateX(15%) scaleY(1.1); }
  }
  /* Shimmer line on card */
  @keyframes ws-shimmer {
    0%   { transform:translateX(-100%) skewX(-15deg); }
    100% { transform:translateX(400%) skewX(-15deg); }
  }
  /* Frost particle for snow text */
  @keyframes ws-frost {
    0%,100%{opacity:0.6} 50%{opacity:1}
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Forecast day icon (text emoji)
// ─────────────────────────────────────────────────────────────────────────────
const ForecastIcon = ({ code, size = 18 }) => (
  <span style={{ fontSize: size, lineHeight: 1 }}>{getWeatherEmoji(code)}</span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main WeatherCard component
// ─────────────────────────────────────────────────────────────────────────────
const WeatherCard = ({
  weatherData,
  weatherUpdatedAt,
  weatherRefreshing,
  onRefresh,
  compact = false,
}) => {
  const condition = getCondition(weatherData.code);
  const sky = SKY[condition] || SKY['partly-cloudy'];

  const isSnow  = condition === 'snow';
  const textColorClass = isSnow ? 'text-slate-800' : 'text-white';
  const subTextClass   = isSnow ? 'text-slate-600' : 'text-white/70';
  const cardBorderCol  = isSnow ? 'rgba(200,215,230,0.5)' : 'rgba(255,255,255,0.14)';

  const updatedStr = weatherUpdatedAt
    ? weatherUpdatedAt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true })
    : null;

  /* Derive gradient string */
  const bgStyle = useMemo(() => ({
    background: `linear-gradient(160deg, ${sky.from} 0%, ${sky.via} 55%, ${sky.to} 100%)`,
  }), [sky]);

  const weatherScene = (
    <>
      {condition === 'sunny' && <SunScene />}
      {condition === 'partly-cloudy' && (
        <>
          <SunScene />
          <CloudScene condition="partly-cloudy" />
        </>
      )}
      {condition === 'cloudy' && <CloudScene condition="cloudy" />}
      {condition === 'fog' && <FogScene />}
      {condition === 'rain' && <RainScene heavy={false} />}
      {condition === 'heavy-rain' && <RainScene heavy />}
      {condition === 'storm' && <StormScene />}
      {condition === 'snow' && <SnowScene />}
    </>
  );

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          ...bgStyle,
          minHeight: 224,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 18,
          border: `1px solid ${cardBorderCol}`,
          boxShadow: '0 16px 38px rgba(15,23,42,0.22)',
        }}
      >
        <style>{WEATHER_STYLES}</style>
        {weatherScene}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(125deg,rgba(3,12,28,.35),transparent 62%)', zIndex:2 }} />

        <div style={{ position:'relative', zIndex:10, padding:16, height:'100%', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.16em', textTransform:'uppercase', color:isSnow ? '#334155' : 'rgba(255,255,255,.82)' }}>
                Colombo · Live
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, fontSize:9, fontWeight:800, color:isSnow ? '#64748b' : 'rgba(255,255,255,.56)' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 8px #34d399', animation:'ws-frost 1.8s ease-in-out infinite' }} />
                Updates every 5 min
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={weatherRefreshing}
              aria-label="Refresh live weather"
              title={updatedStr ? `Updated ${updatedStr}` : 'Refresh weather'}
              style={{ width:32, height:32, display:'grid', placeItems:'center', borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', color:isSnow ? '#334155' : '#fff', backdropFilter:'blur(10px)', cursor:'pointer' }}
            >
              <RefreshCw size={13} style={{ animation: weatherRefreshing ? 'ws-spin-rays 1s linear infinite' : 'none' }} />
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginTop:13 }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
              <span style={{ fontSize:52, lineHeight:.82, fontWeight:900, letterSpacing:'-.05em', color:isSnow ? '#1e293b' : '#fff', textShadow:isSnow ? 'none' : '0 6px 22px rgba(0,0,0,.28)' }}>
                {weatherData.temp}°
              </span>
              <div style={{ paddingBottom:1 }}>
                <div style={{ maxWidth:110, fontSize:13, lineHeight:1.15, fontWeight:850, color:isSnow ? '#1e293b' : '#fff' }}>{weatherData.description || sky.label}</div>
                <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:5, fontSize:9, fontWeight:700, color:isSnow ? '#64748b' : 'rgba(255,255,255,.65)' }}><Thermometer size={10} />Feels {weatherData.feelsLike}°</div>
              </div>
            </div>
            <div style={{ display:'grid', gap:5, minWidth:92 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'6px 8px', borderRadius:10, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.13)', color:isSnow ? '#334155' : '#fff', backdropFilter:'blur(10px)' }}><Droplets size={12} color="#38bdf8" /><span style={{ fontSize:10, fontWeight:900 }}>{weatherData.humidity}%</span></div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'6px 8px', borderRadius:10, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.13)', color:isSnow ? '#334155' : '#fff', backdropFilter:'blur(10px)' }}><Wind size={12} color="#34d399" /><span style={{ fontSize:10, fontWeight:900 }}>{weatherData.windspeed} km/h</span></div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:5, marginTop:'auto', paddingTop:13 }}>
            {(weatherData.forecast || []).slice(0, 3).map((day, i) => (
              <div key={`${day.day}-${i}`} style={{ padding:'7px 7px 6px', borderRadius:10, background:'rgba(255,255,255,.09)', border:'1px solid rgba(255,255,255,.12)', backdropFilter:'blur(10px)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}><span style={{ fontSize:9, fontWeight:850, color:isSnow ? '#334155' : 'rgba(255,255,255,.8)' }}>{day.day}</span><ForecastIcon code={day.code} size={13} /></div>
                <div style={{ marginTop:4, fontSize:10, fontWeight:900, color:isSnow ? '#1e293b' : '#fff' }}>{day.tempMax}° <span style={{ color:isSnow ? '#64748b' : 'rgba(255,255,255,.5)' }}>{day.tempMin}°</span></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        ...bgStyle,
        borderRadius: 22,
        position: 'relative',
        overflow: 'hidden',
        border: `1.5px solid ${cardBorderCol}`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.25)',
        minHeight: 340,
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 1.2s ease',
      }}
    >
      {/* ── Inject keyframes once ───────────────────────────────────────── */}
      <style>{WEATHER_STYLES}</style>

      {/* ── Live animated sky scene ──────────────────────────────────────── */}
      {condition === 'sunny'       && <SunScene />}
      {condition === 'partly-cloudy' && (
        <>
          <SunScene />
          <CloudScene condition="partly-cloudy" />
        </>
      )}
      {condition === 'cloudy'      && <CloudScene condition="cloudy" />}
      {condition === 'fog'         && <FogScene />}
      {condition === 'rain'        && <RainScene heavy={false} />}
      {condition === 'heavy-rain'  && <RainScene heavy />}
      {condition === 'storm'       && <StormScene />}
      {condition === 'snow'        && <SnowScene />}

      {/* ── Glassmorphic shimmer border highlight ───────────────────────── */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:1,
        background:'linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)',
        zIndex:5,
      }}/>
      {/* Shimmer sweep animation */}
      <div style={{
        position:'absolute', top:0, left:0, bottom:0, width:'40%',
        background:'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)',
        zIndex:5, animation:'ws-shimmer 8s ease-in-out infinite',
        pointerEvents:'none',
      }}/>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:10, padding:'18px 18px 15px', display:'flex', flexDirection:'column', flex:1 }}>

        {/* ── HEADER: location + refresh ─────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontSize:11, color: isSnow ? 'rgba(30,40,60,0.7)' : 'rgba(255,255,255,0.7)', fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase' }}>
                📍 Colombo, Sri Lanka
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color: isSnow ? 'rgba(30,40,60,0.5)' : 'rgba(255,255,255,0.5)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                Live Weather
              </span>
              {/* Live dot */}
              <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                <span style={{
                  width:6, height:6, borderRadius:'50%',
                  background: condition === 'sunny' ? '#ffc107' : condition === 'storm' ? '#a78bfa' : '#34d399',
                  boxShadow: `0 0 6px 2px ${condition === 'sunny' ? '#ffc10788' : condition === 'storm' ? '#a78bfa88' : '#34d39988'}`,
                  display:'inline-block', animation:'ws-frost 1.8s ease-in-out infinite',
                }}/>
              </span>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={weatherRefreshing}
            title="Refresh weather"
            style={{
              background:'rgba(255,255,255,0.12)',
              border:'1px solid rgba(255,255,255,0.22)',
              borderRadius:12, padding:'7px 8px',
              cursor:'pointer', display:'flex', alignItems:'center', gap:5,
              backdropFilter:'blur(8px)',
              color: isSnow ? 'rgba(30,40,60,0.7)' : 'rgba(255,255,255,0.85)',
              transition:'all 0.2s',
            }}
          >
            <RefreshCw size={13} style={{ animation: weatherRefreshing ? 'ws-spin-rays 1s linear infinite' : 'none' }} />
            {updatedStr && (
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                {updatedStr}
              </span>
            )}
          </button>
        </div>

        {/* ── MAIN TEMP + CONDITION ──────────────────────────────────── */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
            {/* Big temperature */}
            <span style={{
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              color: isSnow ? '#1e2d3d' : '#ffffff',
              textShadow: isSnow ? 'none' : '0 2px 24px rgba(0,0,0,0.4)',
              fontVariantNumeric:'tabular-nums',
              userSelect:'none',
            }}>
              {weatherData.temp}°
            </span>
            <div style={{ paddingBottom: 8 }}>
              {/* Condition label */}
              <div style={{
                fontSize:16, fontWeight:800,
                color: isSnow ? '#1e2d3d' : '#ffffff',
                textShadow: isSnow ? 'none' : '0 1px 10px rgba(0,0,0,0.35)',
                lineHeight:1.2, marginBottom:4,
              }}>
                {weatherData.description || sky.label}
              </div>
              {/* Feels like */}
              <div style={{ fontSize:11, fontWeight:700, color: isSnow ? 'rgba(30,45,61,0.6)' : 'rgba(255,255,255,0.65)', display:'flex', alignItems:'center', gap:4 }}>
                <Thermometer size={11} />
                Feels like {weatherData.feelsLike}°C
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT PILLS: Humidity + Wind ────────────────────────────── */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[
            { icon: <Droplets size={14}/>,  label:'Humidity',   val:`${weatherData.humidity}%`,      accent:'rgba(56,189,248,0.8)' },
            { icon: <Wind size={14}/>,       label:'Wind',       val:`${weatherData.windspeed} km/h`, accent:'rgba(52,211,153,0.8)' },
          ].map(({ icon, label, val, accent }) => (
            <div key={label} style={{
              flex:1, display:'flex', alignItems:'center', gap:9,
              background:'rgba(255,255,255,0.10)',
              border:'1px solid rgba(255,255,255,0.16)',
              borderRadius:13, padding:'8px 11px',
              backdropFilter:'blur(12px)',
            }}>
              <span style={{ color: isSnow ? '#2563eb' : accent }}>{icon}</span>
              <div>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color: isSnow ? 'rgba(30,40,60,0.55)' : 'rgba(255,255,255,0.55)', lineHeight:1 }}>
                  {label}
                </div>
                <div style={{ fontSize:14, fontWeight:900, color: isSnow ? '#1e2d3d' : '#ffffff', lineHeight:1.4 }}>
                  {val}
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* ── 3-DAY FORECAST STRIP ───────────────────────────────────── */}
        <div style={{
          background:'rgba(255,255,255,0.08)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:16,
          backdropFilter:'blur(14px)',
          padding:'10px 12px',
          marginTop:'auto',
        }}>
          <div style={{ fontSize:9, fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', color: isSnow ? 'rgba(30,40,60,0.5)' : 'rgba(255,255,255,0.45)', marginBottom:8 }}>
            3-Day Outlook
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {weatherData.forecast.map((day, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                {/* Day name */}
                <span style={{ fontSize:12, fontWeight:800, width:56, color: isSnow ? '#1e2d3d' : '#ffffff', letterSpacing:'0.04em' }}>
                  {day.day}
                </span>
                {/* Description + icon */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, justifyContent:'center' }}>
                  <ForecastIcon code={day.code} size={16} />
                  <span style={{ fontSize:10, fontWeight:700, color: isSnow ? 'rgba(30,40,60,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    {day.description}
                  </span>
                </div>
                {/* Temp range */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:900, color:'#fbbf24' }}>{day.tempMax}°</span>
                  <span style={{ fontSize:10, fontWeight:700, color: isSnow ? 'rgba(30,40,60,0.5)' : 'rgba(255,255,255,0.45)' }}>/</span>
                  <span style={{ fontSize:12, fontWeight:900, color: isSnow ? 'rgba(30,40,60,0.6)' : 'rgba(180,210,255,0.85)' }}>{day.tempMin}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default WeatherCard;
