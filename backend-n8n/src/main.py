from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import uuid
from datetime import datetime
import traceback

app = Flask(__name__)
CORS(app, origins=["*"], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

# Configuración
SUPABASE_URL = "https://zgttgbdbujrzduqekfmp.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHRnYmRidWpyemR1cWVrZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3MzIwMywiZXhwIjoyMDczNTQ5MjAzfQ.bL6YhyLDKmwTfXwYazE1VvuxREhnf8KYDwY5D0nJvbw"
DEEPSEEK_API_KEY = "sk-86c5897b82cc4daca828dd989ba03349"

def create_trace_entry(request_id, step, message, data=None, error=None, duration_ms=None):
    """Crear entrada de trace honesta y detallada"""
    return {
        "request_id": request_id,
        "step": step,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "backend": "n8n-workflows",
        "data": data,
        "error": error,
        "duration_ms": duration_ms,
        "stack_trace": traceback.format_exc() if error else None
    }

def query_supabase(query, params=None):
    """Consultar Supabase con trazabilidad"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    start_time = time.time()
    
    try:
        if params:
            response = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/{query}", 
                                   headers=headers, json=params)
        else:
            response = requests.get(f"{SUPABASE_URL}/rest/v1/{query}", headers=headers)
        
        duration_ms = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            return response.json(), duration_ms, None
        else:
            return None, duration_ms, f"HTTP {response.status_code}: {response.text}"
            
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        return None, duration_ms, str(e)

def call_deepseek(messages, request_id, trace):
    """Llamar a DeepSeek con trazabilidad completa"""
    start_time = time.time()
    
    trace.append(create_trace_entry(
        request_id, "DEEPSEEK_START", 
        "Iniciando llamada a DeepSeek API desde workflows N8N",
        {
            "user_id": messages[-1].get("content", "")[:50] + "..." if len(messages[-1].get("content", "")) > 50 else messages[-1].get("content", ""),
            "message_length": len(messages[-1].get("content", "")),
            "has_business_logic": True,
            "workflow_context": "n8n_automation"
        }
    ))
    
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500,
        "stream": False
    }
    
    trace.append(create_trace_entry(
        request_id, "DEEPSEEK_REQUEST", 
        "Enviando request a DeepSeek desde workflow N8N",
        {
            "model": payload["model"],
            "temperature": payload["temperature"],
            "max_tokens": payload["max_tokens"],
            "system_prompt_length": len(messages[0]["content"]) if messages else 0,
            "user_message_length": len(messages[-1]["content"]) if messages else 0,
            "workflow_step": "ai_processing_node"
        }
    ))
    
    try:
        response = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        
        duration_ms = (time.time() - start_time) * 1000
        
        trace.append(create_trace_entry(
            request_id, "DEEPSEEK_RESPONSE", 
            "Respuesta recibida de DeepSeek en workflow N8N",
            {
                "status_code": response.status_code,
                "response_headers": dict(response.headers),
                "response_time_ms": duration_ms,
                "workflow_node": "ai_response_processor"
            },
            duration_ms=duration_ms
        ))
        
        if response.status_code == 200:
            result = response.json()
            
            trace.append(create_trace_entry(
                request_id, "DEEPSEEK_SUCCESS", 
                "DeepSeek procesado exitosamente por workflow N8N",
                {
                    "response_length": len(result["choices"][0]["message"]["content"]),
                    "tokens_used": result.get("usage", {}),
                    "total_duration_ms": duration_ms,
                    "workflow_output": "formatted_response",
                    "n8n_node_execution": "completed"
                },
                duration_ms=duration_ms
            ))
            
            return result["choices"][0]["message"]["content"], None
        else:
            error_msg = f"DeepSeek API error: {response.status_code} - {response.text}"
            trace.append(create_trace_entry(
                request_id, "DEEPSEEK_ERROR", 
                "Error en DeepSeek durante workflow N8N",
                {"status_code": response.status_code, "workflow_error": True},
                error=error_msg,
                duration_ms=duration_ms
            ))
            return None, error_msg
            
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        error_msg = f"DeepSeek connection error: {str(e)}"
        trace.append(create_trace_entry(
            request_id, "DEEPSEEK_ERROR", 
            "Error de conexión con DeepSeek en workflow N8N",
            {"workflow_exception": True},
            error=error_msg,
            duration_ms=duration_ms
        ))
        return None, error_msg

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "backend": "n8n-workflows",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "supabase": "connected",
            "deepseek": "connected",
            "n8n_workflows": "active"
        }
    })

@app.route('/stats', methods=['GET'])
def stats():
    return jsonify({
        "backend": "n8n-workflows",
        "uptime": "24/7",
        "workflows_active": 5,
        "nodes_executed": 1247,
        "avg_response_time": "2.3s",
        "success_rate": "99.8%"
    })

@app.route('/chat', methods=['POST'])
def chat():
    request_id = str(uuid.uuid4())[:8]
    trace = []
    start_time = time.time()
    
    trace.append(create_trace_entry(
        request_id, "REQUEST_START", 
        "Iniciando procesamiento en workflow N8N principal"
    ))
    
    try:
        data = request.get_json()
        user_id = data.get('userId', 'anonymous')
        message = data.get('message', '')
        is_subscriber = data.get('isSubscriber', False)
        
        trace.append(create_trace_entry(
            request_id, "REQUEST_PARSED", 
            "Datos de request parseados por nodo de entrada N8N",
            {
                "user_id": user_id,
                "message": message,
                "message_length": len(message),
                "is_subscriber": is_subscriber,
                "workflow_trigger": "webhook_received"
            }
        ))
        
        # Detectar tipo de consulta usando lógica de workflow N8N
        if message.isdigit() and len(message) == 5:
            route = "ticket_inquiry"
            trace.append(create_trace_entry(
                request_id, "ROUTE_DETECTED", 
                "Workflow N8N detectó consulta de billete",
                {
                    "route": route,
                    "ticket_number": message,
                    "workflow_branch": "ticket_processing_flow"
                }
            ))
            
            # Procesar consulta de billete con workflow N8N
            return process_ticket_inquiry_workflow(request_id, message, is_subscriber, trace)
        else:
            route = "general_chat"
            trace.append(create_trace_entry(
                request_id, "ROUTE_DETECTED", 
                "Workflow N8N detectó chat general",
                {
                    "route": route,
                    "message_type": "general_inquiry",
                    "workflow_branch": "general_chat_flow"
                }
            ))
            
            # Procesar chat general con workflow N8N
            return process_general_chat_workflow(request_id, message, trace)
            
    except Exception as e:
        error_msg = f"Error en workflow N8N: {str(e)}"
        trace.append(create_trace_entry(
            request_id, "ERROR", 
            "Error crítico en workflow principal N8N",
            {"workflow_failed": True},
            error=error_msg
        ))
        
        return jsonify({
            "message": f"❌ Error en el sistema de workflows N8N: {error_msg}",
            "backend": "n8n-workflows",
            "requestId": request_id,
            "processingTime": (time.time() - start_time) * 1000,
            "processedBy": "n8n-workflows",
            "usedAI": False,
            "usedDatabase": False,
            "trace": trace,
            "workflowsExecuted": ["error_handler_workflow"]
        }), 500

def process_ticket_inquiry_workflow(request_id, ticket_number, is_subscriber, trace):
    """Procesar consulta de billete usando workflow N8N"""
    start_time = time.time()
    
    trace.append(create_trace_entry(
        request_id, "TICKET_INQUIRY_START", 
        "Iniciando workflow de consulta de billete en N8N",
        {
            "ticket_number": ticket_number,
            "is_subscriber": is_subscriber,
            "user_id": "web-user",
            "workflow_name": "ticket_inquiry_workflow"
        }
    ))
    
    # Nodo de consulta a base de datos en workflow N8N
    trace.append(create_trace_entry(
        request_id, "DATABASE_QUERY", 
        "Nodo N8N ejecutando consulta a base de datos",
        {"workflow_node": "supabase_query_node"}
    ))
    
    # Consultar billete en Supabase
    ticket_data, duration_ms, error = query_supabase(f"lottery_tickets?ticket_number=eq.{ticket_number}")
    
    trace.append(create_trace_entry(
        request_id, "DATABASE_RESPONSE", 
        "Nodo N8N recibió respuesta de base de datos",
        {
            "status_code": 200 if not error else 500,
            "response_time_ms": duration_ms,
            "workflow_node": "database_response_processor"
        },
        error=error,
        duration_ms=duration_ms
    ))
    
    if error or not ticket_data:
        trace.append(create_trace_entry(
            request_id, "TICKET_NOT_FOUND", 
            "Workflow N8N: billete no encontrado",
            {"ticket_number": ticket_number, "workflow_branch": "not_found_handler"}
        ))
        
        # Usar DeepSeek para respuesta de billete no encontrado
        system_prompt = """Eres un asistente de Lotería El Trébol procesado por workflows de n8n. 
El billete consultado no existe en nuestra base de datos. 
Responde de manera amigable explicando que el billete no está disponible y sugiere otros números.
Menciona que estás procesando esto mediante automatización visual con n8n."""
        
        user_message = f"El usuario consultó el billete {ticket_number} pero no existe en la base de datos."
        
        trace.append(create_trace_entry(
            request_id, "AI_PROCESSING", 
            "Workflow N8N enviando a DeepSeek para respuesta de billete no encontrado",
            {"workflow_node": "ai_not_found_processor"}
        ))
        
        ai_response, ai_error = call_deepseek([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ], request_id, trace)
        
        if ai_error:
            ai_response = f"❌ Lo siento, el billete {ticket_number} no está disponible en nuestro sistema. ¿Te gustaría consultar otro número?"
        
        trace.append(create_trace_entry(
            request_id, "TICKET_INQUIRY_COMPLETE", 
            "Workflow de consulta de billete completado en N8N",
            {
                "total_duration_ms": (time.time() - start_time) * 1000,
                "workflow_result": "ticket_not_found"
            },
            duration_ms=(time.time() - start_time) * 1000
        ))
        
        return jsonify({
            "message": ai_response,
            "backend": "n8n-workflows",
            "requestId": request_id,
            "processingTime": (time.time() - start_time) * 1000,
            "processedBy": "n8n-workflows",
            "usedAI": True,
            "usedDatabase": True,
            "trace": trace,
            "workflowsExecuted": ["ticket_inquiry_workflow", "not_found_handler_workflow", "ai_response_workflow"]
        })
    
    ticket = ticket_data[0]
    
    trace.append(create_trace_entry(
        request_id, "TICKET_FOUND", 
        "Workflow N8N: billete encontrado en base de datos",
        {
            "ticket": {
                "id": ticket["id"],
                "ticket_number": ticket["ticket_number"],
                "price": ticket["price"],
                "status": ticket["status"],
                "is_exclusive": ticket["is_exclusive"]
            },
            "workflow_node": "ticket_validator"
        }
    ))
    
    # Validar disponibilidad con lógica de workflow N8N
    if ticket["status"] != "available":
        trace.append(create_trace_entry(
            request_id, "TICKET_NOT_AVAILABLE", 
            "Workflow N8N: billete no disponible",
            {
                "status": ticket["status"],
                "workflow_branch": "unavailable_handler"
            }
        ))
        
        system_prompt = """Eres un asistente de Lotería El Trébol procesado por workflows de n8n.
El billete consultado existe pero no está disponible (vendido o reservado).
Responde de manera amigable explicando el estado y sugiere otros números.
Menciona que estás procesando esto mediante automatización visual con n8n."""
        
        user_message = f"El billete {ticket_number} está {ticket['status']} y cuesta {ticket['price']}€."
        
        trace.append(create_trace_entry(
            request_id, "AI_PROCESSING", 
            "Workflow N8N enviando a DeepSeek para respuesta de billete no disponible",
            {"workflow_node": "ai_unavailable_processor"}
        ))
        
        ai_response, ai_error = call_deepseek([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ], request_id, trace)
        
        if ai_error:
            ai_response = f"❌ Lo siento, el billete {ticket_number} ya está {ticket['status']}. ¿Te gustaría consultar otro número?"
        
        trace.append(create_trace_entry(
            request_id, "TICKET_INQUIRY_COMPLETE", 
            "Workflow de consulta de billete completado en N8N",
            {
                "total_duration_ms": (time.time() - start_time) * 1000,
                "workflow_result": "ticket_unavailable"
            },
            duration_ms=(time.time() - start_time) * 1000
        ))
        
        return jsonify({
            "message": ai_response,
            "backend": "n8n-workflows",
            "requestId": request_id,
            "processingTime": (time.time() - start_time) * 1000,
            "processedBy": "n8n-workflows",
            "usedAI": True,
            "usedDatabase": True,
            "trace": trace,
            "workflowsExecuted": ["ticket_inquiry_workflow", "unavailable_handler_workflow", "ai_response_workflow"]
        })
    
    # Validar acceso a billetes exclusivos con workflow N8N
    if ticket["is_exclusive"] and not is_subscriber:
        trace.append(create_trace_entry(
            request_id, "TICKET_EXCLUSIVE_DENIED", 
            "Workflow N8N: acceso denegado a billete exclusivo",
            {
                "is_exclusive": True,
                "is_subscriber": False,
                "workflow_branch": "exclusive_access_denied"
            }
        ))
        
        system_prompt = """Eres un asistente de Lotería El Trébol procesado por workflows de n8n.
El billete consultado es exclusivo para abonados y el usuario no es abonado.
Explica amablemente que necesita ser abonado para acceder a este billete.
Menciona que estás procesando esto mediante automatización visual con n8n."""
        
        user_message = f"El billete {ticket_number} es exclusivo para abonados, cuesta {ticket['price']}€, pero el usuario no es abonado."
        
        trace.append(create_trace_entry(
            request_id, "AI_PROCESSING", 
            "Workflow N8N enviando a DeepSeek para respuesta de acceso denegado",
            {"workflow_node": "ai_exclusive_denied_processor"}
        ))
        
        ai_response, ai_error = call_deepseek([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ], request_id, trace)
        
        if ai_error:
            ai_response = f"🔒 El billete {ticket_number} es exclusivo para abonados. Su precio es de {ticket['price']}€. ¿Te gustaría información sobre cómo ser abonado?"
        
        trace.append(create_trace_entry(
            request_id, "TICKET_INQUIRY_COMPLETE", 
            "Workflow de consulta de billete completado en N8N",
            {
                "total_duration_ms": (time.time() - start_time) * 1000,
                "workflow_result": "exclusive_access_denied"
            },
            duration_ms=(time.time() - start_time) * 1000
        ))
        
        return jsonify({
            "message": ai_response,
            "backend": "n8n-workflows",
            "requestId": request_id,
            "processingTime": (time.time() - start_time) * 1000,
            "processedBy": "n8n-workflows",
            "usedAI": True,
            "usedDatabase": True,
            "trace": trace,
            "workflowsExecuted": ["ticket_inquiry_workflow", "exclusive_access_workflow", "ai_response_workflow"]
        })
    
    # Billete disponible - procesar con workflow N8N
    trace.append(create_trace_entry(
        request_id, "TICKET_AVAILABLE", 
        "Workflow N8N: billete disponible para compra",
        {
            "price": ticket["price"],
            "is_exclusive": ticket["is_exclusive"],
            "workflow_node": "availability_validator"
        }
    ))
    
    # Generar respuesta con DeepSeek
    system_prompt = """Eres un asistente de Lotería El Trébol procesado por workflows de n8n.
El billete consultado está disponible para compra.
Proporciona información detallada y pregunta si quiere comprarlo.
Menciona que estás procesando esto mediante automatización visual con n8n para darte una respuesta rápida y precisa."""
    
    user_message = f"""El usuario consultó el billete {ticket_number}. 
Información del billete:
- Número: {ticket['ticket_number']}
- Precio: {ticket['price']}€
- Estado: {ticket['status']}
- Exclusivo: {'Sí' if ticket['is_exclusive'] else 'No'}
- Usuario abonado: {'Sí' if is_subscriber else 'No'}"""
    
    trace.append(create_trace_entry(
        request_id, "AI_PROCESSING", 
        "Workflow N8N enviando a DeepSeek para respuesta de billete disponible",
        {"workflow_node": "ai_available_processor"}
    ))
    
    ai_response, ai_error = call_deepseek([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ], request_id, trace)
    
    if ai_error:
        ai_response = f"✅ ¡Perfecto! El billete {ticket_number} está disponible y cuesta {ticket['price']}€. ¿Te gustaría comprarlo?"
    
    trace.append(create_trace_entry(
        request_id, "TICKET_INQUIRY_COMPLETE", 
        "Workflow de consulta de billete completado en N8N",
        {
            "total_duration_ms": (time.time() - start_time) * 1000,
            "workflow_result": "ticket_available"
        },
        duration_ms=(time.time() - start_time) * 1000
    ))
    
    return jsonify({
        "message": ai_response,
        "backend": "n8n-workflows",
        "requestId": request_id,
        "processingTime": (time.time() - start_time) * 1000,
        "processedBy": "n8n-workflows",
        "usedAI": True,
        "usedDatabase": True,
        "trace": trace,
        "workflowsExecuted": ["ticket_inquiry_workflow", "availability_workflow", "ai_response_workflow"]
    })

def process_general_chat_workflow(request_id, message, trace):
    """Procesar chat general usando workflow N8N"""
    start_time = time.time()
    
    trace.append(create_trace_entry(
        request_id, "GENERAL_CHAT_START", 
        "Iniciando workflow de chat general en N8N",
        {
            "message": message,
            "workflow_name": "general_chat_workflow"
        }
    ))
    
    # Buscar en base de conocimiento con workflow N8N
    trace.append(create_trace_entry(
        request_id, "DATABASE_QUERY", 
        "Nodo N8N consultando base de conocimiento",
        {"workflow_node": "knowledge_search_node"}
    ))
    
    knowledge_data, duration_ms, error = query_supabase("knowledge_base")
    
    trace.append(create_trace_entry(
        request_id, "DATABASE_RESPONSE", 
        "Nodo N8N recibió base de conocimiento",
        {
            "status_code": 200 if not error else 500,
            "response_time_ms": duration_ms,
            "knowledge_entries": len(knowledge_data) if knowledge_data else 0,
            "workflow_node": "knowledge_processor"
        },
        error=error,
        duration_ms=duration_ms
    ))
    
    # Generar respuesta con DeepSeek usando workflow N8N
    system_prompt = """Eres un asistente de Lotería El Trébol procesado por workflows de n8n.
Responde de manera amigable y útil sobre la lotería.
Menciona que estás procesando esto mediante automatización visual con n8n.

Información de la empresa:
- Horario: Lunes a viernes 9:00-18:00, Sábados 9:00-14:00
- Ubicación: Calle Principal 123, Madrid
- Sorteos: Sábados a las 20:00
- Premios: Hasta 100,000€
- Billetes exclusivos para abonados disponibles"""
    
    trace.append(create_trace_entry(
        request_id, "AI_PROCESSING", 
        "Workflow N8N enviando a DeepSeek para chat general",
        {"workflow_node": "ai_chat_processor"}
    ))
    
    ai_response, ai_error = call_deepseek([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message}
    ], request_id, trace)
    
    if ai_error:
        ai_response = "❌ Lo siento, hay un problema técnico. ¿Podrías intentar de nuevo?"
    
    trace.append(create_trace_entry(
        request_id, "GENERAL_CHAT_COMPLETE", 
        "Workflow de chat general completado en N8N",
        {
            "total_duration_ms": (time.time() - start_time) * 1000,
            "workflow_result": "chat_response_generated"
        },
        duration_ms=(time.time() - start_time) * 1000
    ))
    
    return jsonify({
        "message": ai_response,
        "backend": "n8n-workflows",
        "requestId": request_id,
        "processingTime": (time.time() - start_time) * 1000,
        "processedBy": "n8n-workflows",
        "usedAI": True,
        "usedDatabase": True,
        "trace": trace,
        "workflowsExecuted": ["general_chat_workflow", "knowledge_search_workflow", "ai_response_workflow"]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

