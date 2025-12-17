import { cn } from "@/lib/utils";

interface ObelixiaLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  variant?: "full" | "icon" | "text";
  animated?: boolean;
  className?: string;
  dark?: boolean;
}

/**
 * ObelixIA Specular Logo - Luxury Brand Identity
 * Inspired by iconic brands: Coca-Cola's flow, IKEA's boldness, Nestlé's premium feel
 */
export function ObelixiaLogo({ 
  size = "md", 
  variant = "full",
  animated = false,
  className,
  dark = true
}: ObelixiaLogoProps) {
  const sizeClasses = {
    sm: { container: "h-8", text: "text-xl", icon: "w-6 h-6" },
    md: { container: "h-12", text: "text-3xl", icon: "w-10 h-10" },
    lg: { container: "h-16", text: "text-5xl", icon: "w-14 h-14" },
    xl: { container: "h-24", text: "text-7xl", icon: "w-20 h-20" },
    hero: { container: "h-32", text: "text-8xl md:text-9xl", icon: "w-28 h-28" },
  };

  const currentSize = sizeClasses[size];

  // Specular gradient for luxury effect - adapts to dark/light mode
  const specularGradient = dark 
    ? "bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-500"
    : "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600";
  const specularText = "bg-clip-text text-transparent";
  
  // Infinity Symbol SVG - Custom designed for brand
  const InfinityIcon = () => (
    <svg 
      viewBox="0 0 100 50" 
      className={cn(
        currentSize.icon,
        animated && "animate-pulse",
        "drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]"
      )}
      fill="none"
    >
      <defs>
        <linearGradient id="infinity-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d="M25 25 C25 15, 35 10, 45 15 C55 20, 55 30, 45 35 C35 40, 25 35, 25 25 M75 25 C75 15, 65 10, 55 15 C45 20, 45 30, 55 35 C65 40, 75 35, 75 25"
        stroke="url(#infinity-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
        className={animated ? "animate-[draw_3s_ease-in-out_infinite]" : ""}
      />
    </svg>
  );

  // Full Logo with Specular Effect
  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <InfinityIcon />
        <div className="relative">
          {/* Main Text with Specular Gradient */}
          <span 
            className={cn(
              currentSize.text,
              "font-black tracking-tight",
              specularGradient,
              specularText,
              "drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]",
              animated && "animate-pulse"
            )}
            style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              letterSpacing: "-0.02em",
            }}
          >
            Obelix
            <span className="text-cyan-400">IA</span>
          </span>
          
          {/* Specular Highlight Overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none"
            style={{ mixBlendMode: "overlay" }}
          />
        </div>
      </div>
    );
  }

  // Icon Only
  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center justify-center", className)}>
        <InfinityIcon />
      </div>
    );
  }

  // Text Only
  return (
    <span 
      className={cn(
        currentSize.text,
        "font-black tracking-tight",
        specularGradient,
        specularText,
        "drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]",
        animated && "animate-pulse",
        className
      )}
      style={{
        fontFamily: "'Crimson Pro', Georgia, serif",
        letterSpacing: "-0.02em",
      }}
    >
      Obelix
      <span className="text-cyan-400">IA</span>
    </span>
  );
}

/**
 * Animated Loading Spinner with Infinity Symbol
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
    sm: { container: "w-12 h-12", text: "text-sm" },
    md: { container: "w-20 h-20", text: "text-base" },
    lg: { container: "w-32 h-32", text: "text-lg" },
  };

  const current = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Animated Infinity Symbol */}
      <div className={cn("relative", current.container)}>
        <svg 
          viewBox="0 0 100 50" 
          className="w-full h-full"
          fill="none"
        >
          <defs>
            <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399">
                <animate attributeName="stop-color" values="#34d399;#22d3ee;#34d399" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#22d3ee">
                <animate attributeName="stop-color" values="#22d3ee;#34d399;#22d3ee" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#10b981">
                <animate attributeName="stop-color" values="#10b981;#06b6d4;#10b981" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <filter id="glow-loading">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Infinity Path with Animated Stroke */}
          <path
            d="M25 25 C25 12, 38 5, 50 15 C62 25, 62 25, 75 25 C88 25, 88 25, 75 25 C62 25, 62 25, 50 35 C38 45, 25 38, 25 25"
            stroke="url(#loading-gradient)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow-loading)"
            strokeDasharray="200"
            strokeDashoffset="0"
          >
            <animate 
              attributeName="stroke-dashoffset" 
              values="0;200;0" 
              dur="2s" 
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </path>

          {/* Second infinity for continuous flow effect */}
          <path
            d="M25 25 C25 12, 38 5, 50 15 C62 25, 62 25, 75 25 C88 25, 88 25, 75 25 C62 25, 62 25, 50 35 C38 45, 25 38, 25 25"
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="200"
            strokeDashoffset="100"
          >
            <animate 
              attributeName="stroke-dashoffset" 
              values="100;300;100" 
              dur="2s" 
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </path>
        </svg>
        
        {/* Pulsing glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse" />
      </div>

      {/* Loading Text */}
      {showText && (
        <span className={cn(
          current.text,
          "text-slate-400 font-medium animate-pulse"
        )}>
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * Full Page Loading Screen
 */
export function ObelixiaFullscreenLoader({ text = "Cargando ObelixIA..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <ObelixiaLogo size="hero" variant="full" animated />
        
        <div className="mt-8">
          <ObelixiaLoadingSpinner size="lg" text={text} />
        </div>

        {/* Tagline */}
        <p className="text-slate-500 text-sm tracking-widest uppercase mt-4">
          CRM Bancari Intel·ligent
        </p>
      </div>

      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-emerald-500/20 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20 animate-pulse" />
    </div>
  );
}

export default ObelixiaLogo;
