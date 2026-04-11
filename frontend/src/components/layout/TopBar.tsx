import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInitials, getEmail } from '../../lib/auth'

export default function TopBar() {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const token = localStorage.getItem('access_token') ?? ''
  const initials = getInitials(token)
  const email = getEmail(token)

  useEffect(() => {
    if (!showMenu) return
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showMenu])

  function handleLogout() {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-slate-700">
      <span className="text-sm font-semibold text-slate-100 tracking-tight">
        💬 ChatBot Platform
      </span>

      <div className="relative" ref={menuRef}>
        <button
          aria-label="User menu"
          aria-expanded={showMenu}
          aria-haspopup="true"
          onClick={() => setShowMenu(v => !v)}
          className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-xs font-semibold flex items-center justify-center hover:bg-slate-600 transition-colors"
        >
          {initials}
        </button>

        {showMenu && (
          <div
            role="menu"
            className="absolute right-0 top-11 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
          >
            {email && (
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            )}
            <button
              role="menuitem"
              aria-label="Profile"
              onClick={() => { setShowMenu(false); navigate('/profile') }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.121 17.804A9 9 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Profile
            </button>
            <button
              role="menuitem"
              aria-label="Logout"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
