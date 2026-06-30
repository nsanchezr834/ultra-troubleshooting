// content.js - Inyectado en el contexto de la página
console.log("[Autoryx V2] ✅ Content Script inyectado");
window.AUTORYX_INJECTED = true;

// --- CONFIGURACIÓN ---
const APP_HOST = "https://ultra-troubleshooting.vercel.app";
const API_KEY = "SUPER_SECRET_BRIDGE_KEY_123";
const CHECK_INTERVAL_MS = 10000;

let activeRobotConfig = null;
let isSensing = false;

function log(msg, type = 'info') {
    const prefix = "[Autoryx V2 Bridge]";
    const timestamp = new Date().toISOString().substr(11, 8);
    
    if (type === 'error') 
        console.error(`${prefix} [${timestamp}] ❌ ${msg}`);
    else if (type === 'warn') 
        console.warn(`${prefix} [${timestamp}] ⚠️ ${msg}`);
    else 
        console.log(`${prefix} [${timestamp}] ℹ️ ${msg}`);
}

// ============= USAR FETCH CON CORS BYPASS =============
async function loadConfig() {
    try {
        const response = await fetch(`${APP_HOST}/api/robot-mirror/config`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "omit" // Evita CORS issues
        });
        
        if (response.ok) {
            const data = await response.json();
            log(`Config cargada: ${data.data?.length || 0} robots`);
            return data.data || [];
        } else {
            log(`Error HTTP ${response.status} al cargar config`, "warn");
            return [];
        }
    } catch (e) {
        log(`Conexión rechazada: ${e.message}`, "error");
        return [];
    }
}

function findMatchingRobot(configs) {
    const currentUrl = window.location.href;
    log(`Buscando coincidencia para: ${currentUrl}`);
    
    return configs.find(config => {
        if (!config.target_url) return false;
        const cleanTarget = config.target_url.trim().replace(/\/$/, "");
        const cleanCurrent = currentUrl.trim().replace(/\/$/, "");
        return cleanCurrent.startsWith(cleanTarget);
    });
}

function getPackagingLogRows() {
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
        // Encontrar cabeceras en thead o en el primer tr de la tabla
        const headerCells = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'));
        const headers = headerCells.map(cell => cell.innerText.toLowerCase().trim());
            
        // Validar si tiene cabeceras características de empaque
        const hasPackagingHeaders = headers.some(h => 
            h.includes('ship to') || 
            h.includes('carrier') || 
            h.includes('order number') || 
            h.includes('order id') ||
            h.includes('attempted')
        );
        
        if (hasPackagingHeaders) {
            let rows = table.querySelectorAll('tbody tr');
            if (!rows || rows.length === 0) {
                // Fallback: si no hay tbody, tomamos todos los tr excepto el de cabecera
                rows = Array.from(table.querySelectorAll('tr')).slice(1);
            }
            
            if (rows && rows.length > 0) {
                const shipToIdx = headers.findIndex(h => h.includes('ship to'));
                const carrierIdx = headers.findIndex(h => h.includes('carrier'));
                const statusIdx = headers.findIndex(h => h.includes('status'));
                const attemptedIdx = headers.findIndex(h => h.includes('attempted'));
                const timeIdx = headers.findIndex(h => h.includes('time'));
                const orderNumIdx = headers.findIndex(h => h.includes('order number') || h.includes('number'));
                const orderIdIdx = headers.findIndex(h => h.includes('order id') || h.includes('id'));
                
                log(`✅ Tabla de empaque identificada. Columnas mapeadas: ShipTo=${shipToIdx}, Carrier=${carrierIdx}, Status=${statusIdx}, Attempted=${attemptedIdx}, OrderNum=${orderNumIdx}`);
                
                return {
                    rows,
                    mapping: { shipToIdx, carrierIdx, statusIdx, attemptedIdx, timeIdx, orderNumIdx, orderIdIdx }
                };
            }
        }
    }
    return null;
}

function scrapePackagingLog() {
    const tableInfo = getPackagingLogRows();
    if (!tableInfo) {
        log("⚠️ No se encontró la tabla de empaque (Packaging Log) usando cabeceras.", "warn");
        return [];
    }

    const { rows, mapping } = tableInfo;
    const orders = [];
    const maxRows = Math.min(rows.length, 11);

    for (let i = 0; i < maxRows; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length > 0) {
            // Extraer usando el mapeo dinámico de índices, con fallbacks
            const ship_to = mapping.shipToIdx !== -1 && cells[mapping.shipToIdx] 
                ? cells[mapping.shipToIdx].innerText.trim() 
                : 'Desconocido';
                
            const carrier = mapping.carrierIdx !== -1 && cells[mapping.carrierIdx] 
                ? cells[mapping.carrierIdx].innerText.trim() 
                : '';
                
            const status = mapping.statusIdx !== -1 && cells[mapping.statusIdx] 
                ? cells[mapping.statusIdx].innerText.trim() 
                : '';
                
            const attempted_at = mapping.attemptedIdx !== -1 && cells[mapping.attemptedIdx] 
                ? cells[mapping.attemptedIdx].innerText.trim() 
                : '';
                
            const time_s = mapping.timeIdx !== -1 && cells[mapping.timeIdx] 
                ? cells[mapping.timeIdx].innerText.trim() 
                : '';
                
            const order_number = mapping.orderNumIdx !== -1 && cells[mapping.orderNumIdx] 
                ? cells[mapping.orderNumIdx].innerText.trim() 
                : `ID-${Math.random().toString(36).substring(2, 7)}`;
                
            const order_id = mapping.orderIdIdx !== -1 && cells[mapping.orderIdIdx] 
                ? cells[mapping.orderIdIdx].innerText.trim() 
                : '';

            orders.push({ ship_to, carrier, status, attempted_at, time_s, order_number, order_id });
        }
    }
    
    log(`Scraped ${orders.length} órdenes`);
    return orders;
}

async function syncData() {
    if (!activeRobotConfig) return;

    const orders = scrapePackagingLog();
    if (orders.length === 0) {
        log(`Sincronización pausada: No hay órdenes en ${activeRobotConfig.name}`);
        return;
    }

    const payload = {
        station_id: activeRobotConfig.id,
        robot_id: activeRobotConfig.id,
        orders: orders
    };

    try {
        const response = await fetch(`${APP_HOST}/api/bridge/sync-logs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY
            },
            body: JSON.stringify(payload),
            credentials: "omit"
        });
        
        if (response.ok) {
            log(`✅ Sincronización exitosa (${orders.length} órdenes) para ${activeRobotConfig.name}`);
        } else {
            log(`HTTP ${response.status} en sync-logs`, "error");
        }
    } catch (err) {
        log(`Error de red en sync: ${err.message}`, "error");
    }
}

async function initialize() {
    log("========== INICIALIZANDO AUTORYX V2 (CHROME EXTENSION) ==========");
    
    const configs = await loadConfig();

    if (configs.length === 0) {
        log("No hay configs activas. Reintentando en 20s...", "warn");
        setTimeout(initialize, 20000);
        return;
    }

    activeRobotConfig = findMatchingRobot(configs);

    if (activeRobotConfig) {
        log(`✅ ESTACIÓN DETECTADA: [${activeRobotConfig.name}] (${activeRobotConfig.id})`);
        isSensing = true;
        
        await syncData();
        setInterval(syncData, CHECK_INTERVAL_MS);
    } else {
        log("🛑 URL no registrada en Admin Dashboard", "warn");
        setTimeout(initialize, 30000);
    }
}

// Espera a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initialize, 2000);
    });
} else {
    setTimeout(initialize, 2000);
}
