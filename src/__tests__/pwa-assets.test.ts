import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

const publicPath = (filename: string) => resolve(process.cwd(), 'public', filename)

describe('PWA assets', () => {
    it('exposes an installable standalone manifest', () => {
        const appManifest = manifest()

        expect(appManifest.name).toBe('Finance Pessoal')
        expect(appManifest.display).toBe('standalone')
        expect(appManifest.start_url).toBe('/dashboard')
        expect(appManifest.scope).toBe('/')
        expect(appManifest.icons).toEqual(expect.arrayContaining([
            expect.objectContaining({ src: '/icon-192x192.png', sizes: '192x192' }),
            expect.objectContaining({ src: '/icon-512x512.png', sizes: '512x512' }),
            expect.objectContaining({ src: '/icon-maskable-512x512.png', purpose: 'maskable' }),
        ]))
    })

    it.each([
        ['icon-192x192.png', 192],
        ['icon-512x512.png', 512],
        ['icon-maskable-512x512.png', 512],
        ['apple-touch-icon.png', 180],
    ])('contains a valid PNG header for %s', (filename: string, expectedSize: number) => {
        const bytes = readFileSync(publicPath(filename))

        expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        expect(bytes.readUInt32BE(16)).toBe(expectedSize)
        expect(bytes.readUInt32BE(20)).toBe(expectedSize)
    })

    it('keeps the service worker network-only for user and protected data', () => {
        const serviceWorker = readFileSync(publicPath('sw.js'), 'utf8')

        expect(serviceWorker).toContain("url.hostname.endsWith('.supabase.co')")
        expect(serviceWorker).toContain("pathname.startsWith('/api/')")
        expect(serviceWorker).toContain("pathname.startsWith('/auth/')")
        expect(serviceWorker).toContain("pathname.startsWith('/_next/data/')")
        expect(serviceWorker).toContain("request.mode === 'navigate'")
        expect(serviceWorker).toContain("caches.match('/offline.html')")
    })
})
