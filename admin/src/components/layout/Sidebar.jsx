import React from 'react';
import { Target, Truck, Gift, Zap, Package, MessageCircle, Layers } from 'lucide-react';

const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center px-4 py-3.5 mb-2 text-sm font-semibold rounded-xl transition-all ${activeTab === id
                ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100 border border-indigo-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
    >
        <Icon className={`w-5 h-5 mr-3 transition-colors ${activeTab === id ? 'text-indigo-600' : 'text-slate-400'}`} />
        {label}
    </button>
);

const Sidebar = ({ activeTab, setActiveTab }) => {
    return (
        <div className="w-72 border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col items-center py-8 z-20">
            <div className="flex items-center space-x-3 mb-10 w-full px-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Layers className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 text-left">Hache Suite</h1>
            </div>

            <div className="w-full px-5 space-y-1">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 mt-4">Plataforma</p>
                <SidebarItem id="dashboard" icon={Target} label="Panel General" activeTab={activeTab} setActiveTab={setActiveTab} />

                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 mt-8 border-t border-slate-100 pt-6">Módulos de Upsell</p>
                <SidebarItem id="offers" icon={Zap} label="Constructor de Ofertas" activeTab={activeTab} setActiveTab={setActiveTab} />
                <SidebarItem id="bundles" icon={Package} label="Packs Frecuentes" activeTab={activeTab} setActiveTab={setActiveTab} />

                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 mt-8 border-t border-slate-100 pt-6">Configuración</p>
                <SidebarItem id="shipping" icon={Truck} label="Barra Envíos" activeTab={activeTab} setActiveTab={setActiveTab} />
                <SidebarItem id="gifts" icon={Gift} label="Regalos" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
        </div>
    );
};

export default Sidebar;
