import { cn } from "@/lib/utils";

interface ObelixiaLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  variant?: "full" | "icon" | "text";
  animated?: boolean;
  className?: string;
  dark?: boolean;
}

/**
 * ObelixIA Cinematic Logo - Ultra Luxury Brand Identity
 * Features: Spectacular infinity symbol with sparkles, dual gradient text
 */
export function ObelixiaLogo({ 
  size = "md", 
  variant = "full",
  animated = true,
  className,
  dark = true
}: ObelixiaLogoProps) {
  const sizeClasses = {
    sm: { container: "h-8", text: "text-xl", iconW: 32, iconH: 20, sparkles: 3 },
    md: { container: "h-12", text: "text-3xl", iconW: 48, iconH: 30, sparkles: 5 },
    lg: { container: "h-16", text: "text-5xl", iconW: 64, iconH: 40, sparkles: 6 },
    xl: { container: "h-24", text: "text-7xl", iconW: 96, iconH: 60, sparkles: 8 },
    hero: { container: "h-32", text: "text-8xl md:text-9xl", iconW: 140, iconH: 85, sparkles: 12 },
  };

  const currentSize = sizeClasses[size];

  // AI Brain Icon with Neural Network Connections
  const CinematicBrainIcon = () => {
    // Neural network nodes positions for AI brain effect
    const neuralNodes = [
      // Core processing nodes (center)
      { cx: 50, cy: 35, layer: 'core' },
      { cx: 50, cy: 55, layer: 'core' },
      { cx: 50, cy: 75, layer: 'core' },
      // Left hemisphere nodes
      { cx: 25, cy: 30, layer: 'left' },
      { cx: 20, cy: 50, layer: 'left' },
      { cx: 25, cy: 70, layer: 'left' },
      { cx: 30, cy: 90, layer: 'left' },
      { cx: 35, cy: 45, layer: 'left' },
      { cx: 30, cy: 60, layer: 'left' },
      // Right hemisphere nodes
      { cx: 75, cy: 30, layer: 'right' },
      { cx: 80, cy: 50, layer: 'right' },
      { cx: 75, cy: 70, layer: 'right' },
      { cx: 70, cy: 90, layer: 'right' },
      { cx: 65, cy: 45, layer: 'right' },
      { cx: 70, cy: 60, layer: 'right' },
      // Deep nodes
      { cx: 40, cy: 25, layer: 'deep' },
      { cx: 60, cy: 25, layer: 'deep' },
      { cx: 45, cy: 85, layer: 'deep' },
      { cx: 55, cy: 85, layer: 'deep' },
    ];

    // Neural connections between nodes
    const connections = [
      // Core spine
      [0, 1], [1, 2],
      // Left connections
      [3, 7], [7, 4], [4, 8], [8, 5], [5, 6],
      [0, 3], [1, 4], [2, 5],
      [7, 0], [8, 1],
      // Right connections  
      [9, 13], [13, 10], [10, 14], [14, 11], [11, 12],
      [0, 9], [1, 10], [2, 11],
      [13, 0], [14, 1],
      // Cross connections
      [15, 0], [16, 0], [17, 2], [18, 2],
      [3, 15], [9, 16], [6, 17], [12, 18],
    ];

    return (
      <div className="relative" style={{ width: currentSize.iconW, height: currentSize.iconH }}>
        {/* Outer Glow Layer */}
        <div 
          className="absolute inset-[-50%] blur-2xl opacity-60"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.5) 0%, rgba(16,185,129,0.3) 40%, transparent 70%)',
          }}
        />
        
        <svg 
          viewBox="0 0 100 120" 
          className="relative w-full h-full"
          style={{ filter: 'drop-shadow(0 0 25px rgba(6,182,212,0.6)) drop-shadow(0 0 50px rgba(16,185,129,0.4))' }}
        >
          <defs>
            {/* Main Gradient - Flowing Blue to Green */}
            <linearGradient id={`brain-main-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9">
                {animated && <animate attributeName="stop-color" values="#0ea5e9;#10b981;#06b6d4;#0ea5e9" dur="5s" repeatCount="indefinite" />}
              </stop>
              <stop offset="50%" stopColor="#10b981">
                {animated && <animate attributeName="stop-color" values="#10b981;#06b6d4;#0ea5e9;#10b981" dur="5s" repeatCount="indefinite" />}
              </stop>
              <stop offset="100%" stopColor="#06b6d4">
                {animated && <animate attributeName="stop-color" values="#06b6d4;#0ea5e9;#10b981;#06b6d4" dur="5s" repeatCount="indefinite" />}
              </stop>
            </linearGradient>
            
            {/* Glow Filter */}
            <filter id={`brain-glow-${size}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur1"/>
              <feGaussianBlur stdDeviation="6" result="blur2"/>
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Node Glow Filter */}
            <filter id={`node-glow-${size}`} x="-300%" y="-300%" width="700%" height="700%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* AI Brain Outline - Stylized circuit brain shape */}
          <path
            d="M50 8 
               C28 8, 12 24, 12 45
               C12 58, 18 68, 22 75
               C16 78, 10 84, 10 92
               C10 104, 24 112, 42 112
               L58 112
               C76 112, 90 104, 90 92
               C90 84, 84 78, 78 75
               C82 68, 88 58, 88 45
               C88 24, 72 8, 50 8"
            fill="none"
            stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Main Brain Outline with gradient */}
          <path
            d="M50 8 
               C28 8, 12 24, 12 45
               C12 58, 18 68, 22 75
               C16 78, 10 84, 10 92
               C10 104, 24 112, 42 112
               L58 112
               C76 112, 90 104, 90 92
               C90 84, 84 78, 78 75
               C82 68, 88 58, 88 45
               C88 24, 72 8, 50 8"
            fill="none"
            stroke={`url(#brain-main-${size})`}
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#brain-glow-${size})`}
          />
          
          {/* Neural Network Connections */}
          {animated && connections.map(([from, to], i) => (
            <line
              key={`conn-${i}`}
              x1={neuralNodes[from].cx}
              y1={neuralNodes[from].cy}
              x2={neuralNodes[to].cx}
              y2={neuralNodes[to].cy}
              stroke={`url(#brain-main-${size})`}
              strokeWidth="0.8"
              opacity="0.4"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.7;0.2"
                dur={`${1.5 + (i % 5) * 0.3}s`}
                begin={`${(i * 0.15) % 2}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
          
          {/* Neural Nodes - Blinking AI neurons */}
          {animated && neuralNodes.map((node, i) => (
            <g key={`node-${i}`} filter={`url(#node-glow-${size})`}>
              {/* Node base */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.layer === 'core' ? 3 : 2}
                fill="white"
                opacity="0.3"
              />
              {/* Pulsing overlay */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.layer === 'core' ? 3 : 2}
                fill="white"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;1;0.2"
                  dur={`${0.8 + (i % 7) * 0.2}s`}
                  begin={`${(i * 0.12) % 1.5}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values={`${node.layer === 'core' ? 2 : 1.5};${node.layer === 'core' ? 4 : 3};${node.layer === 'core' ? 2 : 1.5}`}
                  dur={`${0.8 + (i % 7) * 0.2}s`}
                  begin={`${(i * 0.12) % 1.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
          
          {/* Data flow particles along connections */}
          {animated && (
            <>
              {/* Particle stream 1 - Left to center */}
              <circle r="1.5" fill="#06b6d4" opacity="0.9" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="25;35;50;50" dur="2s" repeatCount="indefinite" />
                <animate attributeName="cy" values="30;45;35;55" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.8;1;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
              
              {/* Particle stream 2 - Right to center */}
              <circle r="1.5" fill="#10b981" opacity="0.9" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="75;65;50;50" dur="2s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="30;45;35;55" dur="2s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.8;1;0.5" dur="2s" begin="0.5s" repeatCount="indefinite" />
              </circle>
              
              {/* Particle stream 3 - Center to bottom */}
              <circle r="1.5" fill="white" opacity="0.9" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="50;45;55;50" dur="2.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="cy" values="55;75;85;95" dur="2.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.9;0.7;0.3" dur="2.5s" begin="1s" repeatCount="indefinite" />
              </circle>
              
              {/* Random impulse sparks */}
              {Array.from({ length: 5 }).map((_, i) => (
                <circle 
                  key={`spark-${i}`} 
                  r="1" 
                  fill="white" 
                  filter={`url(#node-glow-${size})`}
                >
                  <animate
                    attributeName="cx"
                    values={`${20 + i * 15};${30 + i * 10};${25 + i * 12}`}
                    dur={`${1.2 + i * 0.3}s`}
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values={`${25 + i * 10};${45 + i * 8};${35 + i * 12}`}
                    dur={`${1.2 + i * 0.3}s`}
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur={`${1.2 + i * 0.3}s`}
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </>
          )}
          
          {/* Circuit patterns inside brain */}
          <g opacity="0.3" stroke={`url(#brain-main-${size})`} strokeWidth="0.5" fill="none">
            <path d="M30 35 L40 35 L40 45" />
            <path d="M70 35 L60 35 L60 45" />
            <path d="M35 65 L45 65 L45 75" />
            <path d="M65 65 L55 65 L55 75" />
            <path d="M50 20 L50 30" />
            <path d="M50 80 L50 95" />
          </g>
        </svg>
      </div>
    );
  };

  // Full Logo with Dual Gradient Text
  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <CinematicBrainIcon />
        <div className="relative">
          {/* Glow behind text */}
          <span 
            className={cn(
              currentSize.text,
              "absolute inset-0 blur-lg opacity-50 font-black tracking-tight"
            )}
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              background: 'linear-gradient(90deg, #0ea5e9 0%, #10b981 50%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            aria-hidden="true"
          >
            ObelixIA
          </span>
          
          {/* Main Text with Dual Gradient (blue→green | green→blue) */}
          <span 
            className={cn(
              currentSize.text,
              "relative font-black tracking-tight"
            )}
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              letterSpacing: "-0.02em",
              background: animated 
                ? 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 20%, #10b981 50%, #06b6d4 80%, #0ea5e9 100%)'
                : 'linear-gradient(90deg, #0ea5e9 0%, #10b981 50%, #0ea5e9 100%)',
              backgroundSize: animated ? '200% 100%' : '100% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: animated ? 'gradientShift 4s ease infinite' : 'none',
            }}
          >
            ObelixIA
          </span>
          
          {/* Shine sweep effect on text */}
          {animated && (
            <span 
              className={cn(
                currentSize.text,
                "absolute inset-0 font-black tracking-tight pointer-events-none overflow-hidden"
              )}
              style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                letterSpacing: "-0.02em",
                background: 'linear-gradient(120deg, transparent 0%, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%, transparent 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'textShine 3s ease-in-out infinite',
              }}
              aria-hidden="true"
            >
              ObelixIA
            </span>
          )}
        </div>
        
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes textShine {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Icon Only
  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center justify-center", className)}>
        <CinematicBrainIcon />
      </div>
    );
  }

  // Text Only
  return (
    <div className="relative inline-block">
      <span 
        className={cn(
          currentSize.text,
          "absolute inset-0 blur-lg opacity-50 font-black tracking-tight"
        )}
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          background: 'linear-gradient(90deg, #0ea5e9 0%, #10b981 50%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        aria-hidden="true"
      >
        ObelixIA
      </span>
      <span 
        className={cn(
          currentSize.text,
          "relative font-black tracking-tight",
          className
        )}
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          letterSpacing: "-0.02em",
          background: animated 
            ? 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 20%, #10b981 50%, #06b6d4 80%, #0ea5e9 100%)'
            : 'linear-gradient(90deg, #0ea5e9 0%, #10b981 50%, #0ea5e9 100%)',
          backgroundSize: animated ? '200% 100%' : '100% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: animated ? 'gradientShift 4s ease infinite' : 'none',
        }}
      >
        ObelixIA
      </span>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Cinematic Loading Spinner with Brain Symbol
 */
export function ObelixiaLoadingSpinner({ 
  size = "md",
  text = "Cargando...",
  showText = true 
}: { 
  size?: "sm" | "md" | "lg";
  text?: string;
  showText?: boolean;
}) {
  const sizeClasses = {
    sm: { width: 40, height: 48, text: "text-sm" },
    md: { width: 60, height: 72, text: "text-base" },
    lg: { width: 90, height: 108, text: "text-lg" },
  };

  const current = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: current.width, height: current.height }}>
        {/* Ambient glow */}
        <div 
          className="absolute inset-0 blur-xl opacity-60"
          style={{
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.5) 0%, rgba(16,185,129,0.3) 50%, transparent 70%)',
          }}
        />
        
        <svg viewBox="0 0 100 120" className="w-full h-full">
          <defs>
            <linearGradient id="spinner-brain-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9">
                <animate attributeName="stop-color" values="#0ea5e9;#10b981;#0ea5e9" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#10b981">
                <animate attributeName="stop-color" values="#10b981;#06b6d4;#10b981" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#06b6d4">
                <animate attributeName="stop-color" values="#06b6d4;#0ea5e9;#06b6d4" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <filter id="spinner-brain-glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background brain path */}
          <path
            d="M50 10 C30 10, 15 25, 15 45 C15 55, 20 65, 25 72 C18 75, 12 80, 12 88 C12 100, 25 110, 40 110 L60 110 C75 110, 88 100, 88 88 C88 80, 82 75, 75 72 C80 65, 85 55, 85 45 C85 25, 70 10, 50 10"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Animated flowing brain path */}
          <path
            d="M50 10 C30 10, 15 25, 15 45 C15 55, 20 65, 25 72 C18 75, 12 80, 12 88 C12 100, 25 110, 40 110 L60 110 C75 110, 88 100, 88 88 C88 80, 82 75, 75 72 C80 65, 85 55, 85 45 C85 25, 70 10, 50 10"
            fill="none"
            stroke="url(#spinner-brain-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="50 250"
            filter="url(#spinner-brain-glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-300"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Neural impulse sparkles */}
          {[
            { cx: 35, cy: 40 },
            { cx: 65, cy: 40 },
            { cx: 50, cy: 55 },
            { cx: 30, cy: 70 },
            { cx: 70, cy: 70 },
            { cx: 50, cy: 90 },
          ].map((pos, i) => (
            <g key={i}>
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="2"
                fill="white"
                opacity="0"
              >
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="1.5s"
                  begin={`${i * 0.25}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="1;3;1"
                  dur="1.5s"
                  begin={`${i * 0.25}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>
      </div>

      {showText && (
        <span 
          className={cn(current.text, "font-medium")}
          style={{
            background: 'linear-gradient(90deg, #06b6d4, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * Full Page Cinematic Loading Screen
 */
export function ObelixiaFullscreenLoader({ text = "Cargando ObelixIA..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#10b981' : '#06b6d4',
              opacity: 0,
              animation: `particleFloat ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Radial glow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.3) 0%, transparent 60%)',
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <ObelixiaLogo size="hero" variant="full" animated />
        
        <div className="mt-6">
          <ObelixiaLoadingSpinner size="lg" text={text} />
        </div>

        {/* Tagline */}
        <p 
          className="text-sm tracking-[0.3em] uppercase mt-4"
          style={{
            background: 'linear-gradient(90deg, #64748b, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CRM Bancari Intel·ligent
        </p>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-40 h-40">
        <div className="absolute top-8 left-8 w-24 h-[2px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
        <div className="absolute top-8 left-8 w-[2px] h-24 bg-gradient-to-b from-cyan-500/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-40 h-40">
        <div className="absolute bottom-8 right-8 w-24 h-[2px] bg-gradient-to-l from-emerald-500/50 to-transparent" />
        <div className="absolute bottom-8 right-8 w-[2px] h-24 bg-gradient-to-t from-emerald-500/50 to-transparent" />
      </div>
      
      <style>{`
        @keyframes particleFloat {
          0%, 100% { 
            transform: translateY(0) scale(0.8); 
            opacity: 0;
          }
          10% { opacity: 0.6; }
          50% { 
            transform: translateY(-30px) scale(1.2); 
            opacity: 0.8;
          }
          90% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default ObelixiaLogo;
