import os
import random
from gtts import gTTS
from pydub import AudioSegment
from pydub.generators import WhiteNoise

def create_synthetic_dataset(output_dir="dataset", num_samples=100):
    wake_word = "Oye Ultra"
    
    # Crear carpetas necesarias para MediaPipe Model Maker
    # MediaPipe requiere una estructura: dataset/clase_1/, dataset/clase_2/
    wake_word_dir = os.path.join(output_dir, "wake_word_ultra")
    background_noise_dir = os.path.join(output_dir, "background_noise")
    
    os.makedirs(wake_word_dir, exist_ok=True)
    os.makedirs(background_noise_dir, exist_ok=True)

    print(f"Generando {num_samples} muestras de '{wake_word}'...")
    
    # 1. Generar audio base con gTTS
    temp_tts_file = "temp_tts.mp3"
    tts = gTTS(text=wake_word, lang="es", slow=False)
    tts.save(temp_tts_file)
    
    base_audio = AudioSegment.from_mp3(temp_tts_file)
    base_audio = base_audio.set_frame_rate(16000).set_channels(1) # MediaPipe requiere 16kHz Mono

    for i in range(num_samples):
        # 2. Aplicar variaciones para robustecer el dataset
        vol_change = random.uniform(-5.0, 5.0)
        modified_audio = base_audio + vol_change
        
        # Generar ruido blanco de fondo
        noise_level = random.uniform(-30.0, -15.0) 
        noise = WhiteNoise().to_audio_segment(duration=len(modified_audio)).apply_gain(noise_level)
        
        # Mezclar
        final_audio = modified_audio.overlay(noise)
        
        # Aseguramos duración de 1 segundo (1000ms) rellenando con silencio si es necesario
        target_duration = 1000 
        if len(final_audio) < target_duration:
            silence = AudioSegment.silent(duration=target_duration - len(final_audio))
            final_audio = final_audio + silence
        elif len(final_audio) > target_duration:
            final_audio = final_audio[:target_duration]
            
        # Exportar a WAV (16kHz Mono)
        filename = os.path.join(wake_word_dir, f"sample_{i:04d}.wav")
        final_audio.export(filename, format="wav", parameters=["-ac", "1", "-ar", "16000"])
        
    os.remove(temp_tts_file)
    print(f"✅ Generadas {num_samples} muestras de Wake Word en {wake_word_dir}")
    
    # 3. Generar ruido de fondo puro (background_noise) para que el modelo aprenda a ignorarlo
    print(f"Generando {num_samples // 2} muestras de Ruido de Fondo...")
    for i in range(num_samples // 2):
        noise_level = random.uniform(-25.0, -10.0)
        noise_duration = 1000 # 1 segundo
        noise = WhiteNoise().to_audio_segment(duration=noise_duration).apply_gain(noise_level)
        
        filename = os.path.join(background_noise_dir, f"noise_{i:04d}.wav")
        noise.export(filename, format="wav", parameters=["-ac", "1", "-ar", "16000"])

    print(f"✅ Generadas muestras de Ruido en {background_noise_dir}")
    print("\nDataset listo. Sube la carpeta 'dataset' a Google Colab y usa MediaPipe Model Maker para exportar tu wake_word.tflite")

if __name__ == "__main__":
    create_synthetic_dataset()
