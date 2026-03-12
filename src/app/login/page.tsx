'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#f8f4ef]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C7E6A3] mb-4">
            <Heart className="w-8 h-8 text-green-700" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl text-stone-800">Family Careboard</h1>
          <p className="text-stone-500 text-sm mt-1">Your family health companion</p>
        </div>

        {sent ? (
          <div className="text-center bg-white rounded-2xl p-8 card-shadow">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-semibold text-stone-800 mb-1">Check your inbox</h2>
            <p className="text-stone-500 text-sm">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm text-stone-400 underline">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 card-shadow space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C7E6A3] focus:border-transparent transition"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-700 disabled:opacity-50 transition"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
        <p className="text-center text-xs text-stone-400 mt-6">No password needed · Private & secure</p>
      </div>
    </div>
  )
}
