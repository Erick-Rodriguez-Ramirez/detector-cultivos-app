import React, { useState } from 'react'; // Import useState
import {
  CssBaseline, Box, Typography, Button, CircularProgress,
  Card, CardMedia, CardContent, Alert,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// --- Basic Theme (Dark Mode) ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// --- Diccionario de Traducción (Asegúrate de que esté completo) ---
const traducciones = {
  "Cana___Healthy": "Caña de Azúcar - Saludable", "Cana___Mosaic": "Caña de Azúcar - Mosaico", "Cana___RedRot": "Caña de Azúcar - Pudrición Roja", "Cana___Rust": "Caña de Azúcar - Roya", "Cana___Yellow": "Caña de Azúcar - Hoja Amarilla", "Chile__healthy": "Chile - Saludable", "Chile__leaf curl": "Chile - Enrollamiento de Hoja / Rizo", "Chile__leaf spot": "Chile - Mancha Foliar", "Chile__whitefly": "Chile - Mosca Blanca", "Chile__yellowish": "Chile - Amarillamiento / Vena Amarilla", "Naranja___Black-spot": "Naranja - Mancha Negra", "Naranja___Canker": "Naranja - Cancro Cítrico", "Naranja___Greening": "Naranja - Huanglongbing (HLB)", "Naranja___Healthy": "Naranja - Saludable", "Papa___bacterial_wilt": "Papa - Marchitez Bacteriana", "Papa___early_blight": "Papa - Tizón Temprano", "Papa___healthy": "Papa - Saludable", "Papa___late_blight": "Papa - Tizón Tardío", "Papa___leafroll_virus": "Papa - Virus del Enrollamiento de la Hoja", "Papa___mosaic_virus": "Papa - Virus del Mosaico", "Papa___pests": "Papa - Daño por Plagas", "Papa___phytophthora": "Papa - Tizón Tardío (Phytophthora)", "Pimiento___Bacterial_spot": "Pimiento - Mancha Bacteriana", "Pimiento___healthy": "Pimiento - Saludable", "Tomate___bacterial_spot": "Tomate - Mancha Bacteriana", "Tomate___early_blight": "Tomate - Tizón Temprano", "Tomate___healthy": "Tomate - Saludable", "Tomate___late_blight": "Tomate - Tizón Tardío", "Tomate___leaf_curl": "Tomate - Enrollamiento de Hoja / Rizo Chino", "Tomate___leaf_mold": "Tomate - Moho de la Hoja", "Tomate___mosaic_virus": "Tomate - Virus del Mosaico", "Tomate___septoria_leaf_spot": "Tomate - Septoriosis / Mancha por Septoria", "Tomate___spider_mites": "Tomate - Daño por Araña Roja", "Tomate___target_spot": "Tomate - Mancha Diana", "Trigo__brown_rust": "Trigo - Roya de la Hoja / Roya Marrón", "Trigo__healthy": "Trigo - Saludable", "Trigo__yellow_rust": "Trigo - Roya Amarilla / Roya Estriada", "cafe___healthy": "Café - Saludable", "cafe___red_spider_mite": "Café - Daño por Araña Roja", "cafe___rust": "Café - Roya", "cafe__miner": "Café - Minador de la Hoja", "cafe__phoma": "Café - Mancha de Phoma / Ojo de Gallo", "frijol___angular_leaf_spot": "Frijol - Mancha Angular", "frijol___bean_rust": "Frijol - Roya", "frijol___healthy": "Frijol - Saludable", "maiz___Blight": "Maíz - Tizón Foliar", "maiz___Common_Rust": "Maíz - Roya Común", "maiz___Gray_Leaf_Spot": "Maíz - Mancha Gris / Cercospora", "maiz___Healthy": "Maíz - Saludable"
};

const getTranslation = (className) => {
  return traducciones[className] || className;
};

// Lista de Cultivos Principales
const cultivos = [ "Cana", "Chile", "Naranja", "Papa", "Pimiento", "Tomate", "Trigo", "cafe", "frijol", "maiz" ];
const nombresCultivos = { "Cana": "Caña de Azúcar", "Chile": "Chile", "Naranja": "Naranja", "Papa": "Papa", "Pimiento": "Pimiento", "Tomate": "Tomate", "Trigo": "Trigo", "cafe": "Café", "frijol": "Frijol", "maiz": "Maíz" };


function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [predictionResult, setPredictionResult] = useState({ main: null, crop_specific: null });
  const [confidence, setConfidence] = useState({ main: null, crop_specific: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('');

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null); setPredictionResult({ main: null, crop_specific: null }); setConfidence({ main: null, crop_specific: null });

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedCrop) formData.append('crop', selectedCrop);

    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error del servidor: ${response.statusText}` }));
        throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPredictionResult({ main: data.main_prediction, crop_specific: data.crop_specific_prediction });
      setConfidence({ main: data.main_confidence, crop_specific: data.crop_specific_confidence });
    } catch (err) {
      console.error("Error al predecir:", err);
      setError(`Error al procesar la imagen: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {/* Main Container: Use Grid for Centering */}
      <Box
        sx={{
          display: 'grid',         // Usar Grid layout
          placeItems: 'center',    // Centrar item vertical y horizontalmente
          minHeight: '100vh',       // Asegura altura completa
          width: '100%',          // Asegura ancho completo
          p: 2,                     // Padding alrededor del bloque de contenido
          boxSizing: 'border-box',
        }}
      >
        {/* Content Box: Max Width and Vertical Stacking using Flexbox */}
        <Box
          sx={{
            maxWidth: '600px',       // Limita el ancho máximo
            width: '100%',           // Usa el ancho disponible hasta el máximo
            display: 'flex',          // Usar flexbox para apilar contenido interno
            flexDirection: 'column',   // Apilar verticalmente
            alignItems: 'center',    // Centrar contenido interno horizontalmente
            textAlign: 'center',     // Centrar texto
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            🌿 Detector de Enfermedades de Cultivos
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Sube una imagen de una hoja para analizarla con IA.
          </Typography>

          {/* Menú Desplegable */}
          <FormControl fullWidth sx={{ mb: 3, maxWidth: '400px' }}>
            <InputLabel id="crop-select-label">Selecciona el Cultivo (Opcional)</InputLabel>
            <Select
              labelId="crop-select-label"
              id="crop-select"
              value={selectedCrop}
              label="Selecciona el Cultivo (Opcional)"
              onChange={(e) => setSelectedCrop(e.target.value)}
            >
              <MenuItem value=""><em>Dejar que el modelo decida</em></MenuItem>
              {cultivos.map((cultivo) => (
                <MenuItem key={cultivo} value={cultivo}>{nombresCultivos[cultivo] || cultivo}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Botón y Carga */}
          <Box sx={{ mb: 3 }}>
            <Button variant="contained" component="label" startIcon={<PhotoCamera />} disabled={isLoading} size="large">
              {uploadedImage ? "Cambiar Imagen" : "Seleccionar Imagen"}
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            </Button>
            {isLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
          </Box>

          {/* Área de Imagen y Predicción */}
          {uploadedImage && (
             <Box sx={{ width: '100%', mt: 2 }}>
                <Card>
                  <CardMedia component="img" image={uploadedImage} alt="Cultivo subido" sx={{ maxHeight: '50vh', objectFit: 'contain' }} />
                  <CardContent>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {predictionResult.main && !error && (
                      <>
                        <Typography variant="h5" component="div" sx={{ mt: 1, color: 'lightgreen' }}>
                          Predicción Principal: {getTranslation(predictionResult.main)}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                          Confianza: {confidence.main}
                        </Typography>
                        {predictionResult.crop_specific && predictionResult.crop_specific !== predictionResult.main && (
                          <>
                            <hr />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                              La predicción más probable para {nombresCultivos[selectedCrop] || selectedCrop} es:
                            </Typography>
                            <Typography variant="h5" component="div" sx={{ mt: 1, color: 'lightblue' }}>
                               {getTranslation(predictionResult.crop_specific)}
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                              Confianza: {confidence.crop_specific}
                            </Typography>
                          </>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
             </Box>
          )}

          {/* Footer */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>
            Proyecto de Prácticas Profesionales.
          </Typography>
        </Box> {/* Fin Content Box */}
      </Box> {/* Fin Main Container Box */}
    </ThemeProvider>
  );
}

export default App;