import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, MessageCircle, ShoppingCart, Target, Zap, CheckCircle2, RefreshCw, Layers, Plus } from 'lucide-react';

const API_CONFIG_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/config` : 'http://localhost:3001/api/config';
const API_PRODUCTS_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/products` : 'http://localhost:3001/api/products';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
        fetchProducts();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(API_CONFIG_URL);
            setConfig(res.data);
        } catch (e) {
            console.error("No se pudo cargar la config", e);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(API_PRODUCTS_URL);
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(API_CONFIG_URL, config);
            setTimeout(() => setSaving(false), 800);
        } catch (e) {
            alert('Error guardando configuración');
            setSaving(false);
        }
    };

    if (!config) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white font-sans"><RefreshCw className="animate-spin mr-3" /> Cargando Hache Suite...</div>;

    const SidebarItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === id
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
        >
            <Icon className="w-5 h-5 mr-3" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans flex">
            {/* SIDEBAR */}
            <div className="w-64 border-r border-zinc-800 bg-[#0a0a0a] flex flex-col items-center py-8">
                <div className="flex items-center space-x-3 mb-12">
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Hache Suite</h1>
                </div>

                <div className="w-full px-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Herramientas</p>
                    <SidebarItem id="dashboard" icon={Target} label="Dashboard" />
                    <SidebarItem id="shipping" icon={Truck} label="Geo-Barra de Envío" />
                    <SidebarItem id="minicart" icon={ShoppingCart} label="Minicart Upsell" />
                    <SidebarItem id="bundles" icon={Package} label="Bundles (Combos)" />
                    <SidebarItem id="whatsapp" icon={MessageCircle} label="Recupero WA" />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-auto bg-[#0f0f0f]">
                {/* Header */}
                <header className="px-10 py-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-md z-10">
                    <h2 className="text-2xl font-semibold text-white tracking-tight">
                        {activeTab === 'dashboard' && 'Resumen General'}
                        {activeTab === 'shipping' && 'Geo-Barra de Envío Gratis'}
                        {activeTab === 'minicart' && 'Minicart Upsell'}
                        {activeTab === 'bundles' && 'Comprados Juntos (Bundles)'}
                        {activeTab === 'whatsapp' && 'Recupero por WhatsApp'}
                    </h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </header>

                {/* Dynamic Canvas */}
                <main className="p-10 max-w-5xl">

                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                                <h3 className="text-xl font-semibold mb-2">Bienvenido a la Hache Suite</h3>
                                <p className="text-zinc-400 mb-6">Tu centro de comando para aumentar el ticket promedio y la tasa de conversión en Tiendanube sin tocar código.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                                        <Truck className="w-8 h-8 text-blue-400 mb-4" />
                                        <h4 className="font-semibold text-white">Barra de Envíos</h4>
                                        <p className="text-sm text-zinc-400 mt-1">Status: {config.shippingBar.enabled ? <span className="text-green-400">Activo</span> : <span className="text-red-400">Inactivo</span>}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                                        <ShoppingCart className="w-8 h-8 text-emerald-400 mb-4" />
                                        <h4 className="font-semibold text-white">Minicart Upsell</h4>
                                        <p className="text-sm text-zinc-400 mt-1">Status: {config.minicartUpsell.enabled ? <span className="text-green-400">Activo</span> : <span className="text-red-400">Inactivo</span>}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-white flex items-center"><Zap className="w-5 h-5 text-yellow-400 mr-2" /> Impacto: Ticket Promedio</h3>
                                    <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                                        Mostrar en tiempo real cuánto falta para el envío gratis genera urgencia. El cliente preferirá agregar un producto pequeño (Upsell) antes que pagar el envío.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={config.shippingBar.enabled} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, enabled: e.target.checked } })} />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-800">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Monto para Envío Gratis ($)</label>
                                    <input type="number" value={config.shippingBar.threshold} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, threshold: parseInt(e.target.value) } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Mensaje Inicial (Usa {"{faltante}"} para inyectar número)</label>
                                    <input type="text" value={config.shippingBar.msgInitial} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, msgInitial: e.target.value } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Mensaje de Progreso (Cerca del monto)</label>
                                    <input type="text" value={config.shippingBar.msgProgress} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, msgProgress: e.target.value } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Mensaje de Éxito (Monto superado)</label>
                                    <input type="text" value={config.shippingBar.msgSuccess} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, msgSuccess: e.target.value } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'minicart' && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-white flex items-center"><Zap className="w-5 h-5 text-yellow-400 mr-2" /> Compra de Impulso</h3>
                                    <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                                        Aparece dentro del carrito lateral un producto "gancho" que sea fácil de agregar justo antes de pagar.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={config.minicartUpsell.enabled} onChange={(e) => setConfig({ ...config, minicartUpsell: { ...config.minicartUpsell, enabled: e.target.checked } })} />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-800">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Título del Upsell</label>
                                    <input type="text" value={config.minicartUpsell.title} onChange={(e) => setConfig({ ...config, minicartUpsell: { ...config.minicartUpsell, title: e.target.value } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>

                                <div className="pt-4">
                                    <label className="block text-sm font-medium text-zinc-300 mb-3">Producto ofercido en Upsell (Uno de bajo costo)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
                                        {products.map(p => {
                                            const isSelected = config.minicartUpsell.products.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setConfig({ ...config, minicartUpsell: { ...config.minicartUpsell, products: [p.id] } })}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'}`}
                                                >
                                                    <img src={p.image} className="w-10 h-10 object-cover rounded mr-3" />
                                                    <div className="flex-1 truncate">
                                                        <p className="text-xs text-white truncate font-medium">{p.name}</p>
                                                        <p className="text-xs text-zinc-500">${p.price}</p>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-white flex items-center"><Zap className="w-5 h-5 text-yellow-400 mr-2" /> Recupero Total</h3>
                                    <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                                        Captura carritos abandonados usando webhooks y les manda un WhatsApp invisiblemente via backend tras X minutos.
                                    </p>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700">PRÓXIMAMENTE</span>
                            </div>
                            <div className="opacity-50 pointer-events-none">
                                {/* Fake form for UI mockup */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Plantilla de WhatsApp</label>
                                        <textarea rows="4" value={config.whatsappRecovery.template} onChange={() => { }} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bundles Legacy (Mockup for now) */}
                    {activeTab === 'bundles' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold mb-2">Editor de Bundles (Ex Combos)</h3>
                            <button
                                onClick={() => {
                                    const newBundle = { id: 'combo_' + Date.now(), label: 'Nuevo Bundle', discount: 10, triggers: [], products: [] };
                                    setConfig({ ...config, bundles: [...config.bundles, newBundle] });
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 font-medium rounded-lg flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Crear Bundle
                            </button>

                            {config.bundles.map((bundle, bIndex) => (
                                <div key={bundle.id} className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 shadow-xl mb-6 flex space-x-8">
                                    {/* Izquierda: Header y Triggers */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between">
                                            <input
                                                type="text"
                                                value={bundle.label}
                                                onChange={e => {
                                                    const b = [...config.bundles];
                                                    b[bIndex].label = e.target.value;
                                                    setConfig({ ...config, bundles: b });
                                                }}
                                                className="bg-transparent text-xl font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-0 px-0 pb-1 w-full"
                                                placeholder="Nombre del Bundle"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-zinc-500 block mb-1">Descuento (%)</label>
                                                <input
                                                    type="number"
                                                    value={bundle.discount}
                                                    onChange={e => {
                                                        const b = [...config.bundles];
                                                        b[bIndex].discount = parseInt(e.target.value);
                                                        setConfig({ ...config, bundles: b });
                                                    }}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-6 border-t border-zinc-800/50">
                                            <label className="text-sm font-semibold text-zinc-400 block mb-3">PRODUCTO GATILLO (Trigger)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {products.map(p => {
                                                    const isChecked = bundle.triggers.includes(p.id);
                                                    return (
                                                        <label key={p.id} className={`flex items-start space-x-2 p-2 rounded cursor-pointer transition-colors ${isChecked ? 'bg-indigo-500/10 border border-indigo-500/50' : 'hover:bg-zinc-800/50 border border-transparent'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={e => {
                                                                    const b = [...config.bundles];
                                                                    if (e.target.checked) b[bIndex].triggers.push(p.id);
                                                                    else b[bIndex].triggers = b[bIndex].triggers.filter(id => id !== p.id);
                                                                    setConfig({ ...config, bundles: b });
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex items-center space-x-2">
                                                                <img src={p.image} className="w-8 h-8 rounded object-cover" />
                                                                <span className="text-sm line-clamp-2 text-zinc-300 leading-tight">{p.name}</span>
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Derecha: Productos recomendados */}
                                    <div className="w-1/3 bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                                        <h4 className="text-sm font-semibold text-zinc-400 mb-4">MOSTRAR ESTOS PRODUCTOS JUNTOS</h4>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                            {products.map(p => {
                                                const isInCombo = bundle.products.some(cp => cp.id === p.id);
                                                return (
                                                    <div key={p.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                                                        <div className="flex items-center space-x-2 w-3/4">
                                                            <img src={p.image} className="w-8 h-8 rounded object-cover" />
                                                            <span className="text-xs truncate text-zinc-300">{p.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const b = [...config.bundles];
                                                                if (isInCombo) b[bIndex].products = b[bIndex].products.filter(cp => cp.id !== p.id);
                                                                else b[bIndex].products.push({ id: p.id, name: p.name, price: p.price, image: p.image, variant_id: p.variant_id });
                                                                setConfig({ ...config, bundles: b });
                                                            }}
                                                            className={`p-1.5 rounded-full ${isInCombo ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'}`}
                                                        >
                                                            {isInCombo ? 'Quitar' : 'Agregar'}
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <button
                                            onClick={() => {
                                                const b = [...config.bundles];
                                                b.splice(bIndex, 1);
                                                setConfig({ ...config, bundles: b });
                                            }}
                                            className="w-full mt-6 text-sm text-red-400 hover:text-red-300 py-2 border border-red-900/50 hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            Eliminar Bundle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}

export default App;
