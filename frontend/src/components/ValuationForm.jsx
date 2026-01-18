'use client';

import { useState } from 'react';

// Industry options matching the trained model
const INDUSTRIES = [
    'Cybersecurity',
    'E-Commerce',
    'EdTech',
    'FinTech',
    'Gaming',
    'HealthTech',
    'IoT'
];

// Region options
const REGIONS = [
    'North America',
    'Europe',
    'Australia',
    'South America'
];

// Exit status options
const EXIT_STATUSES = [
    { value: 'Private', label: 'Private (Not Yet Exited)' },
    { value: 'IPO', label: 'IPO / Public' }
];

// Loading Spinner Component
const LoadingSpinner = () => (
    <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

// High Potential Badge Component
const HighPotentialBadge = () => (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-semibold text-sm shadow-lg animate-pulse">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>High Potential Startup!</span>
    </div>
);

// Format currency for display
const formatCurrency = (value) => {
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
};

// Input field styles
const inputStyles = "w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300";
const selectStyles = "w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 appearance-none cursor-pointer";
const labelStyles = "block text-sm font-medium text-gray-200 mb-2";

export default function ValuationForm() {
    const [formData, setFormData] = useState({
        funding_rounds: '',
        funding_amount: '',
        revenue: '',
        employees: '',
        market_share: '',
        profitable: false,
        year_founded: '',
        industry: '',
        region: 'North America',
        exit_status: 'Private'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('http://localhost:4000/api/estimate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    funding_rounds: parseInt(formData.funding_rounds) || 1,
                    funding_amount: parseFloat(formData.funding_amount) || 0,
                    revenue: parseFloat(formData.revenue),
                    employees: parseInt(formData.employees),
                    market_share: parseFloat(formData.market_share) || 0,
                    profitable: formData.profitable,
                    year_founded: parseInt(formData.year_founded) || new Date().getFullYear(),
                    industry: formData.industry,
                    region: formData.region,
                    exit_status: formData.exit_status
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to calculate valuation');
            }

            setResult(data);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isHighPotential = result?.data?.valuation > 10_000_000;

    // Dropdown arrow SVG for selects
    const selectArrowStyle = {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 1rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em'
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Form Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Section: Company Overview */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Company Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Industry Select */}
                            <div>
                                <label htmlFor="industry" className={labelStyles}>
                                    Industry *
                                </label>
                                <select
                                    id="industry"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    required
                                    className={selectStyles}
                                    style={selectArrowStyle}
                                >
                                    <option value="" disabled className="text-gray-900">Select industry</option>
                                    {INDUSTRIES.map(industry => (
                                        <option key={industry} value={industry} className="text-gray-900">
                                            {industry}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Region Select */}
                            <div>
                                <label htmlFor="region" className={labelStyles}>
                                    Region
                                </label>
                                <select
                                    id="region"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    className={selectStyles}
                                    style={selectArrowStyle}
                                >
                                    {REGIONS.map(region => (
                                        <option key={region} value={region} className="text-gray-900">
                                            {region}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Founded */}
                            <div>
                                <label htmlFor="year_founded" className={labelStyles}>
                                    Year Founded
                                </label>
                                <input
                                    type="number"
                                    id="year_founded"
                                    name="year_founded"
                                    value={formData.year_founded}
                                    onChange={handleInputChange}
                                    placeholder={`e.g., ${new Date().getFullYear() - 3}`}
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    className={inputStyles}
                                />
                            </div>

                            {/* Employees */}
                            <div>
                                <label htmlFor="employees" className={labelStyles}>
                                    Number of Employees *
                                </label>
                                <div className="relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <input
                                        type="number"
                                        id="employees"
                                        name="employees"
                                        value={formData.employees}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 50"
                                        required
                                        min="1"
                                        className={`${inputStyles} pl-12`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10"></div>

                    {/* Section: Financial Metrics */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Financial Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Revenue Input */}
                            <div>
                                <label htmlFor="revenue" className={labelStyles}>
                                    Annual Revenue (Million USD) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        id="revenue"
                                        name="revenue"
                                        value={formData.revenue}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 5.5"
                                        required
                                        min="0"
                                        step="0.01"
                                        className={`${inputStyles} pl-8`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">M</span>
                                </div>
                            </div>

                            {/* Funding Amount */}
                            <div>
                                <label htmlFor="funding_amount" className={labelStyles}>
                                    Total Funding Raised (Million USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        id="funding_amount"
                                        name="funding_amount"
                                        value={formData.funding_amount}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 10"
                                        min="0"
                                        step="0.01"
                                        className={`${inputStyles} pl-8`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">M</span>
                                </div>
                            </div>

                            {/* Funding Rounds */}
                            <div>
                                <label htmlFor="funding_rounds" className={labelStyles}>
                                    Number of Funding Rounds
                                </label>
                                <input
                                    type="number"
                                    id="funding_rounds"
                                    name="funding_rounds"
                                    value={formData.funding_rounds}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 2"
                                    min="0"
                                    className={inputStyles}
                                />
                            </div>

                            {/* Market Share */}
                            <div>
                                <label htmlFor="market_share" className={labelStyles}>
                                    Market Share (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        id="market_share"
                                        name="market_share"
                                        value={formData.market_share}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2.5"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className={inputStyles}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10"></div>

                    {/* Section: Status */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Company Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Exit Status */}
                            <div>
                                <label htmlFor="exit_status" className={labelStyles}>
                                    Exit Status
                                </label>
                                <select
                                    id="exit_status"
                                    name="exit_status"
                                    value={formData.exit_status}
                                    onChange={handleInputChange}
                                    className={selectStyles}
                                    style={selectArrowStyle}
                                >
                                    {EXIT_STATUSES.map(status => (
                                        <option key={status.value} value={status.value} className="text-gray-900">
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Profitable Toggle */}
                            <div className="flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="profitable"
                                        name="profitable"
                                        checked={formData.profitable}
                                        onChange={handleInputChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500"></div>
                                    <span className="ms-3 text-sm font-medium text-gray-200">Currently Profitable</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-right text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                <span>Calculating Valuation...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Calculate Valuation</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-center animate-fadeIn">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Result Card */}
            {result && result.success && (
                <div className="mt-8 animate-slideUp">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/20 rounded-3xl p-8 shadow-2xl">
                        {/* High Potential Badge */}
                        {isHighPotential && (
                            <div className="flex justify-center mb-6">
                                <HighPotentialBadge />
                            </div>
                        )}

                        {/* Valuation Display */}
                        <div className="text-center">
                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                                Estimated Valuation
                            </p>
                            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                                {formatCurrency(result.data.valuation)}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Based on your inputs for {result.data.input.industry} industry in {result.data.input.region}
                            </p>
                        </div>

                        {/* Input Summary - Top Row */}
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Revenue</p>
                                <p className="text-white font-semibold">${result.data.input.revenue}M</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Funding</p>
                                <p className="text-white font-semibold">${result.data.input.funding_amount}M</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Team</p>
                                <p className="text-white font-semibold">{result.data.input.employees} people</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Market Share</p>
                                <p className="text-white font-semibold">{result.data.input.market_share}%</p>
                            </div>
                        </div>

                        {/* Input Summary - Bottom Row */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Industry</p>
                                <p className="text-white font-semibold text-sm">{result.data.input.industry}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Region</p>
                                <p className="text-white font-semibold text-sm">{result.data.input.region}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</p>
                                <p className="text-white font-semibold text-sm">{result.data.input.exit_status}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Profitable</p>
                                <p className={`font-semibold text-sm ${result.data.input.profitable ? 'text-green-400' : 'text-gray-400'}`}>
                                    {result.data.input.profitable ? 'Yes ✓' : 'No'}
                                </p>
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-green-400 text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Saved to your valuation history</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
