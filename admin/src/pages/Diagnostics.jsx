import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../api/client';
import { ShieldCheck, Server, Key, PackageCheck, Tags, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const Diagnostics = () => {
    const { config, products } = useApp();
    const [health, setHealth] = useState({ status: 'loading', timestamp: null });

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await apiClient.get('/api/health');
                setHealth({ status: 'ok', timestamp: res.data.timestamp });
            } catch (error) {
                setHealth({ status: 'error', timestamp: null });
            }
        };
        checkHealth();
    }, []);

    const cards = [
        {
            title: 'Store ID Detectado',
            value: config?.general?.storeId || 'No configurado',
            icon: ShieldCheck,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            status: config?.general?.storeId ? 'success' : 'error'
        },
        {
            title: 'API Base',
            value: apiClient.defaults.baseURL || window.location.origin,
            icon: Server,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            status: 'success'
        },
        {
            title: 'Salud de la API (/api/health)',
            value: health.status === 'loading' ? 'Verificando...' : health.status === 'ok' ? 'Activo y Respondiendo' : 'Error de Conexión',
            icon: Key,
            color: health.status === 'ok' ? 'text-emerald-600' : 'text-rose-600',
            bg: health.status === 'ok' ? 'bg-emerald-50' : 'bg-rose-50',
            status: health.status === 'ok' ? 'success' : 'error'
        },
        {
            title: 'Productos Listos',
            value: `${products?.length || 0} disponibles`,
            icon: PackageCheck,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            status: (products?.length > 0) ? 'success' : 'warning'
        },
        {
            title: 'Bundles & Ofertas Activas',
            value: `${config?.bundles?.length || 0} Bundles | ${config?.smartOffers?.length || 0} Upsells`,
            icon: Tags,
            color: 'text-fuchsia-600',
            bg: 'bg-fuchsia-50',
            status: 'success'
        },
        {
            title: 'Última Sincronización',
            value: health.timestamp ? new Date(health.timestamp).toLocaleString() : 'Desconocido',
            icon: Clock,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            status: 'success'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Server className="w-6 h-6 text-indigo-500" />
                        Diagnóstico del Sistema
                    </h3>
                    <p className="text-slate-500 mt-2 text-sm">Verificá los valores actuales de tu instalación y el estado de tu conexión con el backend.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card, i) => (
                        <div key={i} className="border border-slate-100 rounded-xl p-6 bg-slate-50 shadow-sm relative overflow-hidden">
                            <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${card.bg}`}>
                                {card.status === 'success' && <CheckCircle2 className={`w-5 h-5 ${card.color}`} />}
                                {card.status === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
                                {card.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                            </div>

                            <div className="flex flex-col h-full justify-between">
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-slate-500">{card.title}</h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${card.bg}`}>
                                        <card.icon className={`w-6 h-6 ${card.color}`} />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800 break-all">{card.value}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Diagnostics;
