import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Menu,
  X,
  AlertTriangle,
  LayoutDashboard,
  Mic,
  Camera,
  Users,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../lib/authStore';

/* =========================================================
   DESKTOP NAVIGATION
   ========================================================= */

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/emergency', label: 'SOS' },
  { href: '/tracking', label: 'Radar Tracking' },
  { href: '/voice', label: 'Voice Shield' },
  { href: '/vault', label: 'Vault' },
  { href: '/community', label: 'Community' },
  { href: '/ai-assistant', label: 'AI Bot' },
  { href: '/contact', label: 'Contact' },
];

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

const mobileNavItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/emergency',
    label: 'Emergency SOS',
    icon: AlertTriangle,
  },
  {
    href: '/tracking',
    label: 'Live Satellite Tracking',
    icon: Shield,
  },
  {
    href: '/voice',
    label: 'Voice Trigger Shield',
    icon: Mic,
  },
  {
    href: '/vault',
    label: 'Evidence Vault',
    icon: Camera,
  },
  {
    href: '/community',
    label: 'Community Helpers',
    icon: Users,
  },
  {
    href: '/ai-assistant',
    label: 'AI Safety Assistant',
    icon: Shield,
  },
  {
    href: '/contact',
    label: 'Contact Support',
  },
];

/* =========================================================
   HEADER COMPONENT
   ========================================================= */

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* =======================================================
     THEME STATE

     Dark mode = default
     Light mode = user selectable
     ======================================================= */

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
      return false;
    }

    if (savedTheme === 'dark') {
      return true;
    }

    return true;
  });

  /* =======================================================
     APPLY THEME
     ======================================================= */

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  /* =======================================================
     SCROLL DETECTION
     ======================================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /* =======================================================
     CLOSE MOBILE MENU ON ROUTE CHANGE
     ======================================================= */

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  /* =======================================================
     CLOSE MOBILE MENU ON ESCAPE
     ======================================================= */

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  /* =======================================================
     THEME TOGGLE
     ======================================================= */

  const toggleTheme = () => {
    setIsDark((currentTheme) => !currentTheme);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <header
      className={`
        fixed
        top-0
        left-0
        right-0
        z-50
        w-full
        transition-all
        duration-300
        ${
          scrolled
            ? `
              bg-background/95
              backdrop-blur-xl
              border-b
              border-border
              shadow-md
            `
            : `
              bg-background/90
              backdrop-blur-lg
              border-b
              border-border/70
            `
        }
      `}
    >
      {/* =====================================================
          HEADER CONTAINER
          ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* =================================================
              LOGO
              ================================================= */}

          <Link
            to="/"
            className="
              flex
              items-center
              gap-2.5
              group
              shrink-0
            "
            aria-label="JanSuraksha AI Home"
          >
            <div className="relative">

              {/* Logo Box */}

              <div
                className="
                  w-9
                  h-9
                  bg-primary
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  shadow-md
                  shadow-red-600/20
                  group-hover:shadow-lg
                  group-hover:shadow-red-600/30
                  group-hover:scale-[1.03]
                  transition-all
                  duration-200
                "
              >
                <Shield
                  size={19}
                  strokeWidth={2.2}
                  className="text-white"
                />
              </div>

              {/* Online Indicator */}

              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  w-2.5
                  h-2.5
                  bg-red-500
                  rounded-full
                  animate-pulse
                  ring-2
                  ring-background
                "
              />
            </div>

            {/* Logo Text */}

            <div className="flex flex-col leading-none">

              <span
                className="
                  text-foreground
                  font-bold
                  text-base
                  tracking-tight
                "
                style={{
                  fontFamily: 'var(--font-heading)',
                }}
              >
                JanSuraksha
              </span>

              <span
                className="
                  text-primary
                  text-[10px]
                  font-bold
                  tracking-[0.18em]
                  uppercase
                  mt-0.5
                "
              >
                AI
              </span>

            </div>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
              ================================================= */}

          <nav
            className="
              hidden
              md:flex
              items-center
              gap-7
            "
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const isSOS = item.label === 'SOS';

              return isSOS ? (
                /* ==========================================
                   SOS NAVIGATION
                   ========================================== */

                <Link
                  key={item.href}
                  to={item.href}
                  className="
                    flex
                    items-center
                    gap-2
                    text-red-600
                    dark:text-red-400
                    hover:text-red-700
                    dark:hover:text-red-300
                    text-sm
                    font-bold
                    transition-colors
                    duration-200
                    relative
                  "
                >
                  <span
                    className="
                      relative
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <span
                      className="
                        absolute
                        w-3
                        h-3
                        rounded-full
                        bg-red-500/20
                        animate-ping
                      "
                    />

                    <span
                      className="
                        relative
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-red-600
                        dark:bg-red-400
                      "
                    />
                  </span>

                  {item.label}
                </Link>
              ) : (
                /* ==========================================
                   NORMAL NAVIGATION
                   ========================================== */

                <Link
                  key={item.href}
                  to={item.href}
                  className="
                    relative
                    text-slate-700
                    dark:text-slate-300
                    hover:text-slate-950
                    dark:hover:text-white
                    text-sm
                    font-semibold
                    transition-colors
                    duration-200
                    group
                  "
                >
                  {item.label}

                  {/* Active / Hover underline */}

                  <span
                    className="
                      absolute
                      -bottom-1.5
                      left-0
                      w-0
                      h-0.5
                      rounded-full
                      bg-primary
                      group-hover:w-full
                      transition-all
                      duration-300
                    "
                  />
                </Link>
              );
            })}
          </nav>

          {/* =================================================
              DESKTOP ACTIONS
              ================================================= */}

          <div
            className="
              hidden
              md:flex
              items-center
              gap-3
            "
          >

            {/* =================================================
                THEME TOGGLE
                ================================================= */}

            <button
              type="button"
              onClick={toggleTheme}
              className="
                relative
                flex
                items-center
                justify-center
                w-10
                h-10
                rounded-xl
                border
                border-slate-300
                dark:border-slate-700
                bg-white
                dark:bg-slate-900
                text-slate-700
                dark:text-slate-300
                hover:text-slate-950
                dark:hover:text-white
                hover:bg-slate-100
                dark:hover:bg-slate-800
                hover:border-slate-400
                dark:hover:border-slate-600
                shadow-sm
                hover:shadow-md
                transition-all
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-primary/30
              "
              aria-label={
                isDark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              title={
                isDark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {isDark ? (
                <Sun
                  size={18}
                  strokeWidth={2}
                  className="text-amber-500"
                />
              ) : (
                <Moon
                  size={18}
                  strokeWidth={2}
                  className="text-slate-700"
                />
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 text-xs font-semibold"
                >
                  <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-red-500 text-xs font-semibold transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-2 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-sm font-semibold transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 bg-primary hover:bg-red-600 dark:hover:bg-red-500 text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-0.5"
                >
                  <AlertTriangle size={14} strokeWidth={2.4} />
                  Get Started
                </Link>
              </>
            )}

          </div>

          {/* =================================================
              MOBILE CONTROLS
              ================================================= */}

          <div
            className="
              md:hidden
              flex
              items-center
              gap-2
            "
          >

            {/* Mobile Theme Toggle */}

            <button
              type="button"
              onClick={toggleTheme}
              className="
                flex
                items-center
                justify-center
                w-10
                h-10
                rounded-xl
                border
                border-slate-300
                dark:border-slate-700
                bg-white
                dark:bg-slate-900
                text-slate-700
                dark:text-slate-300
                hover:bg-slate-100
                dark:hover:bg-slate-800
                shadow-sm
                transition-all
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-primary/30
              "
              aria-label={
                isDark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {isDark ? (
                <Sun
                  size={18}
                  className="text-amber-500"
                />
              ) : (
                <Moon
                  size={18}
                  className="text-slate-700"
                />
              )}
            </button>

            {/* Mobile Menu Button */}

            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="
                flex
                items-center
                justify-center
                w-10
                h-10
                rounded-xl
                border
                border-slate-300
                dark:border-slate-700
                bg-white
                dark:bg-slate-900
                text-slate-700
                dark:text-slate-300
                hover:text-slate-950
                dark:hover:text-white
                hover:bg-slate-100
                dark:hover:bg-slate-800
                shadow-sm
                transition-all
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-primary/30
              "
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU
          ===================================================== */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.22,
              ease: 'easeOut',
            }}
            className="
              md:hidden
              bg-white
              dark:bg-slate-950
              border-t
              border-slate-200
              dark:border-slate-800
              border-b
              shadow-xl
              overflow-hidden
            "
          >
            <div
              className="
                px-4
                py-4
                flex
                flex-col
                gap-1
              "
            >

              {/* =================================================
                  MOBILE NAVIGATION
                  ================================================= */}

              {mobileNavItems.map((item) => {
                const Icon =
                  'icon' in item
                    ? item.icon
                    : null;

                const isEmergency =
                  item.href === '/emergency';

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`
                      flex
                      items-center
                      gap-3
                      text-sm
                      font-semibold
                      py-3
                      px-3
                      rounded-xl
                      transition-all
                      duration-200
                      border
                      ${
                        isEmergency
                          ? `
                            text-red-600
                            dark:text-red-400
                            border-red-200
                            dark:border-red-900/50
                            bg-red-50
                            dark:bg-red-950/20
                            hover:bg-red-100
                            dark:hover:bg-red-950/40
                          `
                          : `
                            text-slate-700
                            dark:text-slate-300
                            border-transparent
                            hover:text-slate-950
                            dark:hover:text-white
                            hover:bg-slate-100
                            dark:hover:bg-slate-900
                          `
                      }
                    `}
                  >
                    {Icon && (
                      <Icon
                        size={17}
                        strokeWidth={2}
                        className={
                          isEmergency
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      />
                    )}

                    <span>
                      {item.label}
                    </span>

                    {isEmergency && (
                      <span
                        className="
                          ml-auto
                          w-2
                          h-2
                          rounded-full
                          bg-red-500
                          animate-pulse
                        "
                      />
                    )}
                  </Link>
                );
              })}

              {/* =================================================
                  MOBILE THEME BUTTON
                  ================================================= */}

              <button
                type="button"
                onClick={toggleTheme}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2.5
                  text-slate-700
                  dark:text-slate-300
                  hover:text-slate-950
                  dark:hover:text-white
                  text-sm
                  font-semibold
                  py-3
                  px-3
                  rounded-xl
                  bg-slate-100
                  dark:bg-slate-900
                  hover:bg-slate-200
                  dark:hover:bg-slate-800
                  border
                  border-slate-200
                  dark:border-slate-800
                  transition-all
                  duration-200
                  mt-2
                "
              >
                {isDark ? (
                  <Sun
                    size={17}
                    className="text-amber-500"
                  />
                ) : (
                  <Moon
                    size={17}
                    className="text-slate-700"
                  />
                )}

                {isDark
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'}
              </button>

              {/* =================================================
                  MOBILE AUTHENTICATION
                  ================================================= */}

              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-bold truncate">{user.name}</div>
                        <div className="text-slate-400 text-[10px] truncate">{user.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 rounded-xl border border-red-500/30 text-xs transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-sm font-semibold py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                    >
                      Sign In
                    </Link>

                    <Link
                      to="/signup"
                      className="flex items-center justify-center gap-2 bg-primary hover:bg-red-600 text-primary-foreground text-sm font-bold py-3 rounded-xl shadow-md shadow-red-600/20 transition-all"
                    >
                      <AlertTriangle size={15} strokeWidth={2.4} />
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
