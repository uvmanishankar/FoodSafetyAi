import { Leaf, Github, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const links = {
  Explore: [
    { label: 'Analyze Product',  to: '/analyze' },
    { label: 'Testing Guide',    to: '/testing-guide' },
    { label: 'Diet & Nutrition',  to: '/nutrition' },
    { label: 'Safety Alerts',    to: '/alerts' },
  ],
  Learn: [
    { label: 'Food Awareness',  to: '/food-awareness' },
    { label: 'Foodborne Illness', to: '/foodborne' },
    { label: 'OpenFoodFacts', href: 'https://world.openfoodfacts.org', external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Leaf className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-base">FoodSafety AI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              AI-powered food safety analysis. Know exactly what's in your food and make informed choices.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-4">
              Product data via{' '}
              <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors">
                OpenFoodFacts
              </a>{' '}(ODbL license).
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-display text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item: any) => (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.label}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        to={item.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} FoodSafety AI. For informational purposes only.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Built with React + TypeScript + Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
}
