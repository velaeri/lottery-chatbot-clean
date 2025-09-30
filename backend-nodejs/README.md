# 🔧 Backend Node.js - Sistema de Trazabilidad

Backend Flask que simula funcionalidad Node.js + Express con sistema completo de trazabilidad.

## 🚀 URL Activa

**https://xlhyimcd1337.manus.space**

## ✨ Características

- **API RESTful** con endpoints `/chat` y `/health`
- **Trazabilidad completa** (14 pasos por consulta)
- **Integración con Supabase** para consulta de billetes
- **Integración con DeepSeek AI** para procesamiento de lenguaje
- **CORS configurado** para producción
- **Streaming de respuestas** en tiempo real

## 📋 Endpoints

### `POST /chat`
Procesa mensajes del chatbot con trazabilidad completa.

**Request:**
```json
{
  "userId": "user123",
  "message": "10000",
  "isSubscriber": false
}
```

**Response:**
```json
{
  "response": "¡Genial! El billete 10000 está disponible...",
  "traces": [...],
  "usedAI": true,
  "usedDatabase": true
}
```

### `GET /health`
Verifica el estado del sistema.

## 🛠️ Instalación Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python src/main.py
```

## 🔧 Variables de Entorno

- `SUPABASE_URL` - URL de la base de datos
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio
- `DEEPSEEK_API_KEY` - Clave de API de DeepSeek

## 📊 Sistema de Trazas

Genera 14 trazas por consulta:
1. Request Start
2. Request Parsed  
3. Route Detected
4. Ticket Inquiry Start
5. Database Query
6. Database Response
7. Ticket Found
8. AI Processing Start
9. DeepSeek Request
10. DeepSeek Response
11. AI Processing Complete
12. Response Generated
13. Streaming Start
14. Request Complete
