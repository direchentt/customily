import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Bundles from './pages/Bundles';
import Offers from './pages/Offers';
import { RefreshCw, AlertCircle } from 'lucide-react';

const AdminShell = () => {
    const { loading, config, error, refreshData } = useApp();
    const [activeTab, setActiveTab] = useState('dashboard');

    if (loading) {
        return (
            <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans tracking-wide">
                <RefreshCw className="animate-spin mb-4 text-indigo-500 w-10 h-10" />
                <p className="font-bold text-slate-400">Conectando con el servidor...</p>
                <p className="text-xs text-slate-400 mt-2">(Esto puede tardar hasta 1 minuto si el servicio está en cold start)</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans p-10">
                <AlertCircle className="mb-4 text-rose-500 w-12 h-12" />
                <p className="font-bold text-slate-800 text-center max-w-md">{error}</p>
                <button
                    onClick={refreshData}
                    className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Reintentar conexión
                </button>
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex antialiased">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 overflow-auto bg-slate-50 relative">
                <Header activeTab={activeTab} />
                <main className="p-12 max-w-6xl mx-auto">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'bundles' && <Bundles />}
                    {activeTab === 'offers' || activeTab === 'shipping' || activeTab === 'gifts' ? <Offers /> : null}
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            <AdminShell />
        </AppProvider>
    );
}

export default App;
