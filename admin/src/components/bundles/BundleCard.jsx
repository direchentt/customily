import React from 'react';
import { Package, ChevronDown, Trash2 } from 'lucide-react';
import BundleForm from './BundleForm';

const BundleCard = ({ bundle, isExpanded, onToggle, onDelete, onUpdate, products, categories }) => {
    return (
        <div className={`bg-white border transition-all duration-500 rounded-[2rem] overflow-hidden ${isExpanded ? 'shadow-2xl ring-1 ring-slate-200 border-white' : 'shadow-sm border-slate-200 opacity-90'
            }`}>
            <div
                className={`p-5 flex items-center justify-between cursor-pointer transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50 text-slate-900 border-b border-slate-100'
                    }`}
                onClick={onToggle}
            >
                <div className="flex items-center space-x-5 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-[1rem] flex flex-col items-center justify-center transition-all ${isExpanded ? 'bg-indigo-500 text-slate-900' : 'bg-slate-900 text-white'
                        }`}>
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-base font-black truncate">{bundle.label || 'Combo sin nombre'}</span>
                        <span className={`text-[11px] font-bold ${isExpanded ? 'text-slate-400' : 'text-slate-500'}`}>
                            {bundle.products?.length || 0} productos • {bundle.discount}% OFF
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-800 text-slate-400 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-8 animate-in zoom-in-95 duration-300">
                    <BundleForm
                        bundle={bundle}
                        products={products}
                        categories={categories}
                        onChange={onUpdate}
                    />
                </div>
            )}
        </div>
    );
};

export default BundleCard;
