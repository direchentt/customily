import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Plus, Truck, Gift } from 'lucide-react';
import OfferCard from '../components/offers/OfferCard';
import ShippingBarConfig from '../components/offers/ShippingBarConfig';
import GiftConfig from '../components/offers/GiftConfig';

const Offers = () => {
    const { config, setConfig, products, categories } = useApp();
    const [expandedOfferId, setExpandedOfferId] = useState(null);

    const addOffer = () => {
        const newId = 'offer_' + Date.now();
        const newOffer = {
            id: newId,
            name: 'NUEVA OFERTA',
            triggers: [],
            triggersCat: [],
            offerProduct: null,
            placements: ['minicart'],
            style: 'glow',
            title: '¡OFERTA EXCLUSIVA!'
        };
        setConfig({ ...config, smartOffers: [newOffer, ...config.smartOffers] });
        setExpandedOfferId(newId);
    };

    const updateOffer = (updatedOffer) => {
        const newOffers = config.smartOffers.map(o => o.id === updatedOffer.id ? updatedOffer : o);
        setConfig({ ...config, smartOffers: newOffers });
    };

    const deleteOffer = (id) => {
        if (window.confirm('¿Eliminar esta oferta?')) {
            setConfig({ ...config, smartOffers: config.smartOffers.filter(o => o.id !== id) });
        }
    };

    if (!config) return null;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. SECCIÓN: ENVÍO Y REGALOS */}
            <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Logística y Recompensas</h3>
                <ShippingBarConfig config={config} setConfig={setConfig} />
                <GiftConfig config={config} setConfig={setConfig} products={products} />
            </div>

            {/* 2. SECCIÓN: SMART OFFERS */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center space-x-2">
                        <Zap className="text-slate-400 w-5 h-5" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Smart Offers (Upsells)</h3>
                    </div>
                    <button
                        onClick={addOffer}
                        className="bg-slate-900 border border-slate-800 text-white px-5 py-2.5 rounded-2xl flex items-center text-xs font-black uppercase tracking-wider"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nueva Oferta
                    </button>
                </div>

                <div className="space-y-4">
                    {config.smartOffers.map((offer) => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            isExpanded={expandedOfferId === offer.id}
                            onToggle={() => setExpandedOfferId(expandedOfferId === offer.id ? null : offer.id)}
                            onDelete={() => deleteOffer(offer.id)}
                            onUpdate={updateOffer}
                            products={products}
                            categories={categories}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Offers;
