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
                rows = Array.from(table.querySelectorAll('tr')).slice(1);
            }
            
            const shipToIdx = headers.findIndex(h => h.includes('ship to'));
            const carrierIdx = headers.findIndex(h => h.includes('carrier'));
            const statusIdx = headers.findIndex(h => h.includes('status'));
            const attemptedIdx = headers.findIndex(h => h.includes('attempted'));
            const timeIdx = headers.findIndex(h => h.includes('time'));
            const orderNumIdx = headers.findIndex(h => h.includes('order number') || h.includes('number'));
            const orderIdIdx = headers.findIndex(h => h.includes('order id') || h.includes('id'));
            
            log(`✅ Tabla de empaque identificada por cabeceras. Mapeo: ShipTo=${shipToIdx}, Carrier=${carrierIdx}, Status=${statusIdx}, Attempted=${attemptedIdx}, OrderNum=${orderNumIdx}`);
            
            return {
                rows: rows || [],
                mapping: { shipToIdx, carrierIdx, statusIdx, attemptedIdx, timeIdx, orderNumIdx, orderIdIdx }
            };
        }

        // Fallback: Clasificar por contenido de celdas si no hay cabeceras claras en el primer tr
        let rows = table.querySelectorAll('tbody tr, tr');
        if (rows && rows.length > 0) {
            const firstDataRow = rows[0].tagName === 'TR' && rows[0].querySelector('td') ? rows[0] : rows[1];
            if (firstDataRow) {
                const cells = Array.from(firstDataRow.querySelectorAll('td')).map(c => c.innerText.toLowerCase().trim());
                const hasCarrier = cells.some(c => c.includes('dhl') || c.includes('fedex') || c.includes('ups') || c.includes('usps'));
                const hasStatus = cells.some(c => c.includes('processing') || c.includes('completed') || c.includes('pending') || c.includes('failed') || c.includes('seal') || c.includes('label'));
                
                if (hasCarrier || hasStatus) {
                    log(`⚠️ Tabla de empaque identificada por CONTENIDO de celdas.`);
                    const shipToIdx = 0;
                    const carrierIdx = cells.findIndex(c => c.includes('dhl') || c.includes('fedex') || c.includes('ups') || c.includes('usps'));
                    const statusIdx = cells.findIndex(c => c.includes('processing') || c.includes('completed') || c.includes('pending') || c.includes('failed') || c.includes('seal') || c.includes('label'));
                    const attemptedIdx = 3;
                    const timeIdx = 4;
                    const orderNumIdx = 5;
                    const orderIdIdx = 6;
                    
                    return {
                        rows,
                        mapping: { 
                            shipToIdx: shipToIdx !== -1 ? shipToIdx : 0, 
                            carrierIdx: carrierIdx !== -1 ? carrierIdx : 1, 
                            statusIdx: statusIdx !== -1 ? statusIdx : 2, 
                            attemptedIdx: attemptedIdx !== -1 ? attemptedIdx : 3, 
                            timeIdx: timeIdx !== -1 ? timeIdx : 4, 
                            orderNumIdx: orderNumIdx !== -1 ? orderNumIdx : 5, 
                            orderIdIdx: orderIdIdx !== -1 ? orderIdIdx : 6 
                        }
                    };
                }
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

            const batch_id = getBatchIdFromPage() || '';

            orders.push({ ship_to, carrier, status, attempted_at, time_s, order_number, order_id, batch_id });
        }
    }
    
    log(`Scraped ${orders.length} órdenes`);
    return orders;
}

function getBatchIdFromPage() {
    try {
        // 1. Buscar el elemento con texto "ACTIVE" exactamente (el badge de estatus del lote en la barra lateral)
        const badges = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.children.length === 0 && el.innerText && el.innerText.trim().toUpperCase() === 'ACTIVE';
        });
        
        for (const badge of badges) {
            let parent = badge.parentElement;
            while (parent && parent !== document.body) {
                const text = parent.innerText || '';
                // Buscar números de 7 dígitos en este contenedor (como 7414716)
                const match = text.match(/(?:^|\D)(\d{7})(?:\D|$)/);
                if (match) {
                    return match[1];
                }
                parent = parent.parentElement;
            }
        }
        
        // Fallback: Buscar en los encabezados principales de la página números de 7 dígitos
        const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, div')).filter(el => {
            return el.children.length === 0 && /^\d{7}$/.test((el.innerText || '').trim());
        });
        if (elements.length > 0) {
            return elements[0].innerText.trim();
        }
        
        // Fallback 2: Buscar en todo el texto visible del body
        const bodyText = document.body.innerText || '';
        const bodyMatch = bodyText.match(/(?:^|\D)(\d{7})(?:\D|$)/);
        if (bodyMatch) {
            return bodyMatch[1];
        }
    } catch (e) {
        log("Error en getBatchIdFromPage: " + e.message, "error");
    }
    return null;
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

function getActiveBatchLink() {
    // Buscar todos los elementos hoja de texto que tengan "ACTIVE" exactamente, con protección de undefined
    const badges = Array.from(document.querySelectorAll('*')).filter(el => {
        return el.children.length === 0 && el.innerText && el.innerText.trim().toUpperCase() === 'ACTIVE';
    });

    for (const badge of badges) {
        // Subir en el árbol DOM hasta encontrar la etiqueta <a> asociada al lote
        let current = badge;
        while (current && current !== document.body) {
            if (current.tagName === 'A' && current.href.includes('/batches/')) {
                return current.href;
            }
            const link = current.querySelector('a[href*="/batches/"]');
            if (link) {
                return link.href;
            }
            current = current.parentElement;
        }
    }
    
    // Fallback: si no detectamos badge, pero hay tarjetas de lotes, tomamos la primera
    const firstBatchLink = document.querySelector('a[href*="/batches/"]');
    if (firstBatchLink) {
        log("⚠️ No se encontró badge ACTIVE explícito, usando primer lote disponible en pantalla.");
        return firstBatchLink.href;
    }

    return null;
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
        
        const currentUrl = window.location.href;
        const isTelemetryPage = currentUrl.includes('/batches/') || currentUrl.includes('/jobs');

        // --- MODO DE AUTO-NAVEGACIÓN AUTÓNOMA ---
        if (!isTelemetryPage) {
            log("Estamos en la página principal de la estación. Buscando lote activo...");
            const activeBatchLink = getActiveBatchLink();
            
            if (activeBatchLink) {
                log(`🚀 Lote activo detectado de forma autónoma. Redirigiendo a: ${activeBatchLink}`);
                window.location.href = activeBatchLink;
                return;
            } else {
                log("No se detectaron lotes activos en pantalla. Reintentando escaneo en 10s...");
                setTimeout(initialize, 10000);
                return;
            }
        }

        // --- MODO DE TELEMETRÍA (DENTRO DEL LOTE O DE LA TABLA DE TRABAJOS) ---
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
