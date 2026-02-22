import React from 'react';
import { Trash2, Plus, Info } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const BundleForm = ({ bundle, products, categories, onChange }) => {
    const handleFieldChange = (field, value) => {
        onChange({ ...bundle, [field]: value });
    };

    const toggleProductInBundle = (prodId) => {
        const currentProds = bundle.products || [];
        const exists = currentProds.find(p => p.id === prodId);
        let newProds;
        if (exists) {
            newProds = currentProds.filter(p => p.id !== prodId);
        } else {
            const pData = products.find(p => p.id === prodId);
            newProds = [...currentProds, { id: pData.id, name: pData.name, price: pData.price, image: pData.image }];
        }
        handleFieldChange('products', newProds);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Nombre / Etiqueta del Combo</label>
                    <input
                        type="text"
                        value={bundle.label || ''}
                        onChange={(e) => handleFieldChange('label', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ej: PACK AHORRO SKINCARE"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Descuento %</label>
                        <input
                            type="number"
                            value={bundle.discount || 0}
                            onChange={(e) => handleFieldChange('discount', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Badge (Texto burbuja)</label>
                        <input
                            type="text"
                            value={bundle.badge || ''}
                            onChange={(e) => handleFieldChange('badge', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej: -20% OFF"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Productos del Pack ({bundle.products?.length || 0})</label>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        {products.map(p => {
                            const isChecked = bundle.products?.some(bp => bp.id === p.id);
                            return (
                                <label key={p.id} className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/50 opacity-70'}`}>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleProductInBundle(p.id)}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <img src={p.image} className="w-8 h-8 rounded object-cover" />
                                    <span className={`text-xs truncate ${isChecked ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{p.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-400" /> Vista Previa Widget
                    </h4>

                    <div className="bg-white rounded-2xl p-6 shadow-xl text-slate-900 scale-95 origin-top">
                        <div className="text-[10px] font-black text-indigo-600 uppercase mb-2">{bundle.label || 'TÍTULO DEL COMBO'}</div>
                        <div className="space-y-3 mb-4">
                            {bundle.products?.map(p => (
                                <div key={p.id} className="flex items-center gap-3 border-b border-slate-50 pb-2">
                                    <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold truncate">{p.name}</div>
                                        <div className="text-[10px] text-slate-400">${formatPrice(p.price)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-500">Llevá todo por:</span>
                            <span className="text-lg font-black text-emerald-600">
                                ${formatPrice((bundle.products?.reduce((s, p) => s + p.price, 0) || 0) * (1 - (bundle.discount || 0) / 100))}
                            </span>
                        </div>
                        <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider">
                            {bundle.ctaText || 'Agregar Pack'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundleForm;
