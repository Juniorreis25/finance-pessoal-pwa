import { BarChart3 } from 'lucide-react'

export function Logo({
    className = "w-10 h-10",
    textSize = "text-xl",
    showText = true
}: {
    className?: string,
    textSize?: string,
    showText?: boolean
}) {
    return (
        <div className="flex items-center gap-3 group">
            <div className={`relative flex items-center justify-center ${className} bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl shadow-lg shadow-brand-500/20 text-slate-950 group-hover:scale-110 transition-all duration-300`}>
                <BarChart3 className="w-1/2 h-1/2" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-white/20 rounded-xl" />
            </div>
            {showText && (
                <div className="flex flex-col space-y-0.5">
                    <span className={`${textSize} font-black tracking-tighter text-white uppercase`}>
                        <span className="text-brand-500">Finance</span>Pessoal
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Sua Vida Financeira
                    </span>
                </div>
            )}
        </div>
    )
}
