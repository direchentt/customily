import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { configAPI, productsAPI } from '../api/client';

const AppContext = createContext({
    loading: true,
    config: null,
    products: [],
    categories: [],
    error: null,
    saving: false,
    saveConfig: async () => false,
    refreshData: () => { }
});

export const AppProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const retryCountRef = useRef(0);
    const isFetchingRef = useRef(false);

    const fetchData = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            console.log("🔄 Fetching data from API...");
            setLoading(true);
            setError(null);

            const [configRes, productsRes, categoriesRes] = await Promise.all([
                configAPI.get(),
                productsAPI.getAll(),
                productsAPI.getCategories(),
            ]);

            console.log("✅ Data received:", { config: !!configRes.data, products: productsRes.data?.length });

            let c = configRes.data;
            if (!c) throw new Error("Config not found");

            if (!c.smartOffers) c.smartOffers = [];
            if (!c.bundles) c.bundles = [];
            if (!c.shippingBar) c.shippingBar = { enabled: false, placements: ['minicart'], threshold: 0 };
            if (!c.cartGifts) c.cartGifts = { enabled: false, threshold: 0, productId: null };
            if (c.modules === undefined) c.modules = { offersEnabled: true, bundlesEnabled: true };

            setConfig(c);
            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
            setLoading(false);
            retryCountRef.current = 0;
            isFetchingRef.current = false;
        } catch (err) {
            console.error('❌ Fetch error:', err);

            if (retryCountRef.current < 12) {
                retryCountRef.current++;
                console.log(`📡 Reintentando conexión (${retryCountRef.current}/12) en 5s...`);
                setTimeout(() => {
                    isFetchingRef.current = false;
                    fetchData();
                }, 5000);
            } else {
                setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:3001.');
                setLoading(false);
                isFetchingRef.current = false;
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const saveConfig = async (newConfig) => {
        setSaving(true);
        try {
            await configAPI.update(newConfig || config);
            setConfig(newConfig || config);
            return true;
        } catch (err) {
            console.error('Error saving config:', err);
            return false;
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppContext.Provider
            value={{
                config,
                setConfig,
                products,
                categories,
                loading,
                error,
                saving,
                saveConfig,
                refreshData: fetchData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
