import React, { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:3001';

function App() {
    const [products, setProducts] = useState([]);
    const [combos, setCombos] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Nuevo Combo builder state
    const [triggerProds, setTriggerProds] = useState([]);  // Productos que disparan
    const [comboProds, setComboProds] = useState([]);       // Productos del pack
    const [discount, setDiscount] = useState(10);           // % descuento
    const [label, setLabel] = useState('');                 // Nombre del pack
    const [badge, setBadge] = useState('');                 // Ej: "¡Más Vendido!"
    const [editingComboId, setEditingComboId] = useState(null);
    const [activeTab, setActiveTab] = useState('trigger');  // 'trigger' | 'combo'

    useEffect(() => {
        fetch(`${API}/api/products`)
            .then(r => r.json())
            .then(d => { setProducts(d); setLoading(false); })
            .catch(() => setLoading(false));

        fetch(`${API}/api/combos`)
            .then(r => r.json())
            .then(d => setCombos(Array.isArray(d) ? d : []));
    }, []);

    const resetBuilder = () => {
        setTriggerProds([]);
        setComboProds([]);
        setDiscount(10);
        setLabel('');
        setBadge('');
        setEditingComboId(null);
        setActiveTab('trigger');
    };

    const handleProductClick = (prod) => {
        if (activeTab === 'trigger') {
            // Toggle en triggers
            const exists = triggerProds.find(p => p.id === prod.id);
            if (exists) setTriggerProds(triggerProds.filter(p => p.id !== prod.id));
            else setTriggerProds([...triggerProds, prod]);
        } else {
            // Toggle en combo products
            const exists = comboProds.find(p => p.id === prod.id);
            if (exists) setComboProds(comboProds.filter(p => p.id !== prod.id));
            else setComboProds([...comboProds, prod]);
        }
    };

    const handleSaveCombo = () => {
        if (triggerProds.length === 0) return alert("Selecciona al menos 1 producto disparador");
        if (comboProds.length === 0) return alert("Selecciona al menos 1 producto para el pack");

        const newCombo = {
            id: editingComboId || `combo_${Date.now()}`,
            label: label || `Pack ${triggerProds[0].name}`,
            badge: badge,
            discount: parseInt(discount),
            triggers: triggerProds.map(p => p.id),
            products: comboProds.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image
            }))
        };

        let newCombos;
        if (editingComboId) {
            newCombos = combos.map(c => c.id === editingComboId ? newCombo : c);
        } else {
            newCombos = [...combos, newCombo];
        }

        fetch(`${API}/api/combos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCombos)
        }).then(() => {
            setCombos(newCombos);
            resetBuilder();
            alert("✅ Combo guardado con éxito!");
        });
    };

    const handleEditCombo = (combo) => {
        setEditingComboId(combo.id);
        setLabel(combo.label || '');
        setBadge(combo.badge || '');
        setDiscount(combo.discount || 10);
        // Restaurar los productos trigger de la lista
        const resolvedTriggers = combo.triggers
            .map(id => products.find(p => p.id === id))
            .filter(Boolean);
        setTriggerProds(resolvedTriggers);
        setComboProds(combo.products || []);
        setActiveTab('trigger');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteCombo = (comboId) => {
        if (!window.confirm("¿Borrar este combo?")) return;
        const newCombos = combos.filter(c => c.id !== comboId);
        fetch(`${API}/api/combos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCombos)
        }).then(() => setCombos(newCombos));
    };

    const isSelected = (prod) => {
        if (activeTab === 'trigger') return triggerProds.some(p => p.id === prod.id);
        return comboProds.some(p => p.id === prod.id);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const calculateTotal = () => {
        const allProds = [...triggerProds, ...comboProds];
        return allProds.reduce((sum, p) => {
            const price = typeof p.price === 'string'
                ? parseFloat(p.price.replace(/[^0-9,]/g, '').replace(',', '.'))
                : p.price;
            return sum + price;
        }, 0);
    };

    const formatPrice = (p) => {
        const n = typeof p === 'string'
            ? parseFloat(p.replace(/[^0-9,]/g, '').replace(',', '.'))
            : p;
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="header-content">
                    <div>
                        <h1>⚡ SalesBooster Admin</h1>
                        <p>{products.length} productos · {combos.length} combos activos</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-pill">🎯 {combos.length} Combos</div>
                        <div className="stat-pill">📦 {products.length} Productos</div>
                    </div>
                </div>
            </header>

            <div className="main-layout">

                {/* CATÁLOGO */}
                <div className="catalog-panel">
                    <div className="catalog-header">
                        <h2>📦 Tu Catálogo</h2>
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="tab-selector">
                        <button
                            className={`tab-btn ${activeTab === 'trigger' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trigger')}
                        >
                            🔦 Productos Trigger ({triggerProds.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'combo' ? 'active' : ''}`}
                            onClick={() => setActiveTab('combo')}
                        >
                            🎁 Productos del Pack ({comboProds.length})
                        </button>
                    </div>

                    <p className="tab-hint">
                        {activeTab === 'trigger'
                            ? "Selecciona los productos donde aparecerá el widget 👇"
                            : "Selecciona los productos que se ofrecerán en el pack 👇"}
                    </p>

                    <div className="product-grid">
                        {loading ? (
                            <div className="loading">Cargando productos...</div>
                        ) : filteredProducts.map(p => (
                            <div
                                key={p.id}
                                className={`product-card ${isSelected(p) ? 'selected' : ''}`}
                                onClick={() => handleProductClick(p)}
                            >
                                {isSelected(p) && <div className="selected-badge">✓</div>}
                                <img src={p.image} alt={p.name} />
                                <div className="p-info">
                                    <strong>{p.name}</strong>
                                    <span>{formatPrice(p.price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CONSTRUCTOR */}
                <div className="builder-panel">
                    <h2>{editingComboId ? '✏️ Editando Combo' : '🛠️ Nuevo Combo'}</h2>

                    {/* CONFIG */}
                    <div className="config-section">
                        <div className="config-row">
                            <label>Nombre del Pack</label>
                            <input
                                type="text"
                                placeholder="Ej: Pack Verano, Kit Esencial..."
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                            />
                        </div>
                        <div className="config-row two-col">
                            <div>
                                <label>Descuento %</label>
                                <div className="discount-input-wrap">
                                    <input
                                        type="number"
                                        min="0"
                                        max="80"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                            <div>
                                <label>Badge (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="¡Más Vendido!"
                                    value={badge}
                                    onChange={e => setBadge(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PREVIEW */}
                    <div className="preview-section">
                        <div className="preview-col">
                            <label>🔦 Triggers ({triggerProds.length})</label>
                            <div className="prod-chip-list">
                                {triggerProds.length === 0
                                    ? <span className="empty-hint">Selecciona en catálogo</span>
                                    : triggerProds.map(p => (
                                        <div key={p.id} className="prod-chip">
                                            <img src={p.image} />
                                            <span>{p.name}</span>
                                            <button onClick={() => setTriggerProds(triggerProds.filter(x => x.id !== p.id))}>×</button>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className="arrow">→</div>

                        <div className="preview-col">
                            <label>🎁 Pack ({comboProds.length})</label>
                            <div className="prod-chip-list">
                                {comboProds.length === 0
                                    ? <span className="empty-hint">Selecciona en catálogo</span>
                                    : comboProds.map(p => (
                                        <div key={p.id} className="prod-chip">
                                            <img src={p.image} />
                                            <span>{p.name}</span>
                                            <button onClick={() => setComboProds(comboProds.filter(x => x.id !== p.id))}>×</button>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* PRICE PREVIEW */}
                    {(triggerProds.length > 0 || comboProds.length > 0) && (
                        <div className="price-preview">
                            <span>Total Normal: <strong>{formatPrice(calculateTotal())}</strong></span>
                            <span>Con {discount}% OFF: <strong className="discounted">{formatPrice(calculateTotal() * (1 - discount / 100))}</strong></span>
                        </div>
                    )}

                    <div className="builder-actions">
                        <button className="save-btn" onClick={handleSaveCombo}
                            disabled={triggerProds.length === 0 || comboProds.length === 0}>
                            💾 {editingComboId ? 'ACTUALIZAR COMBO' : 'GUARDAR COMBO'}
                        </button>
                        {editingComboId && (
                            <button className="cancel-btn" onClick={resetBuilder}>✕ Cancelar</button>
                        )}
                    </div>

                    <hr />

                    {/* LISTA DE COMBOS ACTIVOS */}
                    <h3>Combos Activos ({combos.length})</h3>
                    <div className="active-combos-list">
                        {combos.length === 0 && <p className="empty-hint">No hay combos aún. ¡Crea el primero!</p>}
                        {combos.map(combo => (
                            <div key={combo.id} className="combo-row">
                                <div className="combo-row-info">
                                    <div className="combo-images">
                                        {[...combo.triggers.map(tid => products.find(p => p.id === tid)), ...combo.products]
                                            .filter(Boolean).slice(0, 4).map((p, i) => (
                                                <img key={i} src={p.image || p.img} title={p.name} />
                                            ))}
                                    </div>
                                    <div className="combo-meta">
                                        <strong>{combo.label}</strong>
                                        <span>
                                            {combo.triggers.length} trigger(s) + {combo.products.length} producto(s) · <b>{combo.discount}% OFF</b>
                                            {combo.badge && <em> · "{combo.badge}"</em>}
                                        </span>
                                    </div>
                                </div>
                                <div className="combo-row-actions">
                                    <button className="edit-btn" onClick={() => handleEditCombo(combo)}>✏️</button>
                                    <button className="delete-btn" onClick={() => handleDeleteCombo(combo.id)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
