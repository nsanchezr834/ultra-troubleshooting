import os
import random
import shutil
from gtts import gTTS
from pydub import AudioSegment
from pydub.generators import WhiteNoise
from mediapipe_model_maker import audio_classifier

def create_synthetic_dataset(output_dir="dataset", num_samples=100):
    wake_word = "Oye Ultra"
    wake_word_dir = os.path.join(output_dir, "wake_word_ultra")
    background_noise_dir = os.path.join(output_dir, "background_noise")
    os.makedirs(wake_word_dir, exist_ok=True)
    os.makedirs(background_noise_dir, exist_ok=True)

    print(f"Generando {num_samples} muestras de '{wake_word}'...")
    temp_tts_file = "temp_tts.mp3"
    tts = gTTS(text=wake_word, lang="es", slow=False)
    tts.save(temp_tts_file)
    
    base_audio = AudioSegment.from_mp3(temp_tts_file)
    base_audio = base_audio.set_frame_rate(16000).set_channels(1)

    for i in range(num_samples):
        vol_change = random.uniform(-5.0, 5.0)
        modified_audio = base_audio + vol_change
        noise_level = random.uniform(-30.0, -15.0) 
        noise = WhiteNoise().to_audio_segment(duration=len(modified_audio)).apply_gain(noise_level)
        final_audio = modified_audio.overlay(noise)
        
        target_duration = 1000 
        if len(final_audio) < target_duration:
            silence = AudioSegment.silent(duration=target_duration - len(final_audio))
            final_audio = final_audio + silence
        elif len(final_audio) > target_duration:
            final_audio = final_audio[:target_duration]
            
        filename = os.path.join(wake_word_dir, f"sample_{i:04d}.wav")
        final_audio.export(filename, format="wav", parameters=["-ac", "1", "-ar", "16000"])
        
    os.remove(temp_tts_file)
    
    print(f"Generando {num_samples // 2} muestras de Ruido de Fondo...")
    for i in range(num_samples // 2):
        noise_level = random.uniform(-25.0, -10.0)
        noise = WhiteNoise().to_audio_segment(duration=1000).apply_gain(noise_level)
        filename = os.path.join(background_noise_dir, f"noise_{i:04d}.wav")
        noise.export(filename, format="wav", parameters=["-ac", "1", "-ar", "16000"])
        
    print("Dataset sintético generado con éxito.\n")

def train_model():
    print("Iniciando entrenamiento del modelo con MediaPipe...")
    train_data = audio_classifier.Dataset.from_folder('./dataset')

    spec = audio_classifier.ModelSpec()
    options = audio_classifier.ModelOptions(spec)
    hparams = audio_classifier.HParams(epochs=20, batch_size=16)

    model = audio_classifier.AudioClassifier.create(
        train_data=train_data,
        validation_data=train_data,
        options=options,
        hparams=hparams
    )

    models_dir = './public/models'
    os.makedirs(models_dir, exist_ok=True)
    model.export_model(models_dir)
    
    # MediaPipe exporta por defecto como 'model.tflite', lo renombramos
    if os.path.exists(os.path.join(models_dir, 'model.tflite')):
        os.rename(os.path.join(models_dir, 'model.tflite'), os.path.join(models_dir, 'wake_word.tflite'))
    
    print(f"¡Modelo exportado exitosamente a {models_dir}/wake_word.tflite!")

if __name__ == "__main__":
    create_synthetic_dataset(num_samples=100)
    train_model()
