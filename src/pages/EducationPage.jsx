import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Apple, AlertTriangle, Microscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import NutritionPage from './NutritionPage';
import FoodAwarenessPage from './FoodAwarenessPage';
import FoodbornePage from './FoodbornePage';

const TABS = [
  { id: 'nutrition', label: 'Nutrition', icon: <Apple className="h-4 w-4" />, color: 'text-emerald-600' },
  { id: 'awareness', label: 'Awareness', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-600' },
  { id: 'foodborne', label: 'Diseases', icon: <Microscope className="h-4 w-4" />, color: 'text-red-600' },
];

export default function EducationPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('nutrition');

  // Set tab based on current route
  useEffect(() => {
    if (location.pathname.includes('/awareness')) {
      setActiveTab('awareness');
    } else if (location.pathname.includes('/foodborne')) {
      setActiveTab('foodborne');
    } else {
      setActiveTab('nutrition');
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/50 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Tab navigation */}
          <div className="flex gap-2 p-1.5 bg-muted/50 rounded-xl border border-border/60 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className={cn('transition-colors', activeTab === tab.id && tab.color)}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in pt-4">
        {activeTab === 'nutrition' && <NutritionPageContent />}
        {activeTab === 'awareness' && <FoodAwarenessPageContent />}
        {activeTab === 'foodborne' && <FoodbornPageContent />}
      </div>
    </div>
  );
}

// Wrapper components that render the original pages
function NutritionPageContent() {
  return <div className="contents"><NutritionPage /></div>;
}

function FoodAwarenessPageContent() {
  return <div className="contents"><FoodAwarenessPage /></div>;
}

function FoodbornPageContent() {
  return <div className="contents"><FoodbornePage /></div>;
}
