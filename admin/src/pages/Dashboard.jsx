import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { analyticsAPI } from '../api/client';
import { Truck, Zap, Package, Gift, RefreshCw } from 'lucide-react';

const StatsCard = ({ label, value, icon, color }) => (
    <div className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-5 text-center`}>
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-3xl font-black text-slate-900">{value}</div>
        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
);

const Dashboard = () => {
    const { config, loading } = useApp();
    const [stats, setStats] = useState(null);
    const [fetchingStats, setFetchingStats] = useState(false);

    const fetchStats = async () => {
        setFetchingStats(true);
        try {
            const res = await analyticsAPI.getStats();
            setStats(res.data);
        } catch (e) {
            console.error('Error fetching stats:', e);
        } finally {
            setFetchingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
                <h3 className="text-2xl font-bold mb-3 text-slate-900">¡Hache Suite está andando! 🚀</h3>
                <p className="text-slate-600 mb-10 text-lg">
                    Este es tu centro de comandos para encender o apagar estrategias de Ticket Promedio.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <ModuleStatusCard
                        title="Barra de Envíos"
                        enabled={config.shippingBar?.enabled}
                        icon={Truck}
                        color="blue"
                        statusText={config.shippingBar?.enabled ? 'Encendida' : 'Apagada'}
                    />
                    <ModuleStatusCard
                        title="Ofertas Inteligentes"
                        enabled={config.modules?.offersEnabled !== false && config.smartOffers?.length > 0}
                        icon={Zap}
                        color="emerald"
                        statusText={`${config.smartOffers?.length || 0} activas`}
                    />
                    <ModuleStatusCard
                        title="Packs Juntos"
                        enabled={config.modules?.bundlesEnabled !== false && config.bundles?.length > 0}
                        icon={Package}
                        color="indigo"
                        statusText={`${config.bundles?.length || 0} activos`}
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">📊 Analytics en Vivo</h3>
                        <p className="text-sm text-slate-500 mt-1">Últimos 30 días de actividad.</p>
                    </div>
                    <button onClick={fetchStats} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        <RefreshCw className={`w-3 h-3 ${fetchingStats ? 'animate-spin' : ''}`} /> Actualizar
                    </button>
                </div>

                {!stats ? (
                    <div className="text-center text-slate-400 py-12">
                        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-30" />
                        <p className="text-sm">Cargando datos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatsCard label="Impresiones" value={stats.summary?.view || 0} icon="👁️" color="blue" />
                        <StatsCard label="Combos Agregados" value={stats.summary?.added_combo || 0} icon="🛒" color="emerald" />
                        <StatsCard label="Ofertas Vistas" value={stats.summary?.offer_view || 0} icon="⚡" color="amber" />
                        <StatsCard label="Ofertas Clickeadas" value={stats.summary?.offer_add || 0} icon="🎯" color="rose" />
                    </div>
                )}
            </div>
        </div>
    );
};

const ModuleStatusCard = ({ title, enabled, icon: Icon, color, statusText }) => (
    <div className={`p-6 rounded-2xl border transition-all ${enabled ? `bg-${color}-50/50 border-${color}-100 shadow-sm` : 'bg-slate-50 border-slate-100 opacity-60'}`}>
        <Icon className={`w-10 h-10 mb-5 ${enabled ? `text-${color}-500` : 'text-slate-400'}`} />
        <h4 className="font-bold text-slate-900 text-lg mb-1">{title}</h4>
        <p className="text-sm font-medium text-slate-500 lowercase">Status: {statusText}</p>
    </div>
);

export default Dashboard;
