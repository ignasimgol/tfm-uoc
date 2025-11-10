export async function middleware(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || 'unknown'

  const allowedCountries = [
    'ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'LU', 'IE', 'GB',
    'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'AT', 'CH', 'HU', 'GR',
    'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'IS'
  ]

  if (!allowedCountries.includes(country)) {
    return new Response('Access Denied', { status: 403 })
  }

  // Para continuar la petición, simplemente no retornes nada
}
