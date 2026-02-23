import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header = ({ activeTab }) => {
    const { saving, saveConfig } = useApp();

    const titles = {
        dashboard: 'Tu Resumen de Ventas',
        shipping: 'Barra Envíos Gratis',
        gifts: 'Regalo Automático',
        offers: 'Ofertas Emergentes',
        bundles: 'Packs "Comprados Juntos"',
        diagnostics: 'Diagnóstico del Sistema',
    };

    const subtitles = {
        dashboard: 'El motor oculto de tu ticket promedio.',
        shipping: 'Incentiva a tus clientes visualmente.',
        gifts: 'Regalá un producto sorpresa.',
        offers: 'Construye pop ups irresistibles.',
        bundles: 'Sugiere productos debajo del carrito.',
        diagnostics: 'Estado de conexión técnica de Hache Suite.',
    };

    return (
        <header className="px-12 py-7 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {titles[activeTab] || 'Panel de Administración'}
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                    {subtitles[activeTab] || 'Gestiona tu estrategia de ventas.'}
                </p>
            </div>

            <button
                onClick={() => saveConfig()}
                disabled={saving}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
            >
                {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                {saving ? 'Guardando...' : 'Aplicar Cambios en Vivo'}
            </button>
        </header>
    );
};

export default Header;
