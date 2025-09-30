import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card } from '@/components/ui/card.jsx'
import { Send, MessageCircle, Phone, MoreVertical, Settings, Activity, Eye } from 'lucide-react'
import ImprovedTraceVisualization from './components/ImprovedTraceVisualization.jsx'
import './App.css'
import './components/FlowAnimations.css'
import './components/ImprovedTraceStyles.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedBackend, setSelectedBackend] = useState('nodejs')
  const [showSettings, setShowSettings] = useState(false)
  const [traces, setTraces] = useState([])
  const [showTraceVisualization, setShowTraceVisualization] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const messagesEndRef = useRef(null)

  // URLs de los backends desplegados permanentemente
  const backendUrls = {
    nodejs: 'https://xlhyimcd1337.manus.space',
    n8n: 'https://p9hwiqcq1ln5.manus.space'
  }

  const backendNames = {
    nodejs: 'Node.js + Express',
    n8n: 'N8N Workflows'
  }

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // Mensaje inicial
  useEffect(() => {
    const initialMessage = {
      id: 1,
      text: `🎰 ¡Bienvenido a Lotería El Trébol!

¿En qué puedo ayudarte?

🎫 Consultar disponibilidad: Envía el número de 5 dígitos
💬 Información general: Pregúntame sobre horarios, ubicación, etc.
🎯 Sorteos: Información sobre fechas y premios

Ejemplo: Envía "10000" para consultar ese billete`,
      sender: 'bot',
      timestamp: new Date(),
      backend: 'sistema'
    }
    setMessages([initialMessage])
  }, [])

  // Enviar mensaje con streaming real
  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsStreaming(true)
    setStreamingMessage('')

    try {
      const backendUrl = backendUrls[selectedBackend]
      
      // Llamar al backend seleccionado
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'web_user_' + Date.now(),
          message: currentMessage,
          isSubscriber: isSubscriber
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Capturar trazas si están disponibles
      if (data.trace && data.requestId) {
        setTraces(prev => [...prev, ...data.trace]);
      }
      
      // Simular streaming con la respuesta real
      const words = data.message.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingMessage(currentText);
        
        // Delay más rápido para mejor experiencia
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      // Agregar mensaje final
      const botMessage = {
        id: Date.now() + 1,
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
        usedAI: data.usedAI,
        usedDatabase: data.usedDatabase,
        backend: data.backend || selectedBackend,
        requestId: data.requestId,
        hasTrace: data.trace && data.trace.length > 0
      }

      setMessages(prev => [...prev, botMessage])
      
    } catch (error) {
      console.error('Error procesando mensaje:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: `🤖 Error conectando con ${backendNames[selectedBackend]}: ${error.message}

¿Podrías intentar de nuevo o cambiar de backend?`,
        sender: 'bot',
        timestamp: new Date(),
        backend: selectedBackend,
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsStreaming(false)
      setStreamingMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getBackendIcon = (backend) => {
    switch(backend) {
      case 'nodejs': return '🟢'
      case 'n8n': return '🔄'
      case 'sistema': return '🤖'
      default: return '⚙️'
    }
  }

  const showTraceFlow = (requestId) => {
    setSelectedRequestId(requestId);
    setShowTraceVisualization(true);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header estilo WhatsApp */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold">Lotería El Trébol</h1>
            <p className="text-sm text-green-100">
              {isSubscriber ? '⭐ Abonado' : '📋 Usuario regular'} • 
              <span className="ml-1">{getBackendIcon(selectedBackend)} {backendNames[selectedBackend]}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-white hover:bg-green-700"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSubscriber(!isSubscriber)}
            className="text-white hover:bg-green-700"
            title="Cambiar estado de suscripción"
          >
            {isSubscriber ? '⭐' : '📋'}
          </Button>
          <Phone className="w-5 h-5" />
          <MoreVertical className="w-5 h-5" />
        </div>
      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="bg-white border-b p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Seleccionar Backend</h3>
              <p className="text-sm text-gray-600">Compara diferentes implementaciones</p>
            </div>
            <select
              value={selectedBackend}
              onChange={(e) => setSelectedBackend(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="nodejs">{getBackendIcon('nodejs')} Node.js + Express</option>
              <option value="n8n">{getBackendIcon('n8n')} N8N Workflows</option>
            </select>
          </div>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-gray-800">🟢 Node.js + Express</h4>
              <p className="text-gray-600">Backend tradicional con código TypeScript</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-gray-800">🔄 N8N Workflows</h4>
              <p className="text-gray-600">Automatización visual con workflows</p>
            </div>
          </div>
        </div>
      )}

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-green-500 text-white'
                  : message.isError
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-white text-gray-800 shadow-md'
              }`}
            >
              <p className="whitespace-pre-line">{message.text}</p>
                  <div className={`text-xs mt-1 flex items-center justify-between ${
                message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {message.sender === 'bot' && message.backend && (
                  <div className="ml-2 flex items-center space-x-2">
                    <span className="flex items-center">
                      {getBackendIcon(message.backend)}
                      {message.usedAI && <span className="ml-1">🧠</span>}
                      {message.usedDatabase && <span className="ml-1">🗄️</span>}
                    </span>
                    {message.hasTrace && message.requestId && (
                      <button
                        onClick={() => showTraceFlow(message.requestId)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver flujo de trazas"
                      >
                        <Activity className="w-3 h-3" />
                        <span className="text-xs">Trazas</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Mensaje en streaming */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-md px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
              <p className="whitespace-pre-line">{streamingMessage}</p>
              <div className="flex items-center mt-1 justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  <p className="text-xs text-gray-500">Escribiendo...</p>
                </div>
                <span className="text-xs text-gray-500 flex items-center">
                  {getBackendIcon(selectedBackend)}
                  <span className="ml-1">🧠</span>
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Indicador de escritura cuando no hay streaming */}
        {isStreaming && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-md px-4 py-2 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {getBackendIcon(selectedBackend)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="bg-white p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Escribe un mensaje... (usando ${backendNames[selectedBackend]})`}
            className="flex-1"
            disabled={isStreaming}
          />
          <Button 
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700"
            disabled={isStreaming || !inputMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Panel de información */}
      <div className="bg-gray-50 p-2 text-center text-sm text-gray-600 border-t">
        <p>
          🚀 Sistema activo: <strong>{backendNames[selectedBackend]}</strong> • 
          🧠 DeepSeek AI • 🗄️ Supabase Real • 
          ⚡ Streaming habilitado
        </p>
        <p className="mt-1">
          💡 <strong>Prueba:</strong> 10000, 10090, 10115 (billetes reales) • 
          "¿Cuál es el horario?" (chitchat)
        </p>
      </div>

      {/* Visualización mejorada de trazas */}
      {showTraceVisualization && selectedRequestId && (
        <ImprovedTraceVisualization
          traces={traces.filter(t => t.request_id === selectedRequestId)}
          requestId={selectedRequestId}
          onClose={() => setShowTraceVisualization(false)}
        />
      )}
    </div>
  )
}

export default App

