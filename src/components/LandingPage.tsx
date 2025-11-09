// LandingPage component
import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'
import { IoStatsChart } from 'react-icons/io5'
import { PiChalkboardTeacherFill } from 'react-icons/pi'
import { FaCheck } from 'react-icons/fa'
import { FaEnvelope, FaLinkedin, FaTwitter } from 'react-icons/fa'

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

  // Notification for email copy
  const [copiedToast, setCopiedToast] = useState(false)
  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('ignasimgol@gmail.com')
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 1600)
    } catch {
      // fallback: show toast even if clipboard fails
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 1600)
    }
  }

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
                  <a href="#home" className="text-gray-800 hover:text-green-500 hover:underline font-medium transition-colors">
                    Home
                  </a>
                  <a href="#about" className="text-gray-600 hover:text-green-500 hover:underline font-medium transition-colors">
                    About
                  </a>
                  <a href="#contact" className="text-gray-600 hover:text-green-500 hover:underline font-medium transition-colors">
                    Contact
                  </a>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-gray-600 hover:text-green-500 hover:underline font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-green-700 hover:bg-black text-white px-6 py-2 rounded-full font-medium transition-colors"
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
              <span className="text-green-700">Track</span>
              <span> your exercise 🏃🏽‍♂️</span>
            </span>
            <span
              className={`underline decoration-green-700 hover:text-green-500 inline-block transition-all duration-200 ${
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
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-700 hover:bg-black transition-colors md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <button
                onClick={() => handleAuthClick('login')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-green-500 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10"
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
                    <span className="inline-flex items-center justify-center p-3 bg-green-700 rounded-md shadow-lg">
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
                    <span className="inline-flex items-center justify-center p-3 bg-green-700 rounded-md shadow-lg">
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
                    <span className="inline-flex items-center justify-center p-3 bg-green-700 rounded-md shadow-lg">
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

        {/* How it works */}
        <section id="how-it-works" className="mt-24">
          <div className="space-y-16">
            {/* Row 1: Track activities (image left, text right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="aspect-video rounded-xl bg-gray-100 border flex items-center justify-center text-gray-400">
                  {/* Replace with a real screenshot */}
                  <span className="text-sm">Screenshot: Add activity</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-700 tracking-widest mb-2">TRACKING</div>
                <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                  Log your activities effortlessly
                </h3>
                <p className="mt-3 text-gray-600">
                  Record duration, intensity and type in seconds. Your data is saved to your group so
                  teachers can see progress immediately.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="inline-flex items-center rounded-full bg-green-700 px-4 py-2 text-white hover:bg-black transition-colors"
                  >
                    Start tracking
                  </button>
                
                </div>
              </div>
            </div>
        
            {/* Row 2: Manage groups (text left, image right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="md:order-first">
                <div className="text-xs font-semibold text-green-700 tracking-widest mb-2">GROUPS</div>
                <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                  Manage classes with ease
                </h3>
                <p className="mt-3 text-gray-600">
                  Teachers create groups, invite students and get instant visibility. All members’
                  activity is centralized for quick reviews and feedback.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="inline-flex items-center rounded-full bg-green-700 px-4 py-2 text-white hover:bg-black transition-colors"
                  >
                    Get started
                  </button>
                
                </div>
              </div>
              <div className="md:order-last">
                <div className="rounded-2xl border bg-white shadow-sm p-4">
                  <div className="aspect-video rounded-xl bg-gray-100 border flex items-center justify-center text-gray-400">
                    {/* Replace with a real screenshot */}
                    <span className="text-sm">Screenshot: Groups & members</span>
                  </div>
                </div>
              </div>
            </div>
        
            {/* Row 3: See results (image left, text right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="aspect-video rounded-xl bg-gray-100 border flex items-center justify-center text-gray-400">
                  {/* Replace with a real screenshot */}
                  <span className="text-sm">Screenshot: Totals & top activities</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-700 tracking-widest mb-2">SUMMARY</div>
                <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                  Turn data into insights
                </h3>
                <p className="mt-3 text-gray-600">
                  See per-student totals, group averages and top activities. Simple visuals help
                  identify trends and keep everyone motivated.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="inline-flex items-center rounded-full bg-green-700 px-4 py-2 text-white hover:bg-black transition-colors"
                  >
                    Try it now
                  </button>
                
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h2 className="text-3xl font-semibold text-gray-900">About</h2>
              <p className="mt-4 text-gray-700">
                I’m a teacher with a passion for creating apps. Combining education and technology inspires me to design tools that are both practical and easy to use. Over the years, I’ve seen how the right digital resources can make learning more dynamic, motivating, and accessible for students.
              </p>
              <p className="mt-3 text-gray-700">
                With more than a decade of experience in education and sports coaching, I’ve always been driven by the idea of helping others grow, not only by improving their performance but also by fostering curiosity and a love for learning. That same motivation led me to explore the world of front-end development, where I can bring ideas to life through interactive and user-friendly designs.
              </p>
              <p className="mt-3 text-gray-700">
                I decided to develop this project as part of my Master’s Final Project at the UOC. Its goal is to help teachers and students track their physical progress in a clear, simple, and engaging way, turning data into meaningful insights and supporting a more active, reflective, and enjoyable learning experience.
              </p>
            </div>

            <div className="w-full">
              <img
                src="/about.jpeg"
                alt="Foto de Ignasi"
                className="w-[250px] max-w-sm rounded-lg shadow-md border mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900">Contact us</h2>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={copyEmailToClipboard}
                aria-label="Copiar email"
                className="p-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FaEnvelope className="text-green-500" size={40} />
              </button>
              <a
                href="https://www.linkedin.com/in/ignasi-mu%C3%B1oz-gol-81557515b/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FaLinkedin className="text-green-500" size={40} />
              </a>
              <a
                href="https://twitter.com/ignasimgol"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="p-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FaTwitter className="text-green-500" size={40} />
              </a>
            </div>
          </div>

          {copiedToast && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 text-white px-4 py-2 rounded-md shadow-lg">
                Email copiado al portapapeles
              </div>
            </div>
          )}
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
              <a href="#home" className="text-gray-600 hover:text-green-500">Home</a>
              <a href="#about" className="text-gray-600 hover:text-green-500">About</a>
              <a href="#contact" className="text-gray-600 hover:text-green-500">Contact</a>
            </nav>
          </div>
          <div className="pb-8 text-sm text-gray-600">
            <p className="mt-2">© {new Date().getFullYear()} STEP. All rights reserved.</p>
          </div>
        </div>
      </footer>

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