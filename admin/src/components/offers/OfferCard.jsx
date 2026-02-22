import React from 'react';
import { Zap, ChevronDown, Trash2, Check } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const OfferCard = ({ offer, isExpanded, onToggle, onDelete, onUpdate, products, categories }) => {
    const handleFieldChange = (field, value) => {
        onUpdate({ ...offer, [field]: value });
    };

    const toggleTrigger = (id, type) => {
        const list = offer[type] || [];
        const newList = list.includes(id) ? list.filter(i => i !== id) : [...list, id];
        handleFieldChange(type, newList);
    };

    return (
        <div className={`bg-white border transition-all rounded-[2rem] overflow-hidden ${isExpanded ? 'shadow-2xl ring-1 ring-slate-200' : 'shadow-sm opacity-90'}`}>
            <div
                className={`p-5 flex items-center justify-between cursor-pointer ${isExpanded ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}
                onClick={onToggle}
            >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-emerald-500 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                        <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black truncate">{offer.name || 'Nueva Oferta'}</span>
                        <span className={`text-[10px] font-bold ${isExpanded ? 'text-slate-400' : 'text-slate-500'}`}>
                            {offer.triggers?.length || 0} Triggers • {offer.placements?.length || 0} Placements
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isExpanded && (
                <div className="p-10 space-y-10 animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aparece cuando compran:</label>
                            <div className="max-h-[200px] overflow-y-auto space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                {products.map(p => (
                                    <label key={p.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded-lg cursor-pointer text-xs">
                                        <input type="checkbox" checked={offer.triggers?.includes(p.id)} onChange={() => toggleTrigger(p.id, 'triggers')} className="w-4 h-4 rounded text-emerald-500" />
                                        <span className={offer.triggers?.includes(p.id) ? 'font-bold' : ''}>{p.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto a Ofrecer:</label>
                            <div className="max-h-[200px] overflow-y-auto space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                {products.map(p => {
                                    const isSelected = offer.offerProduct?.id === p.id || offer.offerProduct === p.id;
                                    return (
                                        <div key={p.id} onClick={() => handleFieldChange('offerProduct', p)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'opacity-70'}`}>
                                            <img src={p.image} className="w-6 h-6 rounded object-cover" />
                                            <span className={`text-xs truncate flex-1 ${isSelected ? 'font-bold' : ''}`}>{p.name}</span>
                                            {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferCard;
