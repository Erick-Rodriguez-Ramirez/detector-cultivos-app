from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io

# Inicializar la aplicación Flask
app = Flask(__name__)
# Configurar CORS para permitir peticiones desde el frontend de React
CORS(app)

# Cargar el modelo TFLite y las clases (una sola vez al iniciar)
try:
    interpreter = tf.lite.Interpreter(model_path='frontend/public/model.tflite')
    interpreter.allocate_tensors()
    with open('frontend/public/class_names.txt', 'r') as f:
        class_names = [line.strip() for line in f.readlines()]
    print("Backend: Modelo y clases cargados exitosamente.")
except Exception as e:
    print(f"Backend Error: No se pudo cargar el modelo o las clases: {e}")
    interpreter = None
    class_names = []

# Definir la ruta de la API para la predicción
@app.route('/predict', methods=['POST'])
def predict():
    if interpreter is None:
        return jsonify({'error': 'Modelo no cargado en el backend'}), 500

    # --- 1. Obtener Archivo y Cultivo Seleccionado ---
    if 'file' not in request.files:
        return jsonify({'error': 'No se encontró el archivo'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400

    # Obtener el cultivo seleccionado del formulario (puede ser None si no se envió)
    selected_crop_prefix = request.form.get('crop') # Ej: 'maiz', 'cafe', etc. o None

    try:
        # --- 2. Pre-procesar la Imagen ---
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_resized = image.resize((224, 224))
        image_array = np.array(image_resized, dtype=np.float32)
        image_batch = np.expand_dims(image_array, axis=0)

        # --- 3. Realizar la Predicción ---
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        interpreter.set_tensor(input_details[0]['index'], image_batch)
        interpreter.invoke()
        # Obtenemos TODAS las probabilidades
        predictions = interpreter.get_tensor(output_details[0]['index'])[0] # Accedemos al primer (y único) elemento del lote

        # --- 4. Procesar Resultados según la Lógica Acordada ---

        # Encontrar la predicción principal (la más alta de todas)
        main_pred_index = np.argmax(predictions)
        main_pred_class = class_names[main_pred_index]
        main_pred_confidence = 100 * predictions[main_pred_index]

        # Inicializar variables para la predicción específica del cultivo
        crop_specific_pred_class = None
        crop_specific_pred_confidence = None

        # Si el usuario seleccionó un cultivo Y la predicción principal no pertenece a ese cultivo...
        if selected_crop_prefix and not main_pred_class.startswith(selected_crop_prefix + '_'):
            # Buscar la mejor predicción DENTRO del cultivo seleccionado
            best_crop_pred_index = -1
            highest_crop_prob = -1.0

            # Iteramos sobre todas las probabilidades y sus clases
            for i, prob in enumerate(predictions):
                # Si la clase actual pertenece al cultivo seleccionado Y su probabilidad es la más alta encontrada HASTA AHORA para ese cultivo...
                if class_names[i].startswith(selected_crop_prefix + '_') and prob > highest_crop_prob:
                    highest_crop_prob = prob
                    best_crop_pred_index = i
            
            # Si encontramos una predicción para ese cultivo
            if best_crop_pred_index != -1:
                crop_specific_pred_class = class_names[best_crop_pred_index]
                crop_specific_pred_confidence = 100 * highest_crop_prob

        # --- 5. Devolver la Respuesta JSON Estructurada ---
        return jsonify({
            'main_prediction': main_pred_class,
            'main_confidence': f"{main_pred_confidence:.2f}%",
            'crop_specific_prediction': crop_specific_pred_class, # Será None si la principal ya coincidía o no se encontró otra
            'crop_specific_confidence': f"{crop_specific_pred_confidence:.2f}%" if crop_specific_pred_confidence is not None else None
        })

    except Exception as e:
        print(f"Error durante la predicción: {e}") # Imprime el error en la consola del backend
        return jsonify({'error': f'Error interno del servidor: {e}'}), 500

# Ejecutar la aplicación
if __name__ == '__main__':
    app.run(debug=True, port=5000)