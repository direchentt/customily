import React from 'react';
import { Truck } from 'lucide-react';

const ShippingBarConfig = ({ config, setConfig }) => {
    const handleChange = (field, value) => {
        setConfig({
            ...config,
            shippingBar: { ...config.shippingBar, [field]: value }
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Barra de Envíos Gratis</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.shippingBar?.enabled}
                        onChange={(e) => handleChange('enabled', e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Meta de Envío Gratis ($)</label>
                    <input
                        type="number"
                        value={config.shippingBar?.threshold || 0}
                        onChange={(e) => handleChange('threshold', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Mensaje de Éxito</label>
                    <input
                        type="text"
                        value={config.shippingBar?.msgSuccess || ''}
                        onChange={(e) => handleChange('msgSuccess', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="¡Felicidades! Tienes envío gratis."
                    />
                </div>
            </div>
        </div>
    );
};

export default ShippingBarConfig;
