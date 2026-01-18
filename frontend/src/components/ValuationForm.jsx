'use client';

import { useState } from 'react';
import axios from 'axios';

// Industry options
const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'FinTech',
    'E-commerce',
    'EdTech',
    'Cybersecurity',
    'Gaming',
    'IoT',
    'Other'
];

// Format currency
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

export default function ValuationForm() {
    const [formData, setFormData] = useState({
        revenue: '',
        team_size: '',
        industry: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Submit to Express Backend on port 4000
            const response = await axios.post('http://localhost:4000/api/estimate', {
                revenue: parseFloat(formData.revenue),
                team_size: parseInt(formData.team_size),
                industry: formData.industry
            });

            if (response.data.success) {
                setResult(response.data);
            } else {
                throw new Error(response.data.message || 'Failed to calculate valuation');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Form Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Revenue Input */}
                    <div className="space-y-2">
                        <label htmlFor="revenue" className="block text-sm font-medium text-gray-200">
                            Annual Revenue (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                id="revenue"
                                name="revenue"
                                value={formData.revenue}
                                onChange={handleInputChange}
                                placeholder="Enter annual revenue"
                                required
                                min="0"
                                step="1000"
                                className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Team Size Input */}
                    <div className="space-y-2">
                        <label htmlFor="team_size" className="block text-sm font-medium text-gray-200">
                            Team Size
                        </label>
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="number"
                                id="team_size"
                                name="team_size"
                                value={formData.team_size}
                                onChange={handleInputChange}
                                placeholder="Number of employees"
                                required
                                min="1"
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Industry Select */}
                    <div className="space-y-2">
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-200">
                            Industry
                        </label>
                        <select
                            id="industry"
                            name="industry"
                            value={formData.industry}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 1rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em'
                            }}
                        >
                            <option value="" disabled className="text-gray-900">Select industry</option>
                            {INDUSTRIES.map(industry => (
                                <option key={industry} value={industry} className="text-gray-900">
                                    {industry}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-right text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Calculating...</span>
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
                <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-center">
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
                <div className="mt-8">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/20 rounded-3xl p-8 shadow-2xl">
                        {/* Valuation Display */}
                        <div className="text-center">
                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                                Estimated Valuation
                            </p>
                            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                                {formatCurrency(result.data.valuation)}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Based on your inputs for {result.data.input.industry} industry
                            </p>
                        </div>

                        {/* Input Summary */}
                        <div className="mt-8 grid grid-cols-3 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Revenue</p>
                                <p className="text-white font-semibold">{formatCurrency(result.data.input.revenue)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Industry</p>
                                <p className="text-white font-semibold">{result.data.input.industry}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Team</p>
                                <p className="text-white font-semibold">{result.data.input.team_size} people</p>
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
