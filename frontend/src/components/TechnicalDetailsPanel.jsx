import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, Database, Brain, Server, Clock, AlertTriangle, CheckCircle2, Info, Copy, Download } from 'lucide-react';

const TechnicalDetailsPanel = ({ trace, isExpanded, onToggle }) => {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const formatJSON = (obj) => {
    if (!obj) return 'N/A';
    if (typeof obj === 'string') return obj;
    return JSON.stringify(obj, null, 2);
  };

  const getStepIcon = (step) => {
    if (step.includes('DEEPSEEK') || step.includes('AI')) return <Brain className="w-4 h-4 text-purple-500" />;
    if (step.includes('SUPABASE') || step.includes('DATABASE')) return <Database className="w-4 h-4 text-blue-500" />;
    if (step.includes('REQUEST') || step.includes('RESPONSE')) return <Server className="w-4 h-4 text-green-500" />;
    if (step.includes('ERROR') || step.includes('EXCEPTION')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (step.includes('SUCCESS') || step.includes('COMPLETE')) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <Code className="w-4 h-4 text-gray-500" />;
  };

  const getStepColor = (step) => {
    if (step.includes('ERROR') || step.includes('EXCEPTION')) return 'border-red-200 bg-red-50';
    if (step.includes('SUCCESS') || step.includes('COMPLETE')) return 'border-green-200 bg-green-50';
    if (step.includes('DEEPSEEK') || step.includes('AI')) return 'border-purple-200 bg-purple-50';
    if (step.includes('SUPABASE') || step.includes('DATABASE')) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  const renderDataField = (label, value, fieldKey) => {
    if (!value && value !== 0 && value !== false) return null;

    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    const isLongContent = stringValue.length > 100;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Info className="w-3 h-3 mr-1" />
            {label}
          </label>
          <button
            onClick={() => copyToClipboard(stringValue, fieldKey)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center transition-colors"
            title="Copiar al portapapeles"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copiedField === fieldKey ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        
        <div className={`border rounded-md p-3 ${isLongContent ? 'max-h-40 overflow-y-auto' : ''}`}>
          {typeof value === 'object' ? (
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
              {JSON.stringify(value, null, 2)}
            </pre>
          ) : (
            <div className="text-sm text-gray-800 break-words">
              {String(value)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const downloadTrace = () => {
    const traceData = {
      timestamp: trace.timestamp,
      step: trace.step,
      message: trace.message,
      backend: trace.backend,
      data: trace.data,
      error: trace.error,
      stack_trace: trace.stack_trace,
      duration_ms: trace.duration_ms,
      request_id: trace.request_id
    };

    const blob = new Blob([JSON.stringify(traceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace_${trace.request_id}_${trace.step}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border rounded-lg ${getStepColor(trace.step)} transition-all duration-200`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-white hover:bg-opacity-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStepIcon(trace.step)}
            <div>
              <h3 className="font-semibold text-gray-800">
                {trace.step.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <p className="text-sm text-gray-600">{trace.message}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {trace.duration_ms && (
              <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(trace.duration_ms)}ms
              </span>
            )}
            
            <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors">
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-white bg-opacity-30 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información básica */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Información Básica
              </h4>
              
              {renderDataField('Timestamp', new Date(trace.timestamp).toLocaleString('es-ES'), 'timestamp')}
              {renderDataField('Backend', trace.backend, 'backend')}
              {renderDataField('Request ID', trace.request_id, 'request_id')}
              {renderDataField('Duración (ms)', trace.duration_ms, 'duration')}
            </div>

            {/* Datos de entrada/salida */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Code className="w-4 h-4 mr-2" />
                Datos de Proceso
              </h4>
              
              {renderDataField('Datos de Entrada/Salida', trace.data, 'data')}
              {trace.error && renderDataField('Error', trace.error, 'error')}
              {trace.stack_trace && renderDataField('Stack Trace', trace.stack_trace, 'stack_trace')}
            </div>
          </div>

          {/* Análisis de rendimiento */}
          {trace.duration_ms && (
            <div className="mt-6 p-4 bg-white bg-opacity-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Análisis de Rendimiento
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(trace.duration_ms)}ms</div>
                  <div className="text-sm text-gray-600">Tiempo Total</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${trace.duration_ms < 1000 ? 'text-green-600' : trace.duration_ms < 3000 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {trace.duration_ms < 1000 ? 'Rápido' : trace.duration_ms < 3000 ? 'Normal' : 'Lento'}
                  </div>
                  <div className="text-sm text-gray-600">Evaluación</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {trace.step.includes('DEEPSEEK') ? 'IA' : trace.step.includes('SUPABASE') ? 'DB' : 'SYS'}
                  </div>
                  <div className="text-sm text-gray-600">Tipo</div>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={downloadTrace}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Descargar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalDetailsPanel;
