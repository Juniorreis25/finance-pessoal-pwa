import { BarChart3 } from 'lucide-react'

/**
 * Logo Premium - Variation 1: Stacked (Inspired by Stitch Design)
 * 
 * Features:
 * - Vertical stacking with centered alignment
 * - Tagline: "Smart Wealth Management"
 * - Enhanced glassmorphism effect
 * - Premium typography with gradient accents
 */
export function LogoStacked({
    className = "w-12 h-12",
    textSize = "text-2xl",
    showText = true,
    showTagline = true
}: {
    className?: string,
    textSize?: string,
    showText?: boolean,
    showTagline?: boolean
}) {
    return (
        <div className="flex flex-col items-center gap-4 group">
            {/* Icon with glassmorphism */}
            <div className={`relative flex items-center justify-center ${className} bg-gradient-to-br from-brand-accent via-brand-accent/80 to-brand-accent/60 rounded-2xl shadow-2xl shadow-brand-accent/30 text-slate-950 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <BarChart3 className="w-1/2 h-1/2" strokeWidth={2.8} />
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {showText && (
                <div className="flex flex-col items-center gap-1.5">
                    {/* Main title */}
                    <h1 className={`${textSize} font-black tracking-tighter text-center leading-none`}>
                        <span className="bg-gradient-to-r from-brand-accent via-white to-brand-accent bg-clip-text text-transparent">
                            Finance
                        </span>
                        <br />
                        <span className="text-white">
                            Pessoal
                        </span>
                    </h1>

                    {/* Tagline */}
                    {showTagline && (
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-gray/70 text-center">
                            Smart Wealth Management
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * Logo Premium - Variation 2: Horizontal (Compact)
 * 
 * For use in navigation, headers, and smaller spaces
 */
export function LogoHorizontal({
    className = "w-10 h-10",
    textSize = "text-xl",
    showTagline = false
}: {
    className?: string,
    textSize?: string,
    showTagline?: boolean
}) {
    return (
        <div className="flex items-center gap-3 group">
            {/* Icon */}
            <div className={`relative flex items-center justify-center ${className} bg-gradient-to-br from-brand-accent to-brand-accent/70 rounded-xl shadow-lg shadow-brand-accent/20 text-slate-950 group-hover:scale-110 transition-all duration-300`}>
                <BarChart3 className="w-1/2 h-1/2" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-white/20 rounded-xl" />
            </div>

            {/* Text */}
            <div className="flex flex-col space-y-0.5">
                <span className={`${textSize} font-black tracking-tighter text-white uppercase leading-none`}>
                    <span className="text-brand-accent">Finance</span>Pessoal
                </span>
                {showTagline && (
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-brand-gray/60">
                        Smart Wealth Management
                    </span>
                )}
            </div>
        </div>
    )
}
