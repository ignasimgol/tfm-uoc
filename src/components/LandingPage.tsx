// LandingPage component
import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'
import { IoStatsChart } from 'react-icons/io5'
import { PiChalkboardTeacherFill } from 'react-icons/pi'
import { FaCheck } from 'react-icons/fa'

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const handleToggleMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login')
  }

  // Rotating word + fade effect
  const words = ['faster', 'better', 'easier']
  const [wordIndex, setWordIndex] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length)
        setFading(false)
      }, 200) // fade out duration
    }, 2500) // cycle frequency
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <header className="bg-white rounded-full shadow-lg border-2 border-gray-800">
            <nav className="px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img
                    src="/step-black.png"
                    alt="Step logo"
                    className=" h-10"
                  />
                </div>
                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                  <a href="#home" className="text-gray-800 hover:text-[#2E7915] hover:underline font-medium transition-colors">
                    Home
                  </a>
                  <a href="#about" className="text-gray-600 hover:text-[#2E7915] hover:underline font-medium transition-colors">
                    About
                  </a>
                  <a href="#contact" className="text-gray-600 hover:text-[#2E7915] hover:underline font-medium transition-colors">
                    Contact
                  </a>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-gray-600 hover:text-[#2E7915] hover:underline font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-[#2E7915] hover:bg-black text-white px-6 py-2 rounded-full font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </nav>
          </header>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className='block'>
              <span className="text-[#2E7915]">Track</span>
              <span> your exercise 🏃🏽‍♂️</span>
            </span>
            <span
              className={`underline decoration-[#2E7915] hover:text-[#2E7915] inline-block transition-all duration-200 ${
                fading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
              }`}
            >
              {words[wordIndex]}
            </span>
            <span> than ever</span>
          </h1>
          
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            The ultimate platform for teachers and students to track fitness progress and achieve health goals together.
          </p>

          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <button
                onClick={() => handleAuthClick('signup')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#2E7915] hover:bg-black transition-colors md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <button
                onClick={() => handleAuthClick('login')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-[#2E7915] bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pt-6">
              <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-[#2E7915] rounded-md shadow-lg">
                      <IoStatsChart size={24} className="text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Progress Tracking</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Monitor your fitness journey with detailed analytics and progress reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-[#2E7915] rounded-md shadow-lg">
                      <PiChalkboardTeacherFill size={24} className="text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Teacher & Student</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Designed for both educators and learners to collaborate on fitness goals.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div>
                    <span className="inline-flex items-center justify-center p-3 bg-[#2E7915] rounded-md shadow-lg">
                      <FaCheck size={24} className="text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Easy to Use</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Simple and intuitive interface that makes tracking exercises effortless.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <section id="about" className="mt-24">
          
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-white border-t-2 border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3">
              <img src="/step-black.png" alt="Step logo" className="h-8" />
            </div>
            <nav className="mt-4 md:mt-0 flex items-center space-x-6">
              <a href="#home" className="text-gray-600 hover:text-[#2E7915]">Home</a>
              <a href="#about" className="text-gray-600 hover:text-[#2E7915]">About</a>
              <a href="#contact" className="text-gray-600 hover:text-[#2E7915]">Contact</a>
            </nav>
          </div>
          <div id="contact" className="pb-8 text-sm text-gray-600">
            <p>
              Contact us: <a href="mailto:ignasimgol@gmail.com" className="underline hover:text-[#2E7915]">ignasimgol@gmail.com</a>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} STEP. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal (fixes unused warnings) */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onToggleMode={handleToggleMode}
        />
      )}
    </div>
  )
}

export default LandingPage