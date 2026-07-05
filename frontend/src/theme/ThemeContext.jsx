import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const prefersDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

// theme: 'light' | 'dark' | 'system' — persisted in localStorage.
// 'system' follows the OS preference live.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'system'
  )

  useEffect(() => {
    localStorage.setItem('theme', theme)

    const apply = () => {
      const resolved = theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }

    apply()

    // Follow OS theme changes while in "system" mode
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
