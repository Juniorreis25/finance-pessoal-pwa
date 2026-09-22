export function getAuthCallbackUrl(origin: string) {
    return new URL('/auth/callback', origin).toString()
}
