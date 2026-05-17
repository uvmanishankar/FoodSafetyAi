import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Scanner from './components/Scanner';
import LabLocator from './components/LabLocator';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-100">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
              FoodSafety Check
            </Link>
            <div className="space-x-1 md:space-x-4 flex items-center">
              <Link to="/scan" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition">Scan</Link>
              <Link to="/labs" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition">Labs</Link>
              <Link to="/scan" className="hidden md:inline-block bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-md hover:shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/labs" element={<LabLocator />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
