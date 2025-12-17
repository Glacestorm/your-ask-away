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

  // Spherical AI Brain with Neural Network Nodes
  const CinematicBrainIcon = () => {
    // Neural nodes distributed across the spherical brain surface
    const neuralNodes = [
      // Outer ring nodes
      { cx: 50, cy: 12, delay: 0, duration: 1.5 },
      { cx: 25, cy: 25, delay: 0.3, duration: 1.2 },
      { cx: 75, cy: 25, delay: 0.6, duration: 1.4 },
      { cx: 12, cy: 50, delay: 0.9, duration: 1.3 },
      { cx: 88, cy: 50, delay: 0.2, duration: 1.5 },
      { cx: 25, cy: 75, delay: 0.5, duration: 1.1 },
      { cx: 75, cy: 75, delay: 0.8, duration: 1.4 },
      { cx: 50, cy: 88, delay: 0.1, duration: 1.2 },
      // Middle ring nodes
      { cx: 35, cy: 20, delay: 0.4, duration: 1.6 },
      { cx: 65, cy: 20, delay: 0.7, duration: 1.3 },
      { cx: 20, cy: 35, delay: 1.0, duration: 1.5 },
      { cx: 80, cy: 35, delay: 0.3, duration: 1.2 },
      { cx: 20, cy: 65, delay: 0.6, duration: 1.4 },
      { cx: 80, cy: 65, delay: 0.9, duration: 1.1 },
      { cx: 35, cy: 80, delay: 0.2, duration: 1.5 },
      { cx: 65, cy: 80, delay: 0.5, duration: 1.3 },
      // Inner nodes
      { cx: 38, cy: 35, delay: 0.8, duration: 1.4 },
      { cx: 62, cy: 35, delay: 0.1, duration: 1.2 },
      { cx: 30, cy: 50, delay: 0.4, duration: 1.6 },
      { cx: 70, cy: 50, delay: 0.7, duration: 1.3 },
      { cx: 38, cy: 65, delay: 1.0, duration: 1.1 },
      { cx: 62, cy: 65, delay: 0.3, duration: 1.5 },
      // Center nodes
      { cx: 50, cy: 35, delay: 0.6, duration: 1.4 },
      { cx: 45, cy: 50, delay: 0.9, duration: 1.2 },
      { cx: 55, cy: 50, delay: 0.2, duration: 1.3 },
      { cx: 50, cy: 65, delay: 0.5, duration: 1.5 },
    ];

    // Neural connections between nodes
    const connections = [
      // Outer connections
      { x1: 50, y1: 12, x2: 25, y2: 25 },
      { x1: 50, y1: 12, x2: 75, y2: 25 },
      { x1: 25, y1: 25, x2: 12, y2: 50 },
      { x1: 75, y1: 25, x2: 88, y2: 50 },
      { x1: 12, y1: 50, x2: 25, y2: 75 },
      { x1: 88, y1: 50, x2: 75, y2: 75 },
      { x1: 25, y1: 75, x2: 50, y2: 88 },
      { x1: 75, y1: 75, x2: 50, y2: 88 },
      // Cross connections
      { x1: 35, y1: 20, x2: 65, y2: 20 },
      { x1: 20, y1: 35, x2: 35, y2: 20 },
      { x1: 80, y1: 35, x2: 65, y2: 20 },
      { x1: 20, y1: 65, x2: 20, y2: 35 },
      { x1: 80, y1: 65, x2: 80, y2: 35 },
      { x1: 35, y1: 80, x2: 20, y2: 65 },
      { x1: 65, y1: 80, x2: 80, y2: 65 },
      { x1: 35, y1: 80, x2: 65, y2: 80 },
      // Inner connections
      { x1: 38, y1: 35, x2: 62, y2: 35 },
      { x1: 30, y1: 50, x2: 38, y2: 35 },
      { x1: 70, y1: 50, x2: 62, y2: 35 },
      { x1: 38, y1: 65, x2: 30, y2: 50 },
      { x1: 62, y1: 65, x2: 70, y2: 50 },
      { x1: 38, y1: 65, x2: 62, y2: 65 },
      // Center connections
      { x1: 50, y1: 35, x2: 38, y2: 35 },
      { x1: 50, y1: 35, x2: 62, y2: 35 },
      { x1: 45, y1: 50, x2: 30, y2: 50 },
      { x1: 55, y1: 50, x2: 70, y2: 50 },
      { x1: 50, y1: 65, x2: 38, y2: 65 },
      { x1: 50, y1: 65, x2: 62, y2: 65 },
      { x1: 45, y1: 50, x2: 50, y2: 35 },
      { x1: 55, y1: 50, x2: 50, y2: 35 },
      { x1: 45, y1: 50, x2: 50, y2: 65 },
      { x1: 55, y1: 50, x2: 50, y2: 65 },
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
          viewBox="0 0 100 100" 
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
            <radialGradient id={`brain-inner-${size}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.15)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.05)" />
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
            
            {/* Node Glow Filter */}
            <filter id={`node-glow-${size}`} x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main spherical outline */}
          <g filter={`url(#brain-glow-${size})`}>
            {/* Outer sphere */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill={`url(#brain-inner-${size})`}
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="1.5"
              opacity="0.9"
            />
            
            {/* Inner depth circle */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.5"
              opacity="0.3"
            />
          </g>
          
          {/* Neural connections - lines between nodes */}
          {connections.map((conn, i) => (
            <line
              key={`conn-${i}`}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke={`url(#brain-gradient-${size})`}
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          
          {/* Neural Nodes - Blinking synaptic activity */}
          {neuralNodes.map((node, i) => (
            <g key={`node-${i}`} filter={`url(#node-glow-${size})`}>
              {/* Main node */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r="1.5"
                fill="white"
              >
                {animated && (
                  <>
                    <animate
                      attributeName="opacity"
                      values="0.3;0.3;1;1;0.3;0.3"
                      dur={`${node.duration}s`}
                      begin={`${node.delay}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values="1;1;2.5;2;1.5;1"
                      dur={`${node.duration}s`}
                      begin={`${node.delay}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
              {/* Node halo */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r="4"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.3"
              >
                {animated && (
                  <>
                    <animate
                      attributeName="opacity"
                      values="0;0;0.5;0.3;0;0"
                      dur={`${node.duration}s`}
                      begin={`${node.delay}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values="2;2;5;7;5;2"
                      dur={`${node.duration}s`}
                      begin={`${node.delay}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            </g>
          ))}
          
          {/* Traveling neural impulses along connections */}
          {animated && (
            <>
              {/* Impulse 1 */}
              <circle r="1.5" fill="#06b6d4" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="50;35;20;35;50" dur="3s" repeatCount="indefinite" />
                <animate attributeName="cy" values="12;20;35;50;35" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;1;0" dur="3s" repeatCount="indefinite" />
              </circle>
              
              {/* Impulse 2 */}
              <circle r="1.5" fill="#10b981" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="50;65;80;65;50" dur="3s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="cy" values="12;20;35;50;35" dur="3s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;1;0" dur="3s" begin="1s" repeatCount="indefinite" />
              </circle>
              
              {/* Impulse 3 */}
              <circle r="1.2" fill="white" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="45;38;30;38;45" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="50;65;50;35;50" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
              </circle>
              
              {/* Impulse 4 */}
              <circle r="1.2" fill="#0ea5e9" filter={`url(#node-glow-${size})`}>
                <animate attributeName="cx" values="55;62;70;62;55" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="50;65;50;35;50" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;1;0" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
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
 * Cinematic Loading Spinner with Spherical Brain Symbol
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

  // Neural nodes distributed on sphere
  const nodes = [
    { cx: 50, cy: 12, delay: 0 },
    { cx: 25, cy: 25, delay: 0.2 },
    { cx: 75, cy: 25, delay: 0.4 },
    { cx: 12, cy: 50, delay: 0.6 },
    { cx: 88, cy: 50, delay: 0.8 },
    { cx: 25, cy: 75, delay: 1.0 },
    { cx: 75, cy: 75, delay: 0.3 },
    { cx: 50, cy: 88, delay: 0.5 },
    { cx: 38, cy: 38, delay: 0.7 },
    { cx: 62, cy: 38, delay: 0.9 },
    { cx: 50, cy: 50, delay: 0.1 },
    { cx: 38, cy: 62, delay: 0.4 },
    { cx: 62, cy: 62, delay: 0.6 },
  ];

  // Connections between nodes
  const connections = [
    { x1: 50, y1: 12, x2: 25, y2: 25 },
    { x1: 50, y1: 12, x2: 75, y2: 25 },
    { x1: 25, y1: 25, x2: 12, y2: 50 },
    { x1: 75, y1: 25, x2: 88, y2: 50 },
    { x1: 12, y1: 50, x2: 25, y2: 75 },
    { x1: 88, y1: 50, x2: 75, y2: 75 },
    { x1: 25, y1: 75, x2: 50, y2: 88 },
    { x1: 75, y1: 75, x2: 50, y2: 88 },
    { x1: 38, y1: 38, x2: 50, y2: 50 },
    { x1: 62, y1: 38, x2: 50, y2: 50 },
    { x1: 38, y1: 62, x2: 50, y2: 50 },
    { x1: 62, y1: 62, x2: 50, y2: 50 },
    { x1: 25, y1: 25, x2: 38, y2: 38 },
    { x1: 75, y1: 25, x2: 62, y2: 38 },
    { x1: 25, y1: 75, x2: 38, y2: 62 },
    { x1: 75, y1: 75, x2: 62, y2: 62 },
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
        
        <svg viewBox="0 0 100 100" className="w-full h-full">
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
            <filter id="spinner-node-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Spherical outline */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="rgba(6,182,212,0.1)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          
          {/* Animated flowing outline */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#spinner-brain-gradient)"
            strokeWidth="2"
            strokeDasharray="40 224"
            filter="url(#spinner-brain-glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-264"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Neural connections */}
          {connections.map((conn, i) => (
            <line
              key={i}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="url(#spinner-brain-gradient)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          
          {/* Neural nodes */}
          {nodes.map((node, i) => (
            <g key={i} filter="url(#spinner-node-glow)">
              <circle
                cx={node.cx}
                cy={node.cy}
                r="1.5"
                fill="white"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="1.5s"
                  begin={`${node.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="1;2.5;1"
                  dur="1.5s"
                  begin={`${node.delay}s`}
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
