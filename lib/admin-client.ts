export const ADMIN_STORAGE_KEY = 'lw_admin_secret'

export function adminHeaders(secret: string): HeadersInit {
  return {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
  }
}
