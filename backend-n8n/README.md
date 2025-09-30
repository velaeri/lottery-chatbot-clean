# 🔧 Backend N8N - Workflows Automatizados

Backend Flask que simula workflows N8N con sistema completo de trazabilidad.

## 🚀 URL Activa

**https://p9hwiqcq1ln5.manus.space**

## ✨ Características

- **Workflows automatizados** para procesamiento de mensajes
- **Trazabilidad completa** con contexto de N8N
- **Integración con Supabase** para base de conocimiento
- **Integración con DeepSeek AI** para chat general
- **Procesamiento por nodos** simulando flujos N8N
- **CORS configurado** para producción

## 📋 Endpoints

### `POST /chat`
Procesa mensajes a través de workflows N8N simulados.

**Request:**
```json
{
  "userId": "user123",
  "message": "¿Cuál es el horario?",
  "isSubscriber": false
}
```

**Response:**
```json
{
  "response": "Nuestro horario es de lunes a viernes...",
  "traces": [...],
  "usedAI": true,
  "usedDatabase": true,
  "workflowsExecuted": ["general_chat_workflow", "knowledge_search_workflow"]
}
```

### `GET /health`
Verifica el estado de los workflows.

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

## 📊 Workflows Simulados

### General Chat Workflow
1. Webhook Received
2. Request Parsed
3. Route Detected
4. Knowledge Search Node
5. AI Chat Processor
6. Response Formatter

### Knowledge Search Workflow
1. Database Query Node
2. Knowledge Processor
3. Context Builder

### AI Response Workflow
1. DeepSeek Start
2. DeepSeek Request
3. DeepSeek Response
4. Response Processing
