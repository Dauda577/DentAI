import { supabase } from '@/lib/supabaseClient'

const DEFAULT_NOTIFICATIONS = {
  emailAlerts: true,
  smsAlerts: false,
  weeklySummary: true,
}

function mapNotifications(row) {
  return {
    emailAlerts: row.email_alerts ?? true,
    smsAlerts: row.sms_alerts ?? false,
    weeklySummary: row.weekly_summary ?? true,
  }
}

export const settingsApi = {
  async getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .select('name, email, role, clinic_name')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw error

    return {
      name: data?.name ?? user?.email ?? '',
      email: data?.email ?? user?.email ?? '',
      clinicName: data?.clinic_name ?? '',
      role: data?.role ?? 'dentist',
    }
  },

  async updateProfile(payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const newEmail = payload.email && payload.email !== user.email ? payload.email : null

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: newEmail ?? user.email,
          ...(payload.name != null ? { name: payload.name } : {}),
          ...(payload.clinicName != null ? { clinic_name: payload.clinicName } : {}),
        },
        { onConflict: 'id' }
      )
      .select('name, email, role, clinic_name')
      .single()
    if (error) throw error

    let emailChanged = false
    if (newEmail) {
      const { error: emailError } = await supabase.auth.updateUser({ email: newEmail })
      if (emailError) throw emailError
      emailChanged = true
    }

    return {
      name: data.name,
      email: data.email,
      clinicName: data.clinic_name,
      role: data.role,
      emailChanged,
    }
  },

  async updatePassword({ currentPassword, newPassword }) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      const err = new Error('Current password is incorrect')
      err.code = 'INVALID_PASSWORD'
      throw err
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return { success: true }
  },

  async getNotificationPreferences() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('notification_prefs')
      .select('email_alerts, sms_alerts, weekly_summary')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data ? mapNotifications(data) : DEFAULT_NOTIFICATIONS
  },

  async updateNotificationPreferences(payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('notification_prefs')
      .upsert(
        {
          user_id: user.id,
          email_alerts: payload.emailAlerts,
          sms_alerts: payload.smsAlerts,
          weekly_summary: payload.weeklySummary,
        },
        { onConflict: 'user_id' }
      )
    if (error) throw error

    return {
      emailAlerts: payload.emailAlerts,
      smsAlerts: payload.smsAlerts,
      weeklySummary: payload.weeklySummary,
    }
  },

  async getSystemInfo() {
    return {
      version: '1.0.0',
      environment: import.meta.env.PROD ? 'Production' : 'Development',
      lastUpdated: '2026-07-01',
    }
  },
}
