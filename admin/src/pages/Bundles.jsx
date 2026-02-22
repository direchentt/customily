import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Package } from 'lucide-react';
import BundleCard from '../components/bundles/BundleCard';

const Bundles = () => {
    const { config, setConfig, products, categories } = useApp();
    const [expandedId, setExpandedId] = useState(null);

    const addBundle = () => {
        const newId = 'bundle_' + Date.now();
        const newBundle = {
            id: newId,
            label: 'NUEVO COMBO',
            products: [],
            discount: 10,
            badge: 'OFERTA',
            ctaText: 'AGREGAR PACK',
            triggers: []
        };
        setConfig({ ...config, bundles: [newBundle, ...config.bundles] });
        setExpandedId(newId);
    };

    const updateBundle = (updatedBundle) => {
        const newBundles = config.bundles.map(b => b.id === updatedBundle.id ? updatedBundle : b);
        setConfig({ ...config, bundles: newBundles });
    };

    const deleteBundle = (id) => {
        if (window.confirm('¿Seguro quieres eliminar este combo?')) {
            setConfig({ ...config, bundles: config.bundles.filter(b => b.id !== id) });
        }
    };

    if (!config) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center space-x-2">
                    <Package className="text-slate-400 w-5 h-5" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Packs de Productos</h3>
                </div>
                <button
                    onClick={addBundle}
                    className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm font-bold"
                >
                    <Plus className="w-5 h-5 mr-2" /> Crear Pack
                </button>
            </div>

            <div className="space-y-4">
                {config.bundles.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No tienes packs creados</h3>
                        <p className="text-slate-500 text-sm mb-6">Ofrece productos complementarios debajo del botón del carrito.</p>
                        <button onClick={addBundle} className="text-indigo-600 font-bold hover:underline">
                            Crear mi primer pack
                        </button>
                    </div>
                ) : (
                    config.bundles.map((bundle, index) => (
                        <BundleCard
                            key={bundle.id}
                            bundle={bundle}
                            isExpanded={expandedId === bundle.id}
                            onToggle={() => setExpandedId(expandedId === bundle.id ? null : bundle.id)}
                            onDelete={() => deleteBundle(bundle.id)}
                            onUpdate={updateBundle}
                            products={products}
                            categories={categories}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Bundles;
