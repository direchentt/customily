import React from 'react';
import { Gift, Check } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const GiftConfig = ({ config, setConfig, products }) => {
    const handleChange = (field, value) => {
        setConfig({
            ...config,
            cartGifts: { ...config.cartGifts, [field]: value }
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                        <Gift className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Regalo por Monto</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.cartGifts?.enabled}
                        onChange={(e) => handleChange('enabled', e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <label className="block text-sm font-bold text-slate-700">Monto para el Regalo ($)</label>
                    <input
                        type="number"
                        value={config.cartGifts?.threshold || 0}
                        onChange={(e) => handleChange('threshold', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700">Seleccionar Producto Regalo</label>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            {products.map(p => {
                                const isSelected = config.cartGifts?.productId === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => handleChange('productId', p.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-amber-100 ring-1 ring-amber-500' : 'bg-white'}`}
                                    >
                                        <img src={p.image} className="w-8 h-8 rounded object-cover" />
                                        <span className="text-[11px] font-bold flex-1 truncate">{p.name}</span>
                                        {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Mensajes</label>
                    <input
                        type="text"
                        value={config.cartGifts?.msgInitial || ''}
                        onChange={(e) => handleChange('msgInitial', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                        placeholder="¡Te falta {faltante} para tu sorpresa!"
                    />
                    <input
                        type="text"
                        value={config.cartGifts?.msgSuccess || ''}
                        onChange={(e) => handleChange('msgSuccess', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-amber-700"
                        placeholder="¡Ganaste un regalo sorpresa!"
                    />
                </div>
            </div>
        </div>
    );
};

export default GiftConfig;
