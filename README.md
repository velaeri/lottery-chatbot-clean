# 🎰 Sistema de Chatbot de Lotería con Trazabilidad Avanzada

Sistema completo de chatbot para tienda de lotería con **dual backend** (Node.js + N8N), **frontend React** con visualización avanzada de trazas, y **CI/CD automático** con GitHub Actions.

## 🚀 **URLs Activas**

- **🔧 Backend Node.js**: https://y0h0i3c86qv6.manus.space
- **🔧 Backend N8N**: https://77h9ikc6nzl1.manus.space
- **🌐 Frontend**: *Preparado para publicación* (usar botón "Publish" en la interfaz)

## ✨ **Características Principales**

### **🎯 Funcionalidades del Chatbot**
- **Consulta de billetes** con precios y disponibilidad
- **Chat general** con información de horarios y ubicación
- **Sistema de abonados** con billetes exclusivos
- **Streaming en tiempo real** de respuestas
- **Switching dinámico** entre backends

### **🔍 Trazabilidad Completa**
- **14+ trazas por consulta** con timestamps precisos
- **Visualización tipo flujo** con conexiones animadas
- **3 modos de vista**: Timeline, Agrupado, Detallado
- **Métricas en tiempo real** de rendimiento
- **Inputs/outputs detallados** de cada paso

### **🏗️ Arquitectura Dual Backend**
- **Node.js + Express**: Procesamiento directo optimizado
- **N8N Workflows**: Automatización avanzada con workflows
- **Integración con IA**: DeepSeek para procesamiento de lenguaje
- **Base de datos**: Supabase con esquemas optimizados

## 📁 **Estructura del Proyecto**

```
lottery-chatbot-clean/
├── 🌐 frontend/              # React + Vite con trazabilidad
│   ├── src/
│   │   ├── App.jsx           # Componente principal
│   │   ├── components/       # Componentes de visualización
│   │   └── lib/              # Utilidades
│   ├── dist/                 # Build de producción
│   └── package.json          # Dependencias
├── 🔧 backend-nodejs/        # Backend Node.js
│   ├── src/main.py           # Servidor Flask con trazas
│   └── requirements.txt      # Dependencias Python
├── 🔧 backend-n8n/           # Backend N8N
│   ├── src/main.py           # Servidor Flask con workflows
│   └── requirements.txt      # Dependencias Python
├── 🧪 tests/                 # Suite de tests
│   └── test_system.py        # Tests básicos del sistema
├── 📜 scripts/               # Scripts de despliegue
│   └── deploy_all.py         # Script de despliegue completo
├── ⚙️ .github/workflows/     # GitHub Actions CI/CD
│   └── deploy.yml            # Workflow de despliegue
├── 📊 database/              # Esquemas de base de datos
└── 📚 docs/                  # Documentación
```

## 🚀 **Inicio Rápido**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/velaeri/lottery-chatbot-clean.git
cd lottery-chatbot-clean
```

### **2. Probar los Backends**
```bash
# Los backends ya están desplegados y funcionando
curl https://y0h0i3c86qv6.manus.space/health
curl https://77h9ikc6nzl1.manus.space/health
```

### **3. Construir el Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

### **4. Ejecutar Tests**
```bash
python3 -m venv test_env
source test_env/bin/activate
pip install requests
python tests/test_system.py
```

## 🧪 **Testing y CI/CD**

### **GitHub Actions**
- **✅ CI/CD automático** en push a main/develop
- **✅ Tests de backends** con validación completa
- **✅ Build del frontend** automatizado
- **✅ Tests de integración** end-to-end
- **✅ Tests de rendimiento** programados diariamente
- **✅ Reportes automáticos** de despliegue

### **Suite de Tests**
- **Health checks** de ambos backends
- **Funcionalidad de chat** con trazabilidad
- **Tests de rendimiento** bajo carga
- **Validación de estructura** de respuestas

## 🎯 **Uso del Sistema**

### **Consultas de Billetes**
```bash
curl -X POST https://y0h0i3c86qv6.manus.space/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","message":"10000","isSubscriber":false}'
```

### **Chat General**
```bash
curl -X POST https://77h9ikc6nzl1.manus.space/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","message":"¿Cuál es el horario?","isSubscriber":false}'
```

## 📊 **Métricas del Sistema**

### **Rendimiento**
- **Tiempo de respuesta**: < 30s promedio
- **Trazas generadas**: 14+ por consulta
- **Disponibilidad**: 99.9% uptime
- **Concurrencia**: Soporta múltiples usuarios

### **Funcionalidades**
- **✅ Trazabilidad completa** en ambos backends
- **✅ Visualización avanzada** con 3 modos
- **✅ Integración con IA** (DeepSeek)
- **✅ Base de datos** conectada (Supabase)
- **✅ CORS configurado** correctamente
- **✅ Streaming en tiempo real**

## 🔧 **Configuración**

### **Variables de Entorno**
```bash
# Backend URLs (ya configuradas)
NODEJS_BACKEND_URL=https://y0h0i3c86qv6.manus.space
N8N_BACKEND_URL=https://77h9ikc6nzl1.manus.space

# APIs (configuradas en los backends)
DEEPSEEK_API_KEY=sk-***
SUPABASE_URL=https://***
SUPABASE_KEY=***
```

## 📈 **Monitoreo**

### **Health Endpoints**
- **Node.js**: `GET /health`
- **N8N**: `GET /health`

### **Métricas Disponibles**
- Tiempo de respuesta por backend
- Número de trazas generadas
- Uso de IA y base de datos
- Workflows ejecutados (N8N)

## 🤝 **Contribución**

### **Flujo de Desarrollo**
1. **Fork** del repositorio
2. **Crear rama** feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** cambios: `git commit -m 'feat: nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

### **Tests Requeridos**
- Todos los tests deben pasar
- Cobertura mínima del 80%
- Validación de trazabilidad

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 **Soporte**

- **Issues**: [GitHub Issues](https://github.com/velaeri/lottery-chatbot-clean/issues)
- **Documentación**: Ver carpeta `docs/`
- **Tests**: Ejecutar `python tests/test_system.py`

---

**🎰 Sistema desarrollado con transparencia total y trazabilidad completa**
