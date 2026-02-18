'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function StaffLoginPage() {
    const router = useRouter()
    const [slug, setSlug] = useState('')
    const [pin, setPin] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: slug.trim().toLowerCase(), pin }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Invalid credentials')
                return
            }

            // Store the JWT in a cookie via a server action
            const cookieRes = await fetch('/api/auth/pin/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: data.token }),
            })

            if (!cookieRes.ok) {
                setError('Failed to create session')
                return
            }

            toast.success(`Welcome, ${data.user.full_name}!`)
            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            console.error('Staff login error:', err)
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold">Staff Login</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your shop code and PIN to access POS
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="slug">Shop Code</Label>
                    <Input
                        id="slug"
                        placeholder="e.g. joes-vape-shop"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        disabled={isLoading}
                        autoComplete="organization"
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Ask your shop owner for the shop code
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                        id="pin"
                        type="password"
                        placeholder="Enter your PIN"
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            setPin(val)
                        }}
                        disabled={isLoading}
                        autoComplete="one-time-code"
                        required
                    />
                </div>

                {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || pin.length < 4}
                >
                    {isLoading ? 'Signing in...' : 'Sign in with PIN'}
                </Button>
            </form>

            <div className="text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="size-3" />
                    Owner login
                </Link>
            </div>
        </div>
    )
}
