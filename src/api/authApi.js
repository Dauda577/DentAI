import { supabase } from '@/lib/supabaseClient'

// Maps a Supabase auth user (+ optional profiles row) into the shape the
// rest of the app expects: { id, name, email, role, clinicName }.
async function toAppUser(authUser) {
  if (!authUser) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return {
    id: authUser.id,
    name: profile?.name ?? authUser.user_metadata?.name ?? authUser.email,
    email: authUser.email,
    role: profile?.role ?? 'dentist',
    clinicName: profile?.clinic_name ?? null,
  }
}

export const authApi = {
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const user = await toAppUser(data.user)
    return { token: data.session?.access_token ?? null, user }
  },

  async register({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error

    // With email confirmation enabled (Supabase's default), `session` is
    // null until the user clicks the confirmation link — they aren't
    // actually signed in yet, so the caller should not treat this as a
    // successful login.
    const needsEmailConfirmation = !data.session
    const user = needsEmailConfirmation ? null : await toAppUser(data.user)
    return { token: data.session?.access_token ?? null, user, needsEmailConfirmation }
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return { success: true }
  },

  async me() {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()
    if (error || !authUser) {
      const err = error ?? new Error('Not authenticated')
      err.code = err.code ?? 'NOT_AUTHENTICATED'
      throw err
    }
    return toAppUser(authUser)
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  },

  async resendConfirmation(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
    return { success: true }
  },

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    })
    if (error) throw error
    return data
  },
}
