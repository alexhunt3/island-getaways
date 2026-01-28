import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Checking beach forecasts...",
  "Scanning Caribbean islands...",
  "Finding the sunniest spots...",
  "Checking water temperatures...",
  "Analyzing weather patterns...",
  "Searching for flight deals...",
  "Rating beach conditions...",
  "Paradise almost found..."
];

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <svg viewBox="0 0 800 500" className="beach-scene">
        {/* Gradients */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fefce8" />
            <stop offset="50%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="800" height="300" fill="url(#skyGradient)" />

        {/* Sun */}
        <g className="sun">
          <circle cx="650" cy="80" r="50" fill="#fcd34d" />
          <circle cx="650" cy="80" r="60" fill="#fcd34d" opacity="0.3" />
          <circle cx="650" cy="80" r="70" fill="#fcd34d" opacity="0.15" />
        </g>

        {/* Clouds */}
        <g className="cloud cloud-1">
          <ellipse cx="150" cy="60" rx="40" ry="20" fill="white" opacity="0.8" />
          <ellipse cx="180" cy="55" rx="30" ry="18" fill="white" opacity="0.8" />
          <ellipse cx="200" cy="65" rx="35" ry="15" fill="white" opacity="0.8" />
        </g>
        <g className="cloud cloud-2">
          <ellipse cx="450" cy="90" rx="35" ry="18" fill="white" opacity="0.6" />
          <ellipse cx="480" cy="85" rx="28" ry="15" fill="white" opacity="0.6" />
          <ellipse cx="500" cy="92" rx="30" ry="14" fill="white" opacity="0.6" />
        </g>

        {/* Ocean */}
        <rect x="0" y="280" width="800" height="120" fill="url(#oceanGradient)" />

        {/* Sailboat - positioned IN the water */}
        <g className="sailboat">
          <path d="M380,300 L400,240 L400,300 Z" fill="white" />
          <path d="M400,250 L400,300 L440,300 Z" fill="#f1f5f9" />
          <path d="M360,300 L440,300 L430,315 L370,315 Z" fill="#1e3a5f" />
          <line x1="400" y1="240" x2="400" y2="315" stroke="#78716c" strokeWidth="2" />
        </g>

        {/* Waves */}
        <path
          className="wave wave-1"
          d="M0,320 Q100,300 200,320 T400,320 T600,320 T800,320 L800,370 L0,370 Z"
          fill="#0ea5e9"
          opacity="0.5"
        />
        <path
          className="wave wave-2"
          d="M0,330 Q100,310 200,330 T400,330 T600,330 T800,330 L800,380 L0,380 Z"
          fill="#38bdf8"
          opacity="0.4"
        />
        <path
          className="wave wave-3"
          d="M0,340 Q100,325 200,340 T400,340 T600,340 T800,340 L800,390 L0,390 Z"
          fill="#7dd3fc"
          opacity="0.3"
        />

        {/* Beach/Sand - white sand */}
        <ellipse cx="400" cy="520" rx="500" ry="160" fill="url(#sandGradient)" />

        {/* Palm Tree 1 (left) */}
        <g className="palm-tree palm-1">
          <path d="M120,350 Q115,420 130,480" stroke="#92400e" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-1" d="M120,350 Q80,320 40,340" stroke="#22c55e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-2" d="M120,350 Q90,300 60,290" stroke="#22c55e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-3" d="M120,350 Q130,300 140,280" stroke="#16a34a" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-4" d="M120,350 Q160,310 200,320" stroke="#22c55e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-5" d="M120,350 Q170,330 210,350" stroke="#16a34a" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="118" cy="358" r="6" fill="#92400e" />
          <circle cx="128" cy="355" r="5" fill="#a16207" />
        </g>

        {/* Palm Tree 2 (right) */}
        <g className="palm-tree palm-2">
          <path d="M700,360 Q710,420 690,480" stroke="#92400e" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-1" d="M700,360 Q660,330 620,350" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-2" d="M700,360 Q680,310 660,300" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-3" d="M700,360 Q720,310 740,300" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path className="palm-leaf leaf-4" d="M700,360 Q750,340 780,360" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>

        {/* Beach umbrella */}
        <g className="umbrella">
          <line x1="550" y1="380" x2="550" y2="450" stroke="#a16207" strokeWidth="4" />
          <path d="M500,380 Q550,350 600,380" fill="#ef4444" />
          <path d="M500,380 Q525,365 550,380" fill="#fbbf24" />
          <path d="M550,380 Q575,365 600,380" fill="#ef4444" />
        </g>

        {/* Beach towel */}
        <ellipse cx="580" cy="440" rx="40" ry="15" fill="#3b82f6" opacity="0.8" />

        {/* Person lying on towel */}
        <g className="beach-person-lying">
          <ellipse cx="580" cy="432" rx="8" ry="6" fill="#d4a574" /> {/* head */}
          <ellipse cx="580" cy="445" rx="12" ry="8" fill="#ec4899" /> {/* body/swimsuit */}
        </g>

        {/* Person walking on beach */}
        <g className="beach-walker">
          <circle cx="320" cy="420" r="6" fill="#d4a574" /> {/* head */}
          <ellipse cx="320" cy="435" rx="5" ry="10" fill="#06b6d4" /> {/* body */}
          <line x1="318" y1="445" x2="315" y2="458" stroke="#d4a574" strokeWidth="2" /> {/* leg */}
          <line x1="322" y1="445" x2="326" y2="458" stroke="#d4a574" strokeWidth="2" /> {/* leg */}
        </g>

        {/* Beach ball */}
        <g className="beach-ball">
          <circle cx="450" cy="430" r="12" fill="#fbbf24" />
          <path d="M450,418 Q462,430 450,442" fill="#ef4444" />
          <path d="M450,418 Q438,430 450,442" fill="#3b82f6" />
        </g>

        {/* Sandcastle */}
        <g className="sandcastle">
          <rect x="240" y="445" width="30" height="20" fill="#fde68a" />
          <rect x="245" y="435" width="8" height="10" fill="#fde68a" />
          <rect x="257" y="435" width="8" height="10" fill="#fde68a" />
          <polygon points="249,435 245,425 253,425" fill="#fde68a" />
          <polygon points="261,435 257,425 265,425" fill="#fde68a" />
        </g>

        {/* Seagulls */}
        <g className="seagull seagull-1">
          <path d="M250,120 Q260,110 270,120" stroke="#64748b" strokeWidth="2" fill="none" />
        </g>
        <g className="seagull seagull-2">
          <path d="M300,100 Q308,92 316,100" stroke="#64748b" strokeWidth="2" fill="none" />
        </g>
        <g className="seagull seagull-3">
          <path d="M280,140 Q286,134 292,140" stroke="#64748b" strokeWidth="1.5" fill="none" />
        </g>
      </svg>

      <div className="loading-text">
        <p>{LOADING_MESSAGES[messageIndex]}</p>
      </div>
    </div>
  );
}
