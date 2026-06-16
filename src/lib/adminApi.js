import { supabase } from './supabase'

const ENDPOINT = '/api/admin-users'

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token || ''}`,
  }
}

async function handle(res) {
  let body = {}
  try { body = await res.json() } catch { /* sem corpo */ }
  if (!res.ok) throw new Error(body.error || `Erro ${res.status}`)
  return body
}

export async function listUsers() {
  const res = await fetch(ENDPOINT, { headers: await authHeaders() })
  const { users } = await handle(res)
  return users || []
}

export async function createUser(payload) {
  const res = await fetch(ENDPOINT, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload) })
  return handle(res)
}

export async function updateUser(payload) {
  const res = await fetch(ENDPOINT, { method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(payload) })
  return handle(res)
}

export async function deleteUser(id) {
  const res = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: await authHeaders() })
  return handle(res)
}
