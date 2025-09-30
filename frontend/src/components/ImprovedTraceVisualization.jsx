import React, { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Clock, Database, Brain, Settings, Copy, Download, Eye, EyeOff } from 'lucide-react'

const ImprovedTraceVisualization = ({ traces, requestId, onClose }) => {
  const [viewMode, setViewMode] = useState('timeline')
  const [expandedSteps, setExpandedSteps] = useState(new Set())
  const [showRawData, setShowRawData] = useState({})

  // Agrupar trazas por categorías
  const groupedTraces = traces.reduce((acc, trace) => {
    const category = getTraceCategory(trace.step)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(trace)
    return acc
  }, {})

  function getTraceCategory(step) {
    if (step.includes('REQUEST') || step.includes('START')) return 'inicio'
    if (step.includes('DATABASE') || step.includes('QUERY')) return 'database'
    if (step.includes('DEEPSEEK') || step.includes('AI')) return 'ai'
    if (step.includes('RESPONSE') || step.includes('COMPLETE')) return 'finalizacion'
    return 'procesamiento'
  }

  function getStepIcon(step) {
    if (step.includes('DATABASE') || step.includes('QUERY')) return <Database className="w-4 h-4" />
    if (step.includes('DEEPSEEK') || step.includes('AI')) return <Brain className="w-4 h-4" />
    if (step.includes('START') || step.includes('REQUEST')) return <Settings className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  function getStepColor(step) {
    if (step.includes('DATABASE')) return 'bg-blue-50 border-blue-200 text-blue-800'
    if (step.includes('DEEPSEEK') || step.includes('AI')) return 'bg-purple-50 border-purple-200 text-purple-800'
    if (step.includes('ERROR')) return 'bg-red-50 border-red-200 text-red-800'
    if (step.includes('COMPLETE') || step.includes('SUCCESS')) return 'bg-green-50 border-green-200 text-green-800'
    return 'bg-gray-50 border-gray-200 text-gray-800'
  }

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSteps(newExpanded)
  }

  const toggleRawData = (index) => {
    setShowRawData(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const downloadTrace = (trace) => {
    const dataStr = JSON.stringify(trace, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trace-${trace.step}-${requestId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatDuration = (ms) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const totalDuration = traces.reduce((sum, trace) => sum + (trace.duration_ms || 0), 0)
  const avgDuration = totalDuration / traces.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Visualización de Trazas</h2>
            <p className="text-sm opacity-90">Request ID: {requestId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Métricas Resumen */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{traces.length}</div>
              <div className="text-xs text-gray-600">Pasos Totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatDuration(totalDuration)}</div>
              <div className="text-xs text-gray-600">Tiempo Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatDuration(avgDuration)}</div>
              <div className="text-xs text-gray-600">Promedio/Paso</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">0%</div>
              <div className="text-xs text-gray-600">Tasa Error</div>
            </div>
          </div>
        </div>

        {/* Selector de Vista */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Agrupado
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔍 Detallado
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'timeline' && (
            <div className="space-y-3">
              {traces.map((trace, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${getStepColor(trace.step)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getStepIcon(trace.step)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{trace.step.replace(/_/g, ' ')}</h3>
                        <p className="text-xs opacity-75 truncate">{trace.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                        {formatTimestamp(trace.timestamp)}
                      </span>
                      {trace.duration_ms && (
                        <span className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                          {formatDuration(trace.duration_ms)}
                        </span>
                      )}
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="p-1 hover:bg-white hover:bg-opacity-30 rounded"
                      >
                        {expandedSteps.has(index) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {expandedSteps.has(index) && (
                    <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Información Básica</h4>
                          <div className="space-y-1 text-xs">
                            <div><strong>Backend:</strong> {trace.backend}</div>
                            <div><strong>Request ID:</strong> {trace.request_id}</div>
                            <div><strong>Timestamp:</strong> {formatTimestamp(trace.timestamp)}</div>
                            {trace.duration_ms && <div><strong>Duración:</strong> {formatDuration(trace.duration_ms)}</div>}
                          </div>
                        </div>
                        
                        {trace.data && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">Datos del Proceso</h4>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => toggleRawData(index)}
                                  className="p-1 hover:bg-white hover:bg-opacity-30 rounded"
                                  title={showRawData[index] ? "Ocultar datos" : "Ver datos"}
                                >
                                  {showRawData[index] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(trace.data, null, 2))}
                                  className="p-1 hover:bg-white hover:bg-opacity-30 rounded"
                                  title="Copiar datos"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => downloadTrace(trace)}
                                  className="p-1 hover:bg-white hover:bg-opacity-30 rounded"
                                  title="Descargar traza"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {showRawData[index] && (
                              <pre className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto max-h-32">
                                {JSON.stringify(trace.data, null, 2)}
                              </pre>
                            )}
                            
                            {!showRawData[index] && (
                              <div className="text-xs space-y-1">
                                {Object.entries(trace.data).slice(0, 3).map(([key, value]) => (
                                  <div key={key}>
                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50)}
                                  </div>
                                ))}
                                {Object.keys(trace.data).length > 3 && (
                                  <div className="text-gray-600">... y {Object.keys(trace.data).length - 3} campos más</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {trace.error && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
                          <h4 className="font-medium text-sm text-red-800 mb-1">Error</h4>
                          <p className="text-xs text-red-700">{trace.error}</p>
                          {trace.stack_trace && (
                            <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                              {trace.stack_trace}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'grouped' && (
            <div className="space-y-4">
              {Object.entries(groupedTraces).map(([category, categoryTraces]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b">
                    <h3 className="font-medium capitalize">{category.replace('_', ' ')} ({categoryTraces.length} pasos)</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {categoryTraces.map((trace, index) => (
                      <div key={index} className={`p-2 rounded border ${getStepColor(trace.step)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStepIcon(trace.step)}
                            <span className="text-sm font-medium">{trace.step.replace(/_/g, ' ')}</span>
                          </div>
                          {trace.duration_ms && (
                            <span className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                              {formatDuration(trace.duration_ms)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-75">{trace.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'detailed' && (
            <div className="space-y-4">
              {traces.map((trace, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className={`p-4 ${getStepColor(trace.step)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{trace.step.replace(/_/g, ' ')}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(trace, null, 2))}
                          className="p-1 hover:bg-white hover:bg-opacity-30 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadTrace(trace)}
                          className="p-1 hover:bg-white hover:bg-opacity-30 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{trace.message}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <strong>Backend:</strong> {trace.backend}
                      </div>
                      <div>
                        <strong>Timestamp:</strong> {formatTimestamp(trace.timestamp)}
                      </div>
                      <div>
                        <strong>Duración:</strong> {formatDuration(trace.duration_ms)}
                      </div>
                    </div>
                  </div>

                  {trace.data && (
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-medium mb-2">Datos del Proceso</h4>
                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-64">
                        {JSON.stringify(trace.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {trace.error && (
                    <div className="p-4 bg-red-50 border-t">
                      <h4 className="font-medium text-red-800 mb-2">Error</h4>
                      <p className="text-sm text-red-700 mb-2">{trace.error}</p>
                      {trace.stack_trace && (
                        <pre className="text-xs text-red-600 bg-white p-2 rounded overflow-x-auto">
                          {trace.stack_trace}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-600">
            Sistema de Trazabilidad Completa - {traces.length} pasos procesados en {formatDuration(totalDuration)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImprovedTraceVisualization
