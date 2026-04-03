import { Link, useLocation } from 'react-router-dom';
import { Bell, ScanLine, Menu, X, Leaf, ChevronRight, Microscope, Eye, Activity, Heart, FileText } from 'lucide-react';
import { Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/',             label: 'Home',          icon: Home },
  { to: '/analyze',        label: 'Analyze',        icon: ScanLine },
  { to: '/testing-guide',  label: 'Testing Guide',  icon: Microscope },
  { to: '/nutrition',      label: 'Nutrition',      icon: Heart },
  { to: '/awareness',      label: 'Awareness',      icon: Eye },
  { to: '/foodborne',      label: 'Diseases',       icon: Activity },
  { to: '/alerts',         label: 'Alerts',         icon: Bell },
  { to: '/complaint',      label: 'Complaint',      icon: FileText },
];

export default function Header() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'glass border-b border-border/60 shadow-md py-0'
            : 'bg-transparent py-1'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300',
                'gradient-primary shadow-glow group-hover:shadow-glow-lg group-hover:scale-105'
              )}>
                <Leaf className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-800 text-base text-foreground tracking-tight">
                  FoodSafety
                </span>
                <span className="text-[10px] font-semibold text-primary/80 tracking-widest uppercase leading-none -mt-0.5">
                  AI
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map(({ to, label }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      active
                        ? 'text-primary bg-primary/8'
                        : 'text-foreground/65 hover:text-foreground hover:bg-foreground/5'
                    )}
                  >
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                    )}
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                to="/analyze"
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold',
                  'gradient-primary text-white shadow-glow hover:shadow-glow-lg hover:opacity-90',
                  'transition-all duration-200'
                )}
              >
                <ScanLine className="h-3.5 w-3.5" />
                Analyze Product
              </Link>

              <button
                aria-label="Toggle menu"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/8 transition-all"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed top-0 right-0 bottom-0 z-50 w-72 glass border-l border-border/60 shadow-xl md:hidden',
        'transition-transform duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Leaf className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-sm">FoodSafety AI</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/8"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium',
                    'transition-all duration-150 group',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    active ? 'bg-primary/15' : 'bg-foreground/6 group-hover:bg-foreground/10'
                  )}>
                    <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-foreground/60')} />
                  </span>
                  {label}
                  <ChevronRight className={cn(
                    'ml-auto h-3.5 w-3.5 transition-opacity',
                    active ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50'
                  )} />
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="p-4 border-t border-border/60">
            <Link
              to="/analyze"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow"
            >
              <ScanLine className="h-4 w-4" />
              Analyze a Product
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
