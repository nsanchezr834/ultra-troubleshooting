// ==UserScript==
// @name         Ultra Tech - Robot Mirror Agent (Autoryx V2)
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Scrapes Packaging Log data dynamically based on the Admin Dashboard configuration.
// @author       Autoryx AI
// @match        https://app.ultra.tech/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use script';

    // ALERTA TEMPORAL DE DEBUG - ELIMINAR DESPUÉS
    alert("🤖 [Autoryx V2] ¡Script inyectado correctamente mediante @grant none!");

    // --- CONFIGURACIÓN DE HOST ---
    // Cambia este host por el de producción cuando la aplicación esté en Vercel
    const APP_HOST = "http://localhost:3000";
    const API_KEY = "SUPER_SECRET_BRIDGE_KEY_123";
    const CHECK_INTERVAL_MS = 10000; // Intento de sincronización cada 10 segundos

    let activeRobotConfig = null;
    let isSensing = false;

    // Log Helper
    function log(msg, type = 'info') {
        const prefix = "[Autoryx V2 Bridge]";
        if (type === 'error') console.error(`${prefix} ❌ ${msg}`);
        else if (type === 'warn') console.warn(`${prefix} ⚠️ ${msg}`);
        else console.log(`${prefix} ℹ️ ${msg}`);
    }

    // Paso 1: Consultar la API de Configuración con fetch nativo
    async function loadConfig() {
        try {
            const response = await fetch(`${APP_HOST}/api/robot-mirror/config`);
            if (response.ok) {
                const res = await response.json();
                return res.data || [];
            } else {
                log("Error al consultar configuración de robots (HTTP " + response.status + ")", "warn");
                return [];
            }
        } catch (e) {
            log("Error de conexión con la aplicación de administración: " + e.message, "error");
            return [];
        }
    }

    // Paso 2: Validación de Entorno
    function findMatchingRobot(configs) {
        const currentUrl = window.location.href;
        return configs.find(config => {
            if (!config.target_url) return false;
            // Normalizar URLs (remover slash final, espacios, etc)
            const cleanTarget = config.target_url.trim().replace(/\/$/, "");
            const cleanCurrent = currentUrl.trim().replace(/\/$/, "");
            return cleanCurrent.startsWith(cleanTarget);
        });
    }

    // Paso 3: Extraer órdenes del DOM (Scraping pasivo de 3 o 7 columnas)
    function scrapePackagingLog() {
        const rows = document.querySelectorAll('table tbody tr');
        if (!rows || rows.length === 0) return [];

        const orders = [];
        const maxRows = Math.min(rows.length, 11); // Orden actual + 10 anteriores

        for (let i = 0; i < maxRows; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 3) { // Soporta tabla colapsada o completa
                orders.push({
                    ship_to: cells[0]?.innerText.trim() || 'Desconocido',
                    carrier: cells[1]?.innerText.trim() || '',
                    status: cells[2]?.innerText.trim() || '',
                    attempted_at: cells[3] ? cells[3].innerText.trim() : '',
                    time_s: cells[4] ? cells[4].innerText.trim() : '',
                    order_number: cells[5] ? cells[5].innerText.trim() : `ID-${Math.random().toString(36).substring(2, 7)}`,
                    order_id: cells[6] ? cells[6].innerText.trim() : ''
                });
            }
        }
        return orders;
    }

    // Paso 4: Enviar datos al endpoint del backend usando fetch nativo
    async function syncData() {
        if (!activeRobotConfig) return;

        const orders = scrapePackagingLog();
        if (orders.length === 0) {
            log(`Sincronización pausada: No se encontraron órdenes en la tabla de ${activeRobotConfig.name}.`);
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
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                log(`Sincronización exitosa (${orders.length} órdenes) para ${activeRobotConfig.name}.`);
            } else {
                log(`Fallo de guardado en el servidor puente (HTTP ${response.status})`, "error");
            }
        } catch (err) {
            log("Error de red al enviar logs al servidor puente: " + err.message, "error");
        }
    }

    // Orquestación
    async function initialize() {
        log("Iniciando análisis del entorno...");
        const configs = await loadConfig();
        
        if (configs.length === 0) {
            log("No se encontraron configuraciones de robots activos en el servidor. Reintentando en 15s...", "warn");
            setTimeout(initialize, 15000);
            return;
        }

        activeRobotConfig = findMatchingRobot(configs);

        if (activeRobotConfig) {
            log(`✅ ¡Estación Autorizada Detectada! Espejando logs para [${activeRobotConfig.name}] (${activeRobotConfig.id})`);
            isSensing = true;
            // Ejecutar sync
            syncData();
            setInterval(syncData, CHECK_INTERVAL_MS);
        } else {
            log("🛑 URL no registrada en el Dashboard de Admin. Entrando en modo suspensión para no interferir.");
        }
    }

    // Iniciar con retraso de 3 segundos para asegurar la carga del DOM de Ultra Tech
    setTimeout(initialize, 3000);
})();
