const SUPABASE_URL_ENV = 'NEXT_PUBLIC_SUPABASE_URL'
const SUPABASE_ANON_KEY_ENV = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'

function readRequiredEnv(name: string) {
    const value = process.env[name]

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. Configure the Supabase URL and anon key before using auth.`
        )
    }

    return value
}

export function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url) {
        throw new Error(
            "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Configure the Supabase URL before using auth."
        )
    }

    if (!anonKey) {
        throw new Error(
            "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure the anon key before using auth."
        )
    }

    return {
        url,
        anonKey,
    }
}
