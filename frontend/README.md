# 📱 Frontend - Chatbot de Lotería

Frontend React con visualización avanzada de trazabilidad para el sistema de chatbot de lotería.

## ✨ Características

- **Interfaz estilo WhatsApp** profesional y responsive
- **Visualización de trazas** en 3 modos (Timeline, Agrupado, Detallado)
- **Métricas en tiempo real** de rendimiento del sistema
- **Streaming de respuestas** con indicadores visuales
- **Switching dinámico** entre backends (Node.js/N8N)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Servir build localmente
python3 -m http.server 8080 -d dist
```

## 🎯 URLs de Backends

- **Node.js**: https://xlhyimcd1337.manus.space
- **N8N**: https://p9hwiqcq1ln5.manus.space

## 📊 Componentes Principales

- `App.jsx` - Componente principal con lógica del chat
- `ImprovedTraceVisualization.jsx` - Visualización avanzada de trazas
- `TechnicalDetailsPanel.jsx` - Panel de detalles técnicos
- `FlowConnections.jsx` - Conexiones visuales entre pasos

## 🧪 Pruebas

Consultas de prueba:
- `10000`, `10090`, `10115` - Billetes reales
- `"¿Cuál es el horario?"` - Chat general

## 🎨 Tecnologías

- React 18 + Vite
- Tailwind CSS
- Lucide React (iconos)
- JavaScript ES6+
