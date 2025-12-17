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
 * Features: Realistic longitudinal AI brain with neural sparkles
 */
export function ObelixiaLogo({ 
  size = "md", 
  variant = "full",
  animated = true,
  className,
  dark = true
}: ObelixiaLogoProps) {
  const sizeClasses = {
    sm: { container: "h-8", text: "text-xl", iconW: 32, iconH: 32 },
    md: { container: "h-12", text: "text-3xl", iconW: 48, iconH: 48 },
    lg: { container: "h-16", text: "text-5xl", iconW: 64, iconH: 64 },
    xl: { container: "h-24", text: "text-7xl", iconW: 96, iconH: 96 },
    hero: { container: "h-32", text: "text-8xl md:text-9xl", iconW: 140, iconH: 140 },
  };

  const currentSize = sizeClasses[size];

  // Realistic Longitudinal AI Brain Icon with Neural Sparks
  const CinematicBrainIcon = () => {
    // Neural spark positions distributed across brain surface
    const neuralSparks = [
      // Frontal lobe sparks
      { cx: 25, cy: 35, delay: 0, duration: 1.2 },
      { cx: 30, cy: 28, delay: 0.3, duration: 1.5 },
      { cx: 22, cy: 42, delay: 0.6, duration: 1.1 },
      // Parietal lobe sparks
      { cx: 45, cy: 22, delay: 0.2, duration: 1.4 },
      { cx: 55, cy: 20, delay: 0.8, duration: 1.3 },
      { cx: 50, cy: 28, delay: 0.5, duration: 1.2 },
      // Temporal lobe sparks
      { cx: 35, cy: 55, delay: 0.4, duration: 1.6 },
      { cx: 28, cy: 62, delay: 0.9, duration: 1.1 },
      { cx: 42, cy: 60, delay: 0.1, duration: 1.4 },
      // Occipital lobe sparks
      { cx: 70, cy: 35, delay: 0.7, duration: 1.2 },
      { cx: 75, cy: 42, delay: 0.3, duration: 1.5 },
      { cx: 72, cy: 28, delay: 1.0, duration: 1.3 },
      // Cerebellum sparks
      { cx: 68, cy: 58, delay: 0.5, duration: 1.4 },
      { cx: 75, cy: 52, delay: 0.8, duration: 1.1 },
      // Deep brain sparks
      { cx: 48, cy: 45, delay: 0.2, duration: 1.6 },
      { cx: 55, cy: 48, delay: 0.6, duration: 1.2 },
      { cx: 40, cy: 40, delay: 0.9, duration: 1.3 },
      { cx: 60, cy: 38, delay: 0.4, duration: 1.5 },
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
          viewBox="0 0 100 80" 
          className="relative w-full h-full"
          style={{ filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.5)) drop-shadow(0 0 40px rgba(16,185,129,0.3))' }}
        >
          <defs>
            {/* Main Brain Gradient */}
            <linearGradient id={`brain-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
            
            {/* Inner brain gradient for depth */}
            <radialGradient id={`brain-inner-${size}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.1)" />
            </radialGradient>
            
            {/* Glow Filter */}
            <filter id={`brain-glow-${size}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur1"/>
              <feGaussianBlur stdDeviation="4" result="blur2"/>
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Spark Glow Filter */}
            <filter id={`spark-glow-${size}`} x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Brain outer shape - Realistic longitudinal view */}
          <g filter={`url(#brain-glow-${size})`}>
            {/* Main brain silhouette */}
            <path
              d="M18 40 
                 C18 25, 28 12, 45 10
                 C55 9, 65 12, 72 18
                 C80 25, 85 35, 85 45
                 C85 55, 80 62, 72 67
                 C65 72, 55 75, 48 72
                 C40 75, 30 72, 25 65
                 C18 58, 15 50, 18 40Z"
              fill={`url(#brain-inner-${size})`}
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="1.5"
              opacity="0.9"
            />
            
            {/* Frontal lobe detail */}
            <path
              d="M20 42 C22 30, 32 18, 42 15 C35 22, 28 32, 25 42"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="1"
              opacity="0.6"
            />
            
            {/* Parietal lobe curve */}
            <path
              d="M45 12 C55 10, 68 15, 75 25"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="1"
              opacity="0.6"
            />
            
            {/* Central sulcus */}
            <path
              d="M42 15 C45 25, 48 40, 50 55"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.8"
              opacity="0.5"
            />
            
            {/* Lateral sulcus (Sylvian fissure) */}
            <path
              d="M25 48 C35 52, 45 55, 55 52"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.8"
              opacity="0.5"
            />
            
            {/* Temporal lobe lower boundary */}
            <path
              d="M28 55 C35 62, 45 68, 50 70"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.8"
              opacity="0.5"
            />
            
            {/* Occipital detail */}
            <path
              d="M75 30 C80 40, 82 50, 78 60"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.8"
              opacity="0.5"
            />
            
            {/* Brain stem */}
            <path
              d="M55 68 C60 72, 65 73, 68 70 C70 68, 72 64, 70 60"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="1"
              opacity="0.6"
            />
            
            {/* Cerebellum */}
            <ellipse
              cx="72"
              cy="58"
              rx="10"
              ry="8"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="1"
              opacity="0.6"
            />
            
            {/* Gyri details (brain folds) */}
            <path
              d="M30 32 C35 30, 38 35, 35 38"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.5"
              opacity="0.4"
            />
            <path
              d="M55 25 C60 23, 65 28, 62 32"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.5"
              opacity="0.4"
            />
            <path
              d="M35 50 C40 48, 45 52, 42 56"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.5"
              opacity="0.4"
            />
            <path
              d="M65 40 C70 38, 75 42, 72 46"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.5"
              opacity="0.4"
            />
          </g>
          
          {/* Neural Sparks - Blinking synaptic activity */}
          {animated && neuralSparks.map((spark, i) => (
            <g key={`spark-${i}`} filter={`url(#spark-glow-${size})`}>
              {/* Main spark */}
              <circle
                cx={spark.cx}
                cy={spark.cy}
                r="1"
                fill="white"
              >
                <animate
                  attributeName="opacity"
                  values="0;0;1;1;0;0"
                  dur={`${spark.duration}s`}
                  begin={`${spark.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="0.5;0.5;2;2.5;1;0.5"
                  dur={`${spark.duration}s`}
                  begin={`${spark.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Spark halo */}
              <circle
                cx={spark.cx}
                cy={spark.cy}
                r="3"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="0.5"
              >
                <animate
                  attributeName="opacity"
                  values="0;0;0.6;0.3;0;0"
                  dur={`${spark.duration}s`}
                  begin={`${spark.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="1;1;4;6;4;1"
                  dur={`${spark.duration}s`}
                  begin={`${spark.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
          
          {/* Traveling neural impulses */}
          {animated && (
            <>
              {/* Impulse 1 - Frontal to parietal */}
              <circle r="1.5" fill="#06b6d4" filter={`url(#spark-glow-${size})`}>
                <animate attributeName="cx" values="25;35;50;60" dur="2s" repeatCount="indefinite" />
                <animate attributeName="cy" values="35;25;22;30" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />
              </circle>
              
              {/* Impulse 2 - Parietal to occipital */}
              <circle r="1.5" fill="#10b981" filter={`url(#spark-glow-${size})`}>
                <animate attributeName="cx" values="55;65;72;75" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="22;28;38;48" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
              </circle>
              
              {/* Impulse 3 - Temporal loop */}
              <circle r="1.2" fill="white" filter={`url(#spark-glow-${size})`}>
                <animate attributeName="cx" values="30;38;45;38;30" dur="2.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="cy" values="55;58;55;50;55" dur="2.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;1;0" dur="2.5s" begin="1s" repeatCount="indefinite" />
              </circle>
            </>
          )}
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
    sm: { width: 50, height: 50, text: "text-sm" },
    md: { width: 80, height: 80, text: "text-base" },
    lg: { width: 120, height: 120, text: "text-lg" },
  };

  const current = sizeClasses[size];

  // Neural spark positions for spinner
  const sparks = [
    { cx: 25, cy: 35, delay: 0 },
    { cx: 45, cy: 22, delay: 0.2 },
    { cx: 70, cy: 35, delay: 0.4 },
    { cx: 55, cy: 50, delay: 0.6 },
    { cx: 35, cy: 55, delay: 0.8 },
    { cx: 72, cy: 58, delay: 1.0 },
    { cx: 30, cy: 28, delay: 0.3 },
    { cx: 60, cy: 38, delay: 0.7 },
  ];

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
        
        <svg viewBox="0 0 100 80" className="w-full h-full">
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
            <filter id="spinner-spark-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Brain silhouette */}
          <path
            d="M18 40 
               C18 25, 28 12, 45 10
               C55 9, 65 12, 72 18
               C80 25, 85 35, 85 45
               C85 55, 80 62, 72 67
               C65 72, 55 75, 48 72
               C40 75, 30 72, 25 65
               C18 58, 15 50, 18 40Z"
            fill="rgba(6,182,212,0.1)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          
          {/* Animated flowing outline */}
          <path
            d="M18 40 
               C18 25, 28 12, 45 10
               C55 9, 65 12, 72 18
               C80 25, 85 35, 85 45
               C85 55, 80 62, 72 67
               C65 72, 55 75, 48 72
               C40 75, 30 72, 25 65
               C18 58, 15 50, 18 40Z"
            fill="none"
            stroke="url(#spinner-brain-gradient)"
            strokeWidth="2"
            strokeDasharray="40 160"
            filter="url(#spinner-brain-glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-200"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Brain details */}
          <path
            d="M42 15 C45 25, 48 40, 50 55"
            fill="none"
            stroke="url(#spinner-brain-gradient)"
            strokeWidth="0.8"
            opacity="0.4"
          />
          <path
            d="M25 48 C35 52, 45 55, 55 52"
            fill="none"
            stroke="url(#spinner-brain-gradient)"
            strokeWidth="0.8"
            opacity="0.4"
          />
          
          {/* Neural sparks */}
          {sparks.map((spark, i) => (
            <g key={i} filter="url(#spinner-spark-glow)">
              <circle
                cx={spark.cx}
                cy={spark.cy}
                r="1.5"
                fill="white"
              >
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="1.5s"
                  begin={`${spark.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="1;2.5;1"
                  dur="1.5s"
                  begin={`${spark.delay}s`}
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
