import React from 'react';
import { ArrowRight, ArrowDown, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const FlowConnections = ({ fromTrace, toTrace, connectionType = 'sequential', isAnimated = true }) => {
  const getConnectionStyle = () => {
    const baseStyle = "transition-all duration-300";
    
    switch (connectionType) {
      case 'error':
        return `${baseStyle} text-red-500 border-red-300`;
      case 'success':
        return `${baseStyle} text-green-500 border-green-300`;
      case 'parallel':
        return `${baseStyle} text-blue-500 border-blue-300`;
      case 'conditional':
        return `${baseStyle} text-yellow-500 border-yellow-300`;
      default:
        return `${baseStyle} text-gray-400 border-gray-300`;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionType) {
      case 'error':
        return <AlertTriangle className="w-3 h-3" />;
      case 'success':
        return <CheckCircle className="w-3 h-3" />;
      case 'parallel':
        return <Zap className="w-3 h-3" />;
      case 'conditional':
        return <Clock className="w-3 h-3" />;
      default:
        return <ArrowRight className="w-3 h-3" />;
    }
  };

  const getConnectionLabel = () => {
    if (!fromTrace || !toTrace) return '';
    
    const timeDiff = new Date(toTrace.timestamp) - new Date(fromTrace.timestamp);
    const duration = Math.round(timeDiff);
    
    switch (connectionType) {
      case 'error':
        return `Error → ${duration}ms`;
      case 'success':
        return `Éxito → ${duration}ms`;
      case 'parallel':
        return `Paralelo → ${duration}ms`;
      case 'conditional':
        return `Condicional → ${duration}ms`;
      default:
        return `${duration}ms`;
    }
  };

  return (
    <div className="flex flex-col items-center my-2 relative">
      {/* Línea de conexión principal */}
      <div className={`w-0.5 h-8 ${getConnectionStyle()} ${isAnimated ? 'animate-pulse' : ''}`}></div>
      
      {/* Nodo de conexión */}
      <div className={`
        relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white
        ${getConnectionStyle()}
        ${isAnimated ? 'hover:scale-110 transition-transform' : ''}
      `}>
        {getConnectionIcon()}
      </div>
      
      {/* Etiqueta de tiempo/estado */}
      {fromTrace && toTrace && (
        <div className={`
          absolute left-12 top-1/2 transform -translate-y-1/2
          px-2 py-1 text-xs rounded-full bg-white border
          ${getConnectionStyle()}
          whitespace-nowrap
        `}>
          {getConnectionLabel()}
        </div>
      )}
      
      {/* Línea de conexión inferior */}
      <div className={`w-0.5 h-8 ${getConnectionStyle()} ${isAnimated ? 'animate-pulse' : ''}`}></div>
    </div>
  );
};

// Componente para conexiones complejas entre múltiples nodos
const ComplexFlowConnection = ({ traces, connectionMap }) => {
  return (
    <div className="relative">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {connectionMap.map((connection, index) => {
          const { from, to, type, curved = false } = connection;
          
          // Calcular posiciones (esto sería más complejo en una implementación real)
          const fromY = from * 100 + 50; // Posición Y del nodo origen
          const toY = to * 100 + 50;     // Posición Y del nodo destino
          const fromX = 50;              // Posición X del nodo origen
          const toX = curved ? 200 : 50; // Posición X del nodo destino
          
          const pathData = curved 
            ? `M ${fromX} ${fromY} Q ${fromX + 100} ${(fromY + toY) / 2} ${toX} ${toY}`
            : `M ${fromX} ${fromY} L ${toX} ${toY}`;
          
          const strokeColor = type === 'error' ? '#ef4444' : 
                             type === 'success' ? '#10b981' : 
                             type === 'parallel' ? '#3b82f6' : '#6b7280';
          
          return (
            <g key={index}>
              <path
                d={pathData}
                stroke={strokeColor}
                strokeWidth="2"
                fill="none"
                strokeDasharray={type === 'conditional' ? '5,5' : 'none'}
                className="transition-all duration-300"
              />
              
              {/* Flecha al final */}
              <polygon
                points={`${toX-5},${toY-3} ${toX},${toY} ${toX-5},${toY+3}`}
                fill={strokeColor}
              />
              
              {/* Etiqueta en el medio de la conexión */}
              <text
                x={(fromX + toX) / 2}
                y={(fromY + toY) / 2 - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {type}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Componente para mostrar métricas de flujo
const FlowMetrics = ({ traces }) => {
  const totalDuration = traces.reduce((sum, trace) => sum + (trace.duration_ms || 0), 0);
  const errorCount = traces.filter(trace => trace.error).length;
  const successCount = traces.filter(trace => trace.step.includes('SUCCESS')).length;
  
  const avgDuration = traces.length > 0 ? totalDuration / traces.length : 0;
  const errorRate = traces.length > 0 ? (errorCount / traces.length) * 100 : 0;
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
        <Zap className="w-4 h-4 mr-2 text-blue-500" />
        Métricas del Flujo
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{traces.length}</div>
          <div className="text-sm text-gray-600">Pasos Totales</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(totalDuration)}ms</div>
          <div className="text-sm text-gray-600">Tiempo Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{Math.round(avgDuration)}ms</div>
          <div className="text-sm text-gray-600">Promedio/Paso</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${errorRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {errorRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Tasa de Error</div>
        </div>
      </div>
      
      {/* Barra de progreso visual */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progreso del Flujo</span>
          <span>{successCount}/{traces.length} completados</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(successCount / traces.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Componente principal que combina todas las conexiones
const EnhancedFlowVisualization = ({ traces, showMetrics = true, showConnections = true }) => {
  // Analizar el flujo para determinar tipos de conexión
  const analyzeConnections = () => {
    const connections = [];
    
    for (let i = 0; i < traces.length - 1; i++) {
      const current = traces[i];
      const next = traces[i + 1];
      
      let connectionType = 'sequential';
      
      if (current.error) {
        connectionType = 'error';
      } else if (current.step.includes('SUCCESS')) {
        connectionType = 'success';
      } else if (current.step.includes('START') && next.step.includes('START')) {
        connectionType = 'parallel';
      } else if (current.step.includes('REQUEST') && next.step.includes('RESPONSE')) {
        connectionType = 'conditional';
      }
      
      connections.push({
        from: i,
        to: i + 1,
        type: connectionType,
        fromTrace: current,
        toTrace: next
      });
    }
    
    return connections;
  };

  const connections = analyzeConnections();

  return (
    <div className="space-y-4">
      {showMetrics && <FlowMetrics traces={traces} />}
      
      {showConnections && (
        <div className="space-y-2">
          {connections.map((connection, index) => (
            <FlowConnections
              key={index}
              fromTrace={connection.fromTrace}
              toTrace={connection.toTrace}
              connectionType={connection.type}
              isAnimated={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { FlowConnections, ComplexFlowConnection, FlowMetrics, EnhancedFlowVisualization };
export default FlowConnections;
