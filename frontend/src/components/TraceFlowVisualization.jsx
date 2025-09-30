import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Database, Brain, Server, AlertCircle, CheckCircle, Play, ArrowRight, Maximize2, Minimize2, Activity } from 'lucide-react';
import TechnicalDetailsPanel from './TechnicalDetailsPanel.jsx';
import { EnhancedFlowVisualization, FlowConnections } from './FlowConnections.jsx';

const TraceFlowVisualization = ({ traces, requestId, isVisible, onClose }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedTechnicalDetails, setExpandedTechnicalDetails] = useState(new Set());
  const [viewMode, setViewMode] = useState('flow'); // 'flow', 'detailed', or 'enhanced'

  // Filtrar trazas por request ID
  const filteredTraces = traces.filter(trace => trace.request_id === requestId);

  // Agrupar trazas por flujo lógico
  const groupTraces = (traces) => {
    const groups = [];
    let currentGroup = null;

    traces.forEach((trace, index) => {
      const step = trace.step;
      
      // Definir grupos de flujo
      if (step.includes('START') || step === 'CHAT_REQUEST') {
        currentGroup = {
          id: `group_${index}`,
          title: getGroupTitle(step),
          type: getGroupType(step),
          traces: [trace],
          startTime: trace.timestamp,
          status: 'running'
        };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.traces.push(trace);
        
        // Actualizar estado del grupo
        if (step.includes('ERROR') || step.includes('EXCEPTION')) {
          currentGroup.status = 'error';
        } else if (step.includes('SUCCESS') || step.includes('COMPLETE')) {
          currentGroup.status = 'success';
        }
      }
    });

    return groups;
  };

  const getGroupTitle = (step) => {
    const titles = {
      'CHAT_REQUEST': 'Solicitud de Chat',
      'TICKET_INQUIRY_START': 'Consulta de Billete',
      'GENERAL_CHAT_START': 'Chat General',
      'DEEPSEEK_START': 'Procesamiento IA',
      'SUPABASE_START': 'Consulta Base de Datos',
      'DATABASE_QUERY': 'Consulta Base de Datos'
    };
    
    for (const [key, title] of Object.entries(titles)) {
      if (step.includes(key)) return title;
    }
    
    return step.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getGroupType = (step) => {
    if (step.includes('DEEPSEEK') || step.includes('AI')) return 'ai';
    if (step.includes('SUPABASE') || step.includes('DATABASE')) return 'database';
    if (step.includes('TICKET') || step.includes('CHAT')) return 'business';
    return 'system';
  };

  const getNodeIcon = (type, status) => {
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    
    switch (type) {
      case 'ai': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'database': return <Database className="w-4 h-4 text-blue-500" />;
      case 'business': return <Server className="w-4 h-4 text-orange-500" />;
      default: return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNodeColor = (type, status) => {
    if (status === 'error') return 'border-red-300 bg-red-50';
    if (status === 'success') return 'border-green-300 bg-green-50';
    
    switch (type) {
      case 'ai': return 'border-purple-300 bg-purple-50';
      case 'database': return 'border-blue-300 bg-blue-50';
      case 'business': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleTechnicalDetails = (traceId) => {
    const newExpanded = new Set(expandedTechnicalDetails);
    if (newExpanded.has(traceId)) {
      newExpanded.delete(traceId);
    } else {
      newExpanded.add(traceId);
    }
    setExpandedTechnicalDetails(newExpanded);
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return `${Math.round(duration)}ms`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const groupedTraces = groupTraces(filteredTraces);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Visualización de Flujo de Trazas</h2>
            <p className="text-blue-100">Request ID: {requestId}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Selector de modo de vista */}
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('flow')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'flow' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Play className="w-3 h-3 inline mr-1" />
                Flujo
              </button>
              <button
                onClick={() => setViewMode('enhanced')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'enhanced' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Activity className="w-3 h-3 inline mr-1" />
                Mejorado
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'detailed' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Maximize2 className="w-3 h-3 inline mr-1" />
                Detallado
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {groupedTraces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay trazas disponibles para este request</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vista de flujo */}
              {viewMode === 'flow' && (
                <div className="flex flex-col space-y-6">
                {groupedTraces.map((group, groupIndex) => (
                  <div key={group.id} className="relative">
                    {/* Connection line to next group */}
                    {groupIndex < groupedTraces.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300 z-0"></div>
                    )}
                    
                    {/* Group node */}
                    <div className={`relative z-10 border-2 rounded-lg p-4 ${getNodeColor(group.type, group.status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getNodeIcon(group.type, group.status)}
                          <div>
                            <h3 className="font-semibold text-gray-800">{group.title}</h3>
                            <p className="text-sm text-gray-600">
                              {group.traces.length} pasos • {formatTimestamp(group.startTime)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {group.traces.some(t => t.duration_ms) && (
                            <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDuration(group.traces.reduce((sum, t) => sum + (t.duration_ms || 0), 0))}
                            </span>
                          )}
                          
                          <button
                            onClick={() => toggleNodeExpansion(group.id)}
                            className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                          >
                            {expandedNodes.has(group.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedNodes.has(group.id) && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {group.traces.map((trace, traceIndex) => (
                            <div key={traceIndex} className="relative">
                              {/* Connection line between traces */}
                              {traceIndex < group.traces.length - 1 && (
                                <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200"></div>
                              )}
                              
                              <div className="flex items-start space-x-3 bg-white bg-opacity-50 rounded p-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-gray-800">
                                      {trace.step.replace(/_/g, ' ')}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(trace.timestamp)}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mt-1">{trace.message}</p>
                                  
                                  {/* Data preview */}
                                  {trace.data && (
                                    <div className="mt-2">
                                      <button
                                        onClick={() => setSelectedNode(selectedNode === trace ? null : trace)}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      >
                                        {selectedNode === trace ? 'Ocultar datos' : 'Ver datos'}
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Error display */}
                                  {trace.error && (
                                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
                                      <strong>Error:</strong> {trace.error}
                                    </div>
                                  )}
                                  
                                  {/* Duration */}
                                  {trace.duration_ms && (
                                    <div className="mt-1 flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatDuration(trace.duration_ms)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow to next group */}
                    {groupIndex < groupedTraces.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}

              {/* Vista mejorada con conexiones */}
              {viewMode === 'enhanced' && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Flujo Mejorado con Conexiones Visuales
                    </h3>
                    <p className="text-sm text-gray-600">
                      Visualización avanzada con métricas, conexiones animadas y análisis de rendimiento
                    </p>
                  </div>
                  
                  <EnhancedFlowVisualization 
                    traces={filteredTraces}
                    showMetrics={true}
                    showConnections={true}
                  />
                  
                  {/* Lista de trazas con conexiones */}
                  <div className="space-y-4">
                    {filteredTraces.map((trace, index) => (
                      <div key={index} className="relative">
                        {/* Nodo de traza */}
                        <div className={`border-2 rounded-lg p-4 ${getNodeColor(getGroupType(trace.step), trace.error ? 'error' : 'success')}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getNodeIcon(getGroupType(trace.step), trace.error ? 'error' : 'success')}
                              <div>
                                <h4 className="font-semibold text-gray-800">
                                  {trace.step.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                <p className="text-sm text-gray-600">{trace.message}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {trace.duration_ms && (
                                <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDuration(trace.duration_ms)}
                                </span>
                              )}
                              
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(trace.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Datos resumidos */}
                          {trace.data && (
                            <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                              <strong>Datos:</strong> {JSON.stringify(trace.data).substring(0, 100)}...
                            </div>
                          )}
                        </div>
                        
                        {/* Conexión al siguiente nodo */}
                        {index < filteredTraces.length - 1 && (
                          <FlowConnections
                            fromTrace={trace}
                            toTrace={filteredTraces[index + 1]}
                            connectionType={trace.error ? 'error' : 'sequential'}
                            isAnimated={true}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vista detallada */}
              {viewMode === 'detailed' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Análisis Técnico Detallado
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cada paso del proceso con inputs, outputs y métricas de rendimiento
                    </p>
                  </div>
                  
                  {filteredTraces.map((trace, index) => (
                    <TechnicalDetailsPanel
                      key={`${trace.request_id}_${index}`}
                      trace={trace}
                      isExpanded={expandedTechnicalDetails.has(`${trace.request_id}_${index}`)}
                      onToggle={() => toggleTechnicalDetails(`${trace.request_id}_${index}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected node details panel */}
        {selectedNode && (
          <div className="border-t bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Detalles del Paso</h3>
            <div className="bg-white rounded border p-3">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(selectedNode.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceFlowVisualization;
