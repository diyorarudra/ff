const fs = require('fs');
const css = `
/* === MODALS (SHOP, INFO, CONFIRM) === */
#ff-modals-wrapper {
    position: fixed;
    z-index: 999999;
}

.ff-modal-base {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999999;
}

.ff-modal-base.hidden {
    display: none !important;
}

.ff-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
}

.ff-modal-content {
    position: relative;
    background: rgba(15, 23, 42, 0.95);
    border: 2px solid #fbbf24;
    border-radius: 24px;
    padding: 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    width: 90%;
    max-width: 500px;
    color: #fff;
    font-family: system-ui, sans-serif;
    max-height: 90vh;
    overflow-y: auto;
}

.ff-modal-content::-webkit-scrollbar {
    width: 0;
}

.ff-shop-content {
    max-width: 800px;
    padding: 30px 40px;
}

.ff-confirm-content {
    max-width: 400px;
    text-align: center;
}

.ff-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.ff-modal-header h2 {
    color: #fbbf24;
    margin: 0;
    font-size: 28px;
    font-weight: 900;
}

.ff-modal-close {
    background: rgba(255,255,255,0.1);
    border: none;
    color: #fff;
    font-size: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
}

.ff-modal-close:hover {
    background: rgba(255,255,255,0.2);
}

.ff-modal-body ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.ff-modal-body li {
    margin-bottom: 12px;
    font-size: 16px;
    line-height: 1.5;
}

/* === COIN SHOP GRID === */
.ff-shop-balance {
    font-size: 20px;
    font-weight: bold;
    color: #fbbf24;
    margin-bottom: 20px;
    text-align: center;
    background: rgba(251, 191, 36, 0.1);
    padding: 15px;
    border-radius: 12px;
}

.ff-shop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
}

.ff-shop-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
}

.ff-shop-item:hover {
    transform: translateY(-5px);
    border-color: rgba(251, 191, 36, 0.8);
}

.ff-shop-item h4 {
    margin: 0 0 10px 0;
    color: #fff;
    font-size: 18px;
}

.ff-shop-item p {
    font-size: 14px;
    color: #cbd5e1;
    margin: 0 0 20px 0;
    line-height: 1.4;
    flex-grow: 1;
}

.ff-buy-btn {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
    border: none;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 900;
    border-radius: 30px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(245,158,11,0.4);
    transition: transform 0.2s, opacity 0.2s;
}

.ff-buy-btn:not(:disabled):hover {
    transform: scale(1.05);
}

.ff-buy-btn:disabled {
    cursor: not-allowed;
    background: #475569;
    box-shadow: none;
    color: #94a3b8;
}

/* === CONFIRM MODAL === */
.ff-confirm-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 25px;
}

.ff-confirm-actions button {
    padding: 15px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
}

.ff-confirm-actions button:hover {
    transform: scale(1.02);
}

#ff-confirm-btn-item {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
}

#ff-confirm-btn-coin {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: black;
}

#ff-confirm-btn-cancel {
    background: rgba(255,255,255,0.1);
    color: white;
}

/* === GOLDEN THEME === */
.golden-theme .ff-hud-inner {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(217, 119, 6, 0.95));
    border: 2px solid #fff;
    box-shadow: 0 10px 40px rgba(245, 158, 11, 0.8);
}

.golden-theme .ff-hud-inner * {
    color: #fff !important;
}

.golden-theme .ff-pill {
    background: rgba(0,0,0,0.2) !important;
    border-color: rgba(255,255,255,0.4) !important;
}

.golden-theme button {
    background: rgba(0,0,0,0.2) !important;
}

.golden-theme button:hover {
    background: rgba(0,0,0,0.4) !important;
}
`;
fs.appendFileSync('css/game-rewards.css', css);
