import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, MessageCircle, ShoppingCart, Target, Zap, CheckCircle2, RefreshCw, Layers, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const API_CONFIG_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/config` : 'http://localhost:3001/api/config';
const API_PRODUCTS_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/products` : 'http://localhost:3001/api/products';
const API_WA_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/whatsapp` : 'http://localhost:3001/api/whatsapp';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [waState, setWaState] = useState('DISCONNECTED');
    const [waQr, setWaQr] = useState(null);
    const [testPhone, setTestPhone] = useState('');
    const [testingWa, setTestingWa] = useState(false);

    useEffect(() => {
        fetchConfig();
        fetchProducts();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(API_CONFIG_URL);
            // Ensure defaults if a tab is missing
            let c = res.data;
            if (!c.smartOffers) c.smartOffers = [];
            if (!c.shippingBar.placements) c.shippingBar.placements = ['minicart'];
            if (!c.shippingBar.style) c.shippingBar.style = 1;
            if (!c.shippingBar.color) c.shippingBar.color = '#000000';
            setConfig(c);
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

    useEffect(() => {
        let waInterval;
        if (activeTab === 'whatsapp') {
            const checkWa = async () => {
                try {
                    const res = await axios.get(`${API_WA_URL}/status`);
                    setWaState(res.data.status);
                    setWaQr(res.data.qr);
                } catch (e) { }
            };
            checkWa();
            waInterval = setInterval(checkWa, 3000);
        }
        return () => clearInterval(waInterval);
    }, [activeTab]);

    const handleStartWA = async () => {
        try { await axios.post(`${API_WA_URL}/start`); setWaState('CONNECTING'); } catch (e) { }
    };

    const handleStopWA = async () => {
        try { await axios.post(`${API_WA_URL}/stop`); setWaState('DISCONNECTED'); } catch (e) { }
    };

    const sendTestMessage = async () => {
        if (!testPhone) return alert('Ingresa un teléfono.');
        setTestingWa(true);
        try {
            const finalMsg = config.whatsappRecovery?.template
                ? config.whatsappRecovery.template.replace('{nombre}', 'Prueba').replace('{link}', 'hachedhe.com.ar/test').replace('{total}', '$150.000')
                : 'Mensaje de prueba.';
            const res = await axios.post(`${API_WA_URL}/send-test`, { phone: testPhone, message: finalMsg });
            if (res.data.success) alert('Enviado correctamente!');
            else alert(res.data.error || 'Error desconocido');
        } catch (e) {
            alert(e.response?.data?.error || 'No se pudo enviar el mensaje.');
        }
        setTestingWa(false);
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
                    <SidebarItem id="dashboard" icon={Target} label="Inicio" />
                    <SidebarItem id="shipping" icon={Truck} label="Barra Envíos" />
                    <SidebarItem id="offers" icon={Zap} label="Ofertas Estratégicas" />
                    <SidebarItem id="bundles" icon={Package} label="Comprados Juntos" />
                    <SidebarItem id="whatsapp" icon={MessageCircle} label="Recupero WA" />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-auto bg-[#0f0f0f]">
                {/* Header */}
                <header className="px-10 py-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-md z-10">
                    <h2 className="text-2xl font-semibold text-white tracking-tight">
                        {activeTab === 'dashboard' && 'Resumen General'}
                        {activeTab === 'shipping' && 'Configuración: Barra Envíos Gratis'}
                        {activeTab === 'offers' && 'Ofertas Estratégicas (Funnels)'}
                        {activeTab === 'bundles' && 'Sección "Comprados Juntos"'}
                        {activeTab === 'whatsapp' && 'Recupero Automático WhatsApp'}
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
                                <h3 className="text-xl font-semibold mb-2">Un ecosistema de ventas nativo</h3>
                                <p className="text-zinc-400 mb-6">Módulos avanzados diseñados para aumentar tu Ticket Promedio sin depender de descuentos.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                                        <Truck className="w-8 h-8 text-blue-400 mb-4" />
                                        <h4 className="font-semibold text-white">Barra de Envíos</h4>
                                        <p className="text-sm text-zinc-400 mt-1">Status: {config.shippingBar?.enabled ? <span className="text-green-400">Activa</span> : <span className="text-red-400">Inactiva</span>}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                                        <Zap className="w-8 h-8 text-emerald-400 mb-4" />
                                        <h4 className="font-semibold text-white">Ofertas Activas</h4>
                                        <p className="text-sm text-zinc-400 mt-1">{config.smartOffers?.length || 0} campañas corriendo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-white">Diseño y Configuración</h3>
                                    <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                                        Incentivo visual dinámico para incrementar el AOV forzando al usuario a llegar al mínimo.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={config.shippingBar.enabled} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, enabled: e.target.checked } })} />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-800">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Monto para Envío Gratis ($)</label>
                                        <input type="number" value={config.shippingBar.threshold} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, threshold: parseInt(e.target.value) } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Color Principal (Barra)</label>
                                        <div className="flex items-center space-x-3">
                                            <input type="color" value={config.shippingBar.color || '#000000'} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, color: e.target.value } })} className="h-10 w-10 border-0 bg-transparent rounded cursor-pointer" />
                                            <span className="text-zinc-500 font-mono">{config.shippingBar.color || '#000000'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Estilo Visual</label>
                                        <select value={config.shippingBar.style || 1} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, style: parseInt(e.target.value) } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                                            <option value={1}>Variante 1 - Clásica Delgada</option>
                                            <option value={2}>Variante 2 - Minimalista (Bordes redondeados)</option>
                                            <option value={3}>Variante 3 - Premium Animada</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Mensajes Dinámicos</label>
                                        <input type="text" value={config.shippingBar.msgInitial} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, msgInitial: e.target.value } })} placeholder="Inicio: ¡Estás a {faltante} del envío libre!" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-2" />
                                        <input type="text" value={config.shippingBar.msgProgress} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, msgProgress: e.target.value } })} placeholder="Progreso: Sólo {faltante} más para Envío Gratis" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-2" />
                                        <input type="text" value={config.shippingBar.msgSuccess} onChange={(e) => setConfig({ ...config, shippingBar: { ...config.shippingBar, msgSuccess: e.target.value } })} placeholder="Éxito: ¡Tenés Envío Gratis!" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-green-400 focus:outline-none focus:border-green-500" />
                                    </div>
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Ubicaciones (Dónde mostrarla)</label>
                                        <label className="flex items-center space-x-2 text-zinc-400 text-sm mb-1">
                                            <input type="checkbox" checked={config.shippingBar.placements?.includes('minicart')} onChange={(e) => {
                                                const p = config.shippingBar.placements || [];
                                                setConfig({ ...config, shippingBar: { ...config.shippingBar, placements: e.target.checked ? [...p, 'minicart'] : p.filter(x => x !== 'minicart') } })
                                            }} /> <span>Dentro del Carrito Lateral (Minicart)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-zinc-400 text-sm mb-1">
                                            <input type="checkbox" checked={config.shippingBar.placements?.includes('pdp')} onChange={(e) => {
                                                const p = config.shippingBar.placements || [];
                                                setConfig({ ...config, shippingBar: { ...config.shippingBar, placements: e.target.checked ? [...p, 'pdp'] : p.filter(x => x !== 'pdp') } })
                                            }} /> <span>En la Página de Producto (Debajo de agregar)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* PREVISUALIZADOR EN VIVO */}
                            <div className="pt-8 border-t border-zinc-800">
                                <h4 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Previsualización en vivo</h4>
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 flex items-center justify-center">
                                    <div className="w-full max-w-sm" style={{ backgroundColor: '#fff', borderRadius: config.shippingBar.style === 3 ? '20px' : (config.shippingBar.style === 2 ? '8px' : '0px'), overflow: 'hidden', padding: '12px 15px', border: '1px solid #e5e5e5' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '8px', textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
                                            Estás a <b style={{ fontWeight: '700', color: config.shippingBar.color || '#000' }}>$15.000</b> del ENVÍO GRATIS
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: config.shippingBar.color || '#000', width: '75%', transition: 'width 0.4s ease' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'offers' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1 flex items-center">Ofertas por Contexto (Max 10)</h3>
                                    <p className="text-zinc-400 text-sm">Mostrá productos recomendados exactos, en lugares exactos, cuando el cliente suma combos clave.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (config.smartOffers.length >= 10) return alert('Máximo 10 ofertas permitidas por ahora.');
                                        const newOffer = { id: 'offer_' + Date.now(), name: 'Nueva Campaña de Upsell', triggers: [], offerProduct: null, title: 'COMPLETÁ TU RUTINA:', placements: ['minicart'] };
                                        setConfig({ ...config, smartOffers: [...config.smartOffers, newOffer] });
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 font-medium rounded-lg flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Crear Oferta Nueva
                                </button>
                            </div>

                            {config.smartOffers.map((offer, oIndex) => {
                                const isExpanded = offer._expanded !== false; // Para achicar si son muchas
                                const selectedProdObj = products.find(p => p.id === offer.offerProduct || p.id === offer.offerProduct?.id);

                                return (
                                    <div key={offer.id} className="bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-xl mb-4 overflow-hidden transition-all duration-300">
                                        <div className="p-4 bg-zinc-800/20 border-b border-zinc-800 flex justify-between items-center cursor-pointer" onClick={() => {
                                            const n = [...config.smartOffers];
                                            n[oIndex]._expanded = !isExpanded;
                                            setConfig({ ...config, smartOffers: n });
                                        }}>
                                            <div className="flex items-center">
                                                <Zap className="w-5 h-5 text-indigo-400 mr-3" />
                                                <h4 className="font-semibold text-lg text-white">{offer.name || 'Sin título'}</h4>
                                            </div>
                                            <div className="text-zinc-500 flex items-center">
                                                {selectedProdObj && <img src={selectedProdObj.image} className="w-8 h-8 rounded object-cover mr-4" />}
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-6 flex space-x-8">
                                                {/* LEFT COL: General Data */}
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <label className="text-xs text-zinc-500 block mb-1">Nombre Interno de la Campaña</label>
                                                        <input type="text" value={offer.name} onChange={e => { const n = [...config.smartOffers]; n[oIndex].name = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-500 block mb-1">Título Visual para el cliente (Ej: ¡Agregá esto también!)</label>
                                                        <input type="text" value={offer.title} onChange={e => { const n = [...config.smartOffers]; n[oIndex].title = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
                                                    </div>

                                                    <div className="pt-2">
                                                        <label className="text-xs text-emerald-400 block mb-2 font-bold uppercase tracking-wider">Estilo de Oferta visual</label>
                                                        <select value={offer.style || 'light'} onChange={e => { const n = [...config.smartOffers]; n[oIndex].style = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500 mb-2">
                                                            <option value="light">Clásico Transparente (Light)</option>
                                                            <option value="dark">Elegancia Oscura (Dark Mode)</option>
                                                            <option value="glow">Premium Gradient (Llama la atención)</option>
                                                            <option value="custom">100% Personalizado (Libertad de Colores)</option>
                                                        </select>
                                                        {offer.style === 'custom' && (
                                                            <div className="grid grid-cols-2 gap-3 mt-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-inner">
                                                                <div>
                                                                    <label className="text-[10px] text-zinc-500 block mb-1 font-semibold uppercase">Fondo de Tarjeta</label>
                                                                    <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                                                                        <input type="color" value={offer.colors?.bg || '#ffffff'} onChange={e => { const n = [...config.smartOffers]; if (!n[oIndex].colors) n[oIndex].colors = {}; n[oIndex].colors.bg = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="h-6 w-full border-0 bg-transparent rounded cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-zinc-500 block mb-1 font-semibold uppercase">Color de Textos</label>
                                                                    <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                                                                        <input type="color" value={offer.colors?.text || '#111111'} onChange={e => { const n = [...config.smartOffers]; if (!n[oIndex].colors) n[oIndex].colors = {}; n[oIndex].colors.text = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="h-6 w-full border-0 bg-transparent rounded cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-zinc-500 block mb-1 font-semibold uppercase">Botón Agregar</label>
                                                                    <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                                                                        <input type="color" value={offer.colors?.btnBg || '#000000'} onChange={e => { const n = [...config.smartOffers]; if (!n[oIndex].colors) n[oIndex].colors = {}; n[oIndex].colors.btnBg = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="h-6 w-full border-0 bg-transparent rounded cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-zinc-500 block mb-1 font-semibold uppercase">Texto Botón</label>
                                                                    <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                                                                        <input type="color" value={offer.colors?.btnText || '#ffffff'} onChange={e => { const n = [...config.smartOffers]; if (!n[oIndex].colors) n[oIndex].colors = {}; n[oIndex].colors.btnText = e.target.value; setConfig({ ...config, smartOffers: n }); }} className="h-6 w-full border-0 bg-transparent rounded cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-2">
                                                        <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Ubicación (Dónde)</label>
                                                        <div className="flex space-x-4">
                                                            <label className="flex items-center space-x-2 text-sm text-zinc-300">
                                                                <input type="checkbox" checked={offer.placements?.includes('minicart')} onChange={e => {
                                                                    const arr = offer.placements || [];
                                                                    const n = [...config.smartOffers]; n[oIndex].placements = e.target.checked ? [...arr, 'minicart'] : arr.filter(x => x !== 'minicart');
                                                                    setConfig({ ...config, smartOffers: n });
                                                                }} /> <span>Minicart</span>
                                                            </label>
                                                            <label className="flex items-center space-x-2 text-sm text-zinc-300">
                                                                <input type="checkbox" checked={offer.placements?.includes('pdp')} onChange={e => {
                                                                    const arr = offer.placements || [];
                                                                    const n = [...config.smartOffers]; n[oIndex].placements = e.target.checked ? [...arr, 'pdp'] : arr.filter(x => x !== 'pdp');
                                                                    setConfig({ ...config, smartOffers: n });
                                                                }} /> <span>PDP (Bajo Botón)</span>
                                                            </label>
                                                            <label className="flex items-center space-x-2 text-sm text-zinc-300">
                                                                <input type="checkbox" checked={offer.placements?.includes('home')} onChange={e => {
                                                                    const arr = offer.placements || [];
                                                                    const n = [...config.smartOffers]; n[oIndex].placements = e.target.checked ? [...arr, 'home'] : arr.filter(x => x !== 'home');
                                                                    setConfig({ ...config, smartOffers: n });
                                                                }} /> <span>Inicio</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-zinc-800/50 mt-4">
                                                        <button onClick={() => {
                                                            const n = [...config.smartOffers]; n.splice(oIndex, 1); setConfig({ ...config, smartOffers: n });
                                                        }} className="text-sm text-red-500 hover:text-red-400 flex items-center">
                                                            <Trash2 className="w-4 h-4 mr-1" /> Eliminar Oferta
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* MIDDLE COL: RECOMENDACIÓN (QUÉ MOSTRAR) */}
                                                <div className="flex-1 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                                    <label className="text-xs font-semibold text-emerald-400 block mb-3">PRODUCTO A OFRECER (El Upsell)</label>
                                                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                                                        {products.map(p => {
                                                            const isSelected = (offer.offerProduct === p.id || offer.offerProduct?.id === p.id);
                                                            return (
                                                                <div key={p.id} onClick={() => {
                                                                    const n = [...config.smartOffers];
                                                                    n[oIndex].offerProduct = { id: p.id, name: p.name, price: p.price, image: p.image, variant_id: p.variant_id };
                                                                    setConfig({ ...config, smartOffers: n });
                                                                }} className={`flex items-center p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/50' : 'hover:bg-zinc-800 border border-transparent'}`}>
                                                                    <img src={p.image} className="w-8 h-8 rounded mr-3" />
                                                                    <span className={`text-sm flex-1 truncate ${isSelected ? 'text-emerald-300' : 'text-zinc-300'}`}>{p.name}</span>
                                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {/* RIGHT COL: TRIGGERS (CUÁNDO) */}
                                                <div className="flex-1 bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col">
                                                    <label className="text-xs font-semibold text-orange-400 block mb-1">PRODUCTOS GATILLO (Cuándo Mostrar)</label>
                                                    <span className="text-xs text-zinc-500 mb-3 block">Si no marcás nada, se mostrará siempre.</span>
                                                    <div className="max-h-[280px] overflow-y-auto space-y-1 flex-1">
                                                        {products.map(p => {
                                                            const isChecked = offer.triggers?.includes(p.id);
                                                            return (
                                                                <label key={p.id} className="flex items-center space-x-2 p-1.5 hover:bg-zinc-800/50 rounded cursor-pointer">
                                                                    <input type="checkbox" checked={isChecked} onChange={e => {
                                                                        const n = [...config.smartOffers];
                                                                        if (!n[oIndex].triggers) n[oIndex].triggers = [];
                                                                        if (e.target.checked) n[oIndex].triggers.push(p.id);
                                                                        else n[oIndex].triggers = n[oIndex].triggers.filter(id => id !== p.id);
                                                                        setConfig({ ...config, smartOffers: n });
                                                                    }} />
                                                                    <span className="text-sm truncate text-zinc-400">{p.name}</span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'bundles' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1 flex items-center">Comprados Frecuentemente Juntos</h3>
                                    <p className="text-zinc-400 text-sm">Ofrece armar el pack visualmente debajo del botón de comprar (Modo Nativos Sincronizados). Ya no usamos "Descuentos" raros acá, el enfoque es el ticket puro.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const newBundle = { id: 'combo_' + Date.now(), label: 'Comprados Juntos', triggers: [], products: [] };
                                        setConfig({ ...config, bundles: [...config.bundles, newBundle] });
                                    }}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 font-medium rounded-lg flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Armar Grupo
                                </button>
                            </div>

                            {config.bundles.map((bundle, bIndex) => (
                                <div key={bundle.id} className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 shadow-xl mb-6 flex space-x-8">
                                    {/* Izquierda: Header y Triggers */}
                                    <div className="flex-1 space-y-4">
                                        <input
                                            type="text"
                                            value={bundle.label}
                                            onChange={e => {
                                                const b = [...config.bundles];
                                                b[bIndex].label = e.target.value;
                                                setConfig({ ...config, bundles: b });
                                            }}
                                            className="bg-transparent text-xl font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none px-0 pb-1 w-full"
                                            placeholder="Ej: MEJOR JUNTOS"
                                        />
                                        <div className="pt-2">
                                            <label className="text-sm font-semibold text-zinc-400 block mb-3">PRODUCTO PRINCIPAL (Dónde armamos el pack)</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
                                                {products.map(p => {
                                                    const isChecked = bundle.triggers.includes(p.id);
                                                    return (
                                                        <label key={p.id} className={`flex items-start space-x-2 p-2 rounded cursor-pointer transition-colors ${isChecked ? 'bg-indigo-500/10 border border-indigo-500/50' : 'hover:bg-zinc-800/50 border border-transparent'}`}>
                                                            <input type="checkbox" checked={isChecked} onChange={e => {
                                                                const b = [...config.bundles];
                                                                if (e.target.checked) b[bIndex].triggers.push(p.id);
                                                                else b[bIndex].triggers = b[bIndex].triggers.filter(id => id !== p.id);
                                                                setConfig({ ...config, bundles: b });
                                                            }} className="mt-1" />
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
                                        <h4 className="text-sm font-semibold text-zinc-400 mb-4">PRODUCTOS A SUMARLE JUNTOS</h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                            {products.map(p => {
                                                const isInCombo = bundle.products.some(cp => cp.id === p.id);
                                                return (
                                                    <div key={p.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                                                        <div className="flex items-center space-x-2 w-3/4">
                                                            <img src={p.image} className="w-8 h-8 rounded object-cover" />
                                                            <span className="text-xs truncate text-zinc-300">{p.name}</span>
                                                        </div>
                                                        <button onClick={() => {
                                                            const b = [...config.bundles];
                                                            if (isInCombo) b[bIndex].products = b[bIndex].products.filter(cp => cp.id !== p.id);
                                                            else b[bIndex].products.push({ id: p.id, name: p.name, price: p.price, image: p.image, variant_id: p.variant_id });
                                                            setConfig({ ...config, bundles: b });
                                                        }} className={`p-1.5 rounded-full ${isInCombo ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'}`}>
                                                            {isInCombo ? 'Quitar' : 'Agregar'}
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <button onClick={() => {
                                            const b = [...config.bundles];
                                            b.splice(bIndex, 1);
                                            setConfig({ ...config, bundles: b });
                                        }} className="w-full mt-4 text-sm text-red-400 hover:text-red-300 py-2 border border-red-900/50 hover:bg-red-900/20 rounded-lg transition-colors">
                                            Eliminar Grupo
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="space-y-6">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-white flex items-center">Recupero de Carritos por WhatsApp</h3>
                                        <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                                            Envía notificaciones silenciosas y automáticas a los números de teléfono de clientes que dejan su compra por la mitad en el checkout.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={config.whatsappRecovery?.enabled} onChange={(e) => setConfig({ ...config, whatsappRecovery: { ...config.whatsappRecovery, enabled: e.target.checked } })} />
                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-800">
                                    {/* COLUMNA 1: CONFIGURACIÓN LOGICA Y TEMPLATE */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Tiempo de Espera (Minutos antes de enviar)</label>
                                            <div className="flex items-center space-x-3">
                                                <input type="range" min="5" max="120" step="5" value={config.whatsappRecovery?.delayMinutes || 30} onChange={e => setConfig({ ...config, whatsappRecovery: { ...config.whatsappRecovery, delayMinutes: parseInt(e.target.value) } })} className="flex-1 accent-green-500" />
                                                <span className="text-white font-bold w-16 text-right">{config.whatsappRecovery?.delayMinutes || 30} mins</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="block text-sm font-medium text-zinc-300">Mensaje a enviar</label>
                                                <span className="text-xs text-zinc-500">Usa las variables mágicas</span>
                                            </div>
                                            <textarea rows="5" value={config.whatsappRecovery?.template || ''} onChange={e => setConfig({ ...config, whatsappRecovery: { ...config.whatsappRecovery, template: e.target.value } })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors placeholder-zinc-600" placeholder="¡Hola {nombre}! Vimos que dejaste cosas en el carrito..."></textarea>

                                            <div className="flex space-x-2 mt-2">
                                                <button onClick={() => setConfig({ ...config, whatsappRecovery: { ...config.whatsappRecovery, template: (config.whatsappRecovery?.template || '') + '{nombre}' } })} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors">+ {`{nombre}`}</button>
                                                <button onClick={() => setConfig({ ...config, whatsappRecovery: { ...config.whatsappRecovery, template: (config.whatsappRecovery?.template || '') + '{link}' } })} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors">+ {`{link}`}</button>
                                                <button onClick={() => setConfig({ ...config, whatsappRecovery: { ...config.whatsappRecovery, template: (config.whatsappRecovery?.template || '') + '{total}' } })} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors">+ {`{total}`}</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA 2: PREVISUALIZACIÓN Y CREDENCIALES */}
                                    <div className="space-y-6">
                                        <div className="bg-[#EFEAE2] rounded-xl p-4 h-full border border-zinc-800/50 shadow-inner flex flex-col justify-end min-h-[250px] relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full bg-[#00A884] text-white py-2 px-4 shadow-sm flex items-center space-x-3 z-10">
                                                <div className="w-8 h-8 bg-zinc-300 rounded-full overflow-hidden"><img src="https://i.pinimg.com/736x/8b/16/7a/8b167af653c2399dd93b952a48740620.jpg" className="w-full h-full object-cover" /></div>
                                                <span className="font-semibold text-sm">El Cliente</span>
                                            </div>

                                            {/* Chat background pattern for authenticity */}
                                            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', filter: 'invert(1)' }}></div>

                                            <div className="bg-white p-3 rounded-lg rounded-tl-none self-start max-w-[85%] text-sm text-[#111b21] shadow-sm relative z-10 whitespace-pre-wrap mt-10">
                                                {(config.whatsappRecovery?.template || 'Escribe tu mensaje...').replace('{nombre}', 'Julieta').replace('{link}', 'hachedhe.com.ar/checkout/aH1...').replace('{total}', '$150.000')}
                                                <div className="text-[10px] text-zinc-400 text-right mt-1 font-sans flex justify-end items-center gap-1">10:42 AM <MessageCircle className="w-3 h-3 text-[#53bdeb]" /></div>
                                            </div>
                                        </div>

                                        {/* Modulo de Envío Manual Test */}
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-3">
                                            <h4 className="text-sm font-semibold text-white">Prueba de Envío</h4>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 5491100000000"
                                                    value={testPhone}
                                                    onChange={e => setTestPhone(e.target.value)}
                                                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                                                />
                                                <button
                                                    onClick={sendTestMessage}
                                                    disabled={testingWa || waState !== 'CONNECTED'}
                                                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    {testingWa ? '...' : 'Probar'}
                                                </button>
                                            </div>
                                            {waState !== 'CONNECTED' && <p className="text-xs text-zinc-500">Conecta WhatsApp para poder enviar pruebas.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <Zap className="w-8 h-8 text-green-400" />
                                <h3 className="text-white font-semibold text-lg">Centralita WhatsApp Automática</h3>
                                <p className="text-sm text-zinc-400 max-w-lg mb-2">Escanea el código QR para vincular tu número y permitir que SalesBooster envíe notificaciones.</p>

                                {waState === 'DISCONNECTED' && (
                                    <button onClick={handleStartWA} className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl text-sm transition-colors border border-green-700 shadow-xl">Conectar Celular (Generar QR)</button>
                                )}
                                {waState === 'CONNECTING' && (
                                    <div className="text-yellow-400 animate-pulse font-medium text-sm">Generando túnel seguro con WhatsApp...</div>
                                )}
                                {waState === 'QR_READY' && waQr && (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-white p-3 rounded-2xl shadow-2xl border-4 border-zinc-800 animate-in zoom-in duration-300">
                                            <img src={waQr} alt="WhatsApp QR" className="w-56 h-56" />
                                        </div>
                                        <p className="text-xs mt-4 text-zinc-400 max-w-xs leading-relaxed">Abre WhatsApp en tu teléfono <br /> <b className="text-zinc-300">Ajustes &gt; Dispositivos Vinculados &gt; Vincular</b></p>
                                    </div>
                                )}
                                {waState === 'CONNECTED' && (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center text-green-400 space-x-2 font-bold mb-4 bg-green-900/20 py-2 px-4 rounded-full border border-green-800/30">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" /> <span>Conectado correctamente (Online)</span>
                                        </div>
                                        <button onClick={handleStopWA} className="px-5 py-2.5 bg-red-900/40 hover:bg-red-900 text-red-500 hover:text-red-300 font-medium rounded-xl text-sm transition-colors border border-red-900/50">Cerrar Sesión</button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-white font-semibold text-lg border-b border-zinc-800 pb-2">📦 Carritos Abandonados Recientemente</h3>
                                <p className="text-sm text-zinc-400 max-w-lg mb-2">Aquí podrás ver los carritos detectados. Por ahora estos son datos de muestra interactivos, pronto conectará a tu Tiendanube.</p>

                                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                                    <table className="w-full text-sm text-left text-zinc-400">
                                        <thead className="text-xs text-zinc-300 uppercase bg-zinc-800/50">
                                            <tr>
                                                <th className="px-4 py-3">Cliente</th>
                                                <th className="px-4 py-3">Monto</th>
                                                <th className="px-4 py-3">Abandono hace</th>
                                                <th className="px-4 py-3 text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/20">
                                                <td className="px-4 py-3 font-medium text-white">María González</td>
                                                <td className="px-4 py-3">$21,500.-</td>
                                                <td className="px-4 py-3">40 mins</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => alert('Esto enviará el mensaje manualmente.')} className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                                        Recuperar Manual
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/20">
                                                <td className="px-4 py-3 font-medium text-white">Juan Pérez</td>
                                                <td className="px-4 py-3">$14,500.-</td>
                                                <td className="px-4 py-3">1 hora</td>
                                                <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                                                    Ya enviado ✓
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
}

export default App;
