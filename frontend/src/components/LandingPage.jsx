import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Hero Section */}
            <section className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <svg
                            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
                            fill="currentColor"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <polygon points="50,0 100,0 50,100 0,100" />
                        </svg>

                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">Check what you</span>{' '}
                                    <span className="block text-blue-600 xl:inline">eat, instantly.</span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    Ensure food safety with our AI-powered ingredient scanner. Detect banned substances, find accredited labs, and stay informed about FSSAI regulations.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <Link
                                            to="/scan"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg transition transform hover:-translate-y-1"
                                        >
                                            Start Scanning
                                        </Link>
                                    </div>
                                    <div className="mt-3 sm:mt-0 sm:ml-3">
                                        <Link
                                            to="/labs"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg transition"
                                        >
                                            Find Labs
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-blue-50">
                    <img
                        className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full opacity-90"
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1474&q=80"
                        alt="Healthy food background"
                    />
                </div>
            </section>

            {/* Feature Section */}
            <div className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            A smarter way to verify food
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                            Our platform empowers you to make healthier choices by checking for harmful additives and authenticating food sources.
                        </p>
                    </div>

                    <div className="mt-10">
                        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                            {/* Feature 1 */}
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                                        📷
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Instant Ingredient Scan</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Simply snap a picture of any food label. Our OCR technology instantly reads the ingredients and checks them against safety databases.
                                </dd>
                            </div>

                            {/* Feature 2 */}
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                                        🚫
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Banned Substance Alert</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Automatically highlights ingredients banned by FSSAI, FDA, or EFSA, keeping you safe from harmful additives like D-ribose or Bromates.
                                </dd>
                            </div>

                            {/* Feature 3 */}
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                                        📍
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Find Testing Labs</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Locate nearby FSSAI-accredited laboratories to verify food samples professionally for adulteration.
                                </dd>
                            </div>

                            {/* Feature 4 */}
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                                        📜
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Regulatory Compliance</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Stay updated with the latest regulations and consumer rights regarding food safety and standards.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <span className="text-xl font-bold">FoodSafety Check</span>
                        <p className="text-gray-400 text-sm mt-1">Protecting what you eat.</p>
                    </div>
                    <div className="space-x-6 text-sm">
                        <a href="#" className="hover:text-gray-300">About Us</a>
                        <a href="#" className="hover:text-gray-300">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300">Contact</a>
                    </div>
                    <div className="mt-4 md:mt-0 text-gray-500 text-xs">
                        &copy; 2024 FoodSafety Check. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
