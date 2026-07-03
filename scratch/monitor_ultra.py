import webbrowser
import time
import requests
import json

# ==============================================================================
# SCRIPT DE MONITOREO Y APERTURA DE PÁGINAS - PLATAFORMA ULTRA
# ==============================================================================

# 1. LISTA DE URLs QUE DESEAS ABRIR O MONITOREAR
# Reemplaza estas URLs con las rutas reales de la plataforma Ultra donde ves los batches/jobs
URLS_A_ABRIR = [
    "https://plataforma-ultra.com/dashboard/robot-1/jobs",
    "https://plataforma-ultra.com/dashboard/robot-2/batches",
    "https://plataforma-ultra.com/dashboard/robot-3/status"
]

def abrir_paginas_en_navegador():
    """
    Esta función abre automáticamente las URLs en pestañas nuevas de tu navegador predeterminado (Chrome, Edge, etc.)
    Útil para cuando quieres revisar visualmente los visores rápidamente.
    """
    print("Abriendo páginas en el navegador...")
    for url in URLS_A_ABRIR:
        webbrowser.open_new_tab(url)
        # Pequeña pausa para no saturar el navegador al abrir muchas pestañas de golpe
        time.sleep(1)
    print("Páginas abiertas con éxito.")

def monitorear_por_fetch_background():
    """
    Si lo que necesitas es hacer un 'fetch' (petición HTTP) por debajo del agua para revisar 
    si un job o batch está fallando sin abrir el navegador, puedes usar esta función.
    """
    print("\nIniciando monitoreo de endpoints (Fetch)...")
    
    # Ejemplo de un endpoint de API que podrías estar consultando
    api_url = "https://plataforma-ultra.com/api/v1/robots/status"
    
    # Si la plataforma requiere autenticación (Token), lo pones aquí:
    headers = {
        "Authorization": "Bearer TU_TOKEN_AQUI",
        "Content-Type": "application/json"
    }
    
    try:
        # Hacemos el fetch (GET request)
        response = requests.get(api_url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("Datos obtenidos correctamente:")
            print(json.dumps(data, indent=2))
            
            # Aquí podrías poner tu lógica:
            # if data['robot_1']['status'] == 'FAULT':
            #     print("¡Alerta! Robot 1 falló")
        else:
            print(f"Error al consultar. Código HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"Error de conexión: {e}")

if __name__ == "__main__":
    # Opción A: Descomenta esta línea si quieres que se abran las pestañas físicas en Chrome/Edge
    # abrir_paginas_en_navegador()
    
    # Opción B: Descomenta esta línea si quieres hacer el fetch silencioso en consola
    # monitorear_por_fetch_background()
    
    print("Script listo. Edita las URLs y descomenta la función que necesites ejecutar.")
