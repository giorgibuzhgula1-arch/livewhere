import { supabase } from '@/lib/supabase'
import { requireLoggedInUser } from '@/lib/saved-plans'

export type FavoriteCity = {
  id: string
  user_id: string
  city_name: string
  city_country: string
  created_at: string
}

export function cityFavoriteKey(cityName: string, cityCountry: string): string {
  return `${cityName}|${cityCountry}`
}

export async function fetchFavoriteCities(): Promise<FavoriteCity[]> {
  const user = await requireLoggedInUser()

  const { data, error } = await supabase
    .from('favorite_cities')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  const rows = (data ?? []) as FavoriteCity[]
  console.log('[favorite-cities] fetchFavoriteCities', { count: rows.length, rows })
  return rows
}

export async function addFavoriteCity(
  cityName: string,
  cityCountry: string,
): Promise<FavoriteCity> {
  const user = await requireLoggedInUser()

  const { data, error } = await supabase
    .from('favorite_cities')
    .insert({
      user_id: user.id,
      city_name: cityName.trim(),
      city_country: cityCountry.trim(),
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as FavoriteCity
}

export async function removeFavoriteCity(cityName: string, cityCountry: string): Promise<void> {
  const user = await requireLoggedInUser()

  const { error } = await supabase
    .from('favorite_cities')
    .delete()
    .eq('user_id', user.id)
    .eq('city_name', cityName)
    .eq('city_country', cityCountry)

  if (error) throw new Error(error.message)
}
