import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { School } from '../lib/supabase'

interface SchoolLinkingProps {
  user: User
  onComplete: () => void
}

const SchoolLinking = ({ user, onComplete }: SchoolLinkingProps) => {
  const [mode, setMode] = useState<'select' | 'join' | 'create'>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Join existing school states
  const [searchTerm, setSearchTerm] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  
  // Create new school states
  const [schoolName, setSchoolName] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (mode === 'join' && searchTerm.length > 2) {
      searchSchools()
    }
  }, [searchTerm, mode])

  const searchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,invite_code.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      setSchools(data || [])
    } catch (error) {
      console.error('Error searching schools:', error)
    }
  }

  const handleJoinSchool = async () => {
    if (!selectedSchool) {
      setError('Por favor, selecciona una escuela')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('users')
        .update({ school_id: selectedSchool.id })
        .eq('id', user.id)

      if (error) throw error
      onComplete()
    } catch (error: any) {
      setError('Error al unirse a la escuela: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreateSchool = async () => {
    if (!schoolName.trim()) {
      setError('Por favor, introduce el nombre de la escuela')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create new school
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([
          {
            name: schoolName.trim(),
            location: location.trim() || null,
            invite_code: generateInviteCode()
          }
        ])
        .select()
        .single()

      if (schoolError) throw schoolError

      // Update user with new school_id and set as admin
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          school_id: schoolData.id,
          is_admin: true 
        })
        .eq('id', user.id)

      if (userError) throw userError
      onComplete()
    } catch (error: any) {
      setError('Error al crear la escuela: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Selecciona tu escuela
          </h2>
          <p className="text-gray-600">
            Únete a una escuela existente o crea una nueva
          </p>
        </div>

        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('join')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Unirse a una escuela existente</h3>
                  <p className="text-sm text-gray-500">Busca por nombre o código de invitación</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('create')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Crear una nueva escuela</h3>
                  <p className="text-sm text-gray-500">Configura tu propia escuela</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('select')}
              className="flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar escuela
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre de la escuela o código de invitación"
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {schools.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Escuelas encontradas:
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {schools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
                      className={`w-full p-3 text-left border rounded-md transition-colors ${
                        selectedSchool?.id === school.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{school.name}</div>
                      {school.location && (
                        <div className="text-sm text-gray-500">{school.location}</div>
                      )}
                      <div className="text-xs text-gray-400">Código: {school.invite_code}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSchool && (
              <button
                onClick={handleJoinSchool}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uniéndose...' : `Unirse a ${selectedSchool.name}`}
              </button>
            )}
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('select')}
              className="flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>

            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la escuela *
              </label>
              <input
                type="text"
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Introduce el nombre de tu escuela"
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación (opcional)
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ciudad, país"
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleCreateSchool}
              disabled={loading || !schoolName.trim()}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando escuela...' : 'Crear escuela'}
            </button>

            <div className="text-xs text-gray-500 text-center">
              Al crear una escuela, serás asignado como administrador
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SchoolLinking