import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/supabase/config'

const responseHeaders = {
    'Cache-Control': 'no-store',
}

export async function GET() {
    try {
        const { url, anonKey } = getSupabaseConfig()
        const authHealthUrl = new URL('/auth/v1/health', url)
        const response = await fetch(authHealthUrl, {
            headers: { apikey: anonKey },
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
        })

        if (!response.ok) {
            console.error('supabase_health_check_failed')
            return NextResponse.json(
                { status: 'unavailable' },
                { status: 503, headers: responseHeaders },
            )
        }

        return NextResponse.json(
            { status: 'ok' },
            { headers: responseHeaders },
        )
    } catch {
        console.error('supabase_health_check_failed')
        return NextResponse.json(
            { status: 'unavailable' },
            { status: 503, headers: responseHeaders },
        )
    }
}
