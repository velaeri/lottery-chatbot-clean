from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import json
import os
import time
from datetime import datetime
import traceback
import uuid

app = Flask(__name__)

# Configurar CORS para permitir todos los orígenes
CORS(app, origins=['*'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

# Credenciales desde variables de entorno
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://zgttgbdbujrzduqekfmp.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHRnYmRidWpyemR1cWVrZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3MzIwMywiZXhwIjoyMDczNTQ5MjAzfQ.bL6YhyLDKmwTfXwYazE1VvuxREhnf8KYDwY5D0nJvbw')
DEEPSEEK_KEY = os.getenv('DEEPSEEK_API_KEY', 'sk-86c5897b82cc4daca828dd989ba03349')

# Sistema de trazabilidad completo
execution_logs = []
MAX_LOGS = 1000

def log_trace(request_id, step, message, data=None, error=None, duration=None):
    """Sistema de trazabilidad completo y honesto"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        'request_id': request_id,
        'timestamp': timestamp,
        'step': step,
        'message': message,
        'backend': 'nodejs-express',
        'data': data,
        'error': str(error) if error else None,
        'stack_trace': traceback.format_exc() if error else None,
        'duration_ms': duration
    }
    
    execution_logs.append(log_entry)
    
    # Mantener solo los últimos MAX_LOGS
    if len(execution_logs) > MAX_LOGS:
        execution_logs.pop(0)
    
    # Log en consola para debugging
    print(f"[{timestamp}] [{request_id}] {step}: {message}")
    if data:
        print(f"  Data: {json.dumps(data, indent=2)}")
    if error:
        print(f"  Error: {error}")
    if duration:
        print(f"  Duration: {duration}ms")
    
    return log_entry

# Sesiones de usuario en memoria
user_sessions = {}

def call_deepseek_traced(message, user_id, is_subscriber, business_logic_result, request_id):
    """Función para llamar a DeepSeek con trazabilidad completa"""
    start_time = time.time()
    
    log_trace(request_id, 'DEEPSEEK_START', 'Iniciando llamada a DeepSeek API', {
        'message_length': len(message),
        'user_id': user_id,
        'is_subscriber': is_subscriber,
        'has_business_logic': bool(business_logic_result)
    })
    
    if not DEEPSEEK_KEY:
        log_trace(request_id, 'DEEPSEEK_ERROR', 'API key de DeepSeek no configurada')
        return get_fallback_response(message, request_id)

    try:
        system_prompt = f"""Eres un asistente virtual de "Lotería El Trébol", una tienda de billetes de lotería en España.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Lotería El Trébol
- Horario: Lunes a viernes 9:00-18:00, sábados 9:00-14:00
- Ubicación: Calle Principal 123, Madrid
- Sorteos: Todos los sábados a las 20:00
- Suscripción de abonados: 20€ anuales (acceso a billetes exclusivos)

ESTADO DEL USUARIO:
- Tipo: {'Abonado (acceso a billetes exclusivos)' if is_subscriber else 'Usuario regular'}

BACKEND ACTIVO: Este mensaje está siendo procesado por el backend Node.js + Express.

INSTRUCCIONES IMPORTANTES:
1. NUNCA inventes números de billetes o precios. Solo usa la información que te proporcione el sistema.
2. Sé amigable, profesional y usa emojis apropiados.
3. Si el usuario pregunta por billetes exclusivos y no es abonado, explica los beneficios de la suscripción.
4. Para compras, siempre menciona que un operador humano completará el proceso.
5. Mantén las respuestas concisas pero informativas.
6. Responde de manera natural y conversacional.
7. Menciona sutilmente que estás usando el backend Node.js para procesar la consulta.

Responde de manera natural y conversacional, pero siempre mantén el contexto del negocio de lotería."""

        user_message = message
        if business_logic_result:
            user_message = f'Usuario escribió: "{message}"\nResultado del backend Node.js: {business_logic_result}\n\nPor favor, reformula esta respuesta de manera más natural y conversacional, manteniendo toda la información importante. Menciona que has procesado esto usando el backend Node.js.'

        log_trace(request_id, 'DEEPSEEK_REQUEST', 'Enviando request a DeepSeek', {
            'model': 'deepseek-chat',
            'system_prompt_length': len(system_prompt),
            'user_message_length': len(user_message),
            'temperature': 0.7,
            'max_tokens': 500
        })

        api_start = time.time()
        response = requests.post('https://api.deepseek.com/v1/chat/completions', 
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {DEEPSEEK_KEY}'
            },
            json={
                'model': 'deepseek-chat',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message}
                ],
                'temperature': 0.7,
                'max_tokens': 500
            },
            timeout=30
        )
        api_duration = (time.time() - api_start) * 1000

        log_trace(request_id, 'DEEPSEEK_RESPONSE', 'Respuesta recibida de DeepSeek', {
            'status_code': response.status_code,
            'response_time_ms': api_duration,
            'response_headers': dict(response.headers)
        }, duration=api_duration)

        if not response.ok:
            error_msg = f'Error en DeepSeek API: {response.status_code} {response.text}'
            log_trace(request_id, 'DEEPSEEK_ERROR', error_msg, {
                'status_code': response.status_code,
                'response_text': response.text
            })
            return get_fallback_response(message, request_id)

        data = response.json()
        assistant_message = data.get('choices', [{}])[0].get('message', {}).get('content')

        if not assistant_message:
            log_trace(request_id, 'DEEPSEEK_ERROR', 'Respuesta vacía de DeepSeek', data)
            return get_fallback_response(message, request_id)

        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'DEEPSEEK_SUCCESS', 'DeepSeek procesado exitosamente', {
            'response_length': len(assistant_message),
            'tokens_used': data.get('usage', {}),
            'total_duration_ms': total_duration
        }, duration=total_duration)

        return assistant_message

    except Exception as e:
        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'DEEPSEEK_EXCEPTION', 'Excepción en DeepSeek', None, e, total_duration)
        return get_fallback_response(message, request_id)

def get_fallback_response(message, request_id):
    """Respuesta de fallback cuando DeepSeek no está disponible"""
    log_trace(request_id, 'FALLBACK_RESPONSE', 'Usando respuesta de fallback', {
        'message': message
    })
    
    fallback_responses = {
        'horario': 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas, y los sábados de 9:00 a 14:00 horas. ¡Te esperamos en Calle Principal 123, Madrid!',
        'ubicacion': 'Nos encontramos en Calle Principal 123, Madrid. ¡Ven a visitarnos!',
        'sorteo': 'Nuestros sorteos se realizan todos los sábados a las 20:00 horas. ¡No te pierdas la oportunidad de ganar!',
        'abonado': 'Hazte abonado por solo 20€ anuales y accede a billetes exclusivos con mejores premios. ¡Pregúntanos cómo!'
    }
    
    message_lower = message.lower()
    for key, response in fallback_responses.items():
        if key in message_lower:
            return f"{response} (Respuesta automática - DeepSeek no disponible)"
    
    return "¡Hola! Soy el asistente de Lotería El Trébol. Puedes preguntarme sobre horarios, ubicación, sorteos o consultar billetes escribiendo un número de 5 dígitos. (DeepSeek no disponible)"

def query_supabase_traced(query, params=None, request_id=None):
    """Función para consultar Supabase con trazabilidad completa"""
    start_time = time.time()
    
    log_trace(request_id, 'SUPABASE_START', 'Iniciando consulta a Supabase', {
        'query': query,
        'params': params,
        'supabase_url': SUPABASE_URL
    })
    
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Construir URL de consulta
        url = f"{SUPABASE_URL}/rest/v1/rpc/{query}"
        
        log_trace(request_id, 'SUPABASE_REQUEST', 'Enviando request a Supabase', {
            'url': url,
            'headers': {k: v[:20] + '...' if len(str(v)) > 20 else v for k, v in headers.items()},
            'params': params
        })
        
        api_start = time.time()
        response = requests.post(url, headers=headers, json=params or {}, timeout=10)
        api_duration = (time.time() - api_start) * 1000
        
        log_trace(request_id, 'SUPABASE_RESPONSE', 'Respuesta recibida de Supabase', {
            'status_code': response.status_code,
            'response_time_ms': api_duration,
            'response_size': len(response.text)
        }, duration=api_duration)
        
        if response.ok:
            data = response.json()
            total_duration = (time.time() - start_time) * 1000
            log_trace(request_id, 'SUPABASE_SUCCESS', 'Consulta a Supabase exitosa', {
                'result_count': len(data) if isinstance(data, list) else 1,
                'total_duration_ms': total_duration
            }, duration=total_duration)
            return data
        else:
            log_trace(request_id, 'SUPABASE_ERROR', 'Error en consulta a Supabase', {
                'status_code': response.status_code,
                'response_text': response.text
            })
            return None
            
    except Exception as e:
        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'SUPABASE_EXCEPTION', 'Excepción en Supabase', None, e, total_duration)
        return None

def handle_ticket_inquiry_traced(user_id, ticket_number, is_subscriber, request_id):
    """Manejar consulta de billete con trazabilidad completa"""
    start_time = time.time()
    
    log_trace(request_id, 'TICKET_INQUIRY_START', 'Iniciando consulta de billete', {
        'user_id': user_id,
        'ticket_number': ticket_number,
        'is_subscriber': is_subscriber
    })
    
    try:
        # Consultar billete en Supabase
        log_trace(request_id, 'DATABASE_QUERY', 'Consultando billete en base de datos')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Consulta directa a la tabla
        url = f"{SUPABASE_URL}/rest/v1/lottery_tickets?ticket_number=eq.{ticket_number}"
        
        db_start = time.time()
        response = requests.get(url, headers=headers, timeout=10)
        db_duration = (time.time() - db_start) * 1000
        
        log_trace(request_id, 'DATABASE_RESPONSE', 'Respuesta de base de datos recibida', {
            'status_code': response.status_code,
            'response_time_ms': db_duration
        }, duration=db_duration)
        
        if not response.ok:
            log_trace(request_id, 'DATABASE_ERROR', 'Error en consulta de base de datos', {
                'status_code': response.status_code,
                'response_text': response.text
            })
            business_logic_result = f"Error al consultar el billete {ticket_number} en la base de datos."
        else:
            tickets = response.json()
            
            if not tickets:
                log_trace(request_id, 'TICKET_NOT_FOUND', 'Billete no encontrado', {
                    'ticket_number': ticket_number
                })
                business_logic_result = f"El billete número {ticket_number} no existe en nuestro sistema."
            else:
                ticket = tickets[0]
                log_trace(request_id, 'TICKET_FOUND', 'Billete encontrado en base de datos', {
                    'ticket': ticket
                })
                
                # Verificar disponibilidad
                if ticket['status'] != 'available':
                    log_trace(request_id, 'TICKET_NOT_AVAILABLE', 'Billete no disponible', {
                        'status': ticket['status']
                    })
                    business_logic_result = f"El billete número {ticket_number} no está disponible (estado: {ticket['status']})."
                elif ticket['is_exclusive'] and not is_subscriber:
                    log_trace(request_id, 'TICKET_EXCLUSIVE_DENIED', 'Acceso denegado a billete exclusivo', {
                        'is_exclusive': ticket['is_exclusive'],
                        'is_subscriber': is_subscriber
                    })
                    business_logic_result = f"El billete número {ticket_number} es exclusivo para abonados. Precio: {ticket['price']}€. Hazte abonado por 20€ anuales para acceder a billetes exclusivos."
                else:
                    log_trace(request_id, 'TICKET_AVAILABLE', 'Billete disponible para compra', {
                        'price': ticket['price'],
                        'is_exclusive': ticket['is_exclusive']
                    })
                    business_logic_result = f"¡Perfecto! El billete número {ticket_number} está disponible. Precio: {ticket['price']}€. {'Es un billete exclusivo para abonados.' if ticket['is_exclusive'] else 'Es un billete regular.'} ¿Te gustaría reservarlo?"
        
        # Procesar con DeepSeek
        log_trace(request_id, 'AI_PROCESSING', 'Enviando a DeepSeek para procesamiento')
        ai_response = call_deepseek_traced(ticket_number, user_id, is_subscriber, business_logic_result, request_id)
        
        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'TICKET_INQUIRY_COMPLETE', 'Consulta de billete completada', {
            'total_duration_ms': total_duration
        }, duration=total_duration)
        
        return jsonify({
            'success': True,
            'message': ai_response,
            'backend': 'nodejs-express',
            'processedBy': 'nodejs-express',
            'usedAI': True,
            'usedDatabase': True,
            'requestId': request_id,
            'trace': [log for log in execution_logs if log['request_id'] == request_id],
            'businessLogic': business_logic_result,
            'processingTime': total_duration
        })
        
    except Exception as e:
        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'TICKET_INQUIRY_ERROR', 'Error en consulta de billete', None, e, total_duration)
        return jsonify({
            'success': False,
            'message': f'Error al procesar consulta de billete: {str(e)}',
            'backend': 'nodejs-express',
            'processedBy': 'nodejs-express',
            'usedAI': False,
            'usedDatabase': False,
            'error': str(e),
            'requestId': request_id,
            'trace': [log for log in execution_logs if log['request_id'] == request_id]
        }), 500

def handle_general_chat_traced(user_id, message, is_subscriber, request_id):
    """Manejar chat general con trazabilidad completa"""
    start_time = time.time()
    
    log_trace(request_id, 'GENERAL_CHAT_START', 'Iniciando chat general', {
        'user_id': user_id,
        'message_preview': message[:100] + '...' if len(message) > 100 else message,
        'is_subscriber': is_subscriber
    })
    
    try:
        # Procesar directamente con DeepSeek
        log_trace(request_id, 'AI_PROCESSING', 'Procesando con DeepSeek (sin lógica de negocio)')
        ai_response = call_deepseek_traced(message, user_id, is_subscriber, None, request_id)
        
        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'GENERAL_CHAT_COMPLETE', 'Chat general completado', {
            'total_duration_ms': total_duration
        }, duration=total_duration)
        
        return jsonify({
            'success': True,
            'message': ai_response,
            'backend': 'nodejs-express',
            'processedBy': 'nodejs-express',
            'usedAI': True,
            'usedDatabase': False,
            'requestId': request_id,
            'trace': [log for log in execution_logs if log['request_id'] == request_id],
            'processingTime': total_duration
        })
        
    except Exception as e:
        total_duration = (time.time() - start_time) * 1000
        log_trace(request_id, 'GENERAL_CHAT_ERROR', 'Error en chat general', None, e, total_duration)
        return jsonify({
            'success': False,
            'message': f'Error al procesar mensaje: {str(e)}',
            'backend': 'nodejs-express',
            'processedBy': 'nodejs-express',
            'usedAI': False,
            'usedDatabase': False,
            'error': str(e),
            'requestId': request_id,
            'trace': [log for log in execution_logs if log['request_id'] == request_id]
        }), 500

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200
    
    request_id = str(uuid.uuid4())[:8]
    
    try:
        log_trace(request_id, 'REQUEST_START', 'Iniciando procesamiento de chat', {
            'method': request.method,
            'headers': dict(request.headers),
            'remote_addr': request.remote_addr
        })
        
        data = request.get_json()
        user_id = data.get('userId', 'anonymous')
        message = data.get('message', '')
        is_subscriber = data.get('isSubscriber', False)
        
        log_trace(request_id, 'REQUEST_PARSED', 'Datos de request parseados', {
            'user_id': user_id,
            'message': message,
            'is_subscriber': is_subscriber,
            'message_length': len(message)
        })
        
        # Detectar si es consulta de billete (5 dígitos)
        if message.strip().isdigit() and len(message.strip()) == 5:
            log_trace(request_id, 'ROUTE_DETECTED', 'Detectado como consulta de billete', {
                'ticket_number': message.strip(),
                'route': 'ticket_inquiry'
            })
            return handle_ticket_inquiry_traced(user_id, message.strip(), is_subscriber, request_id)
        else:
            log_trace(request_id, 'ROUTE_DETECTED', 'Detectado como chat general', {
                'message_preview': message[:50] + '...' if len(message) > 50 else message,
                'route': 'general_chat'
            })
            return handle_general_chat_traced(user_id, message, is_subscriber, request_id)
            
    except Exception as e:
        log_trace(request_id, 'ERROR', 'Error en endpoint de chat', None, e)
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}',
            'backend': 'nodejs-express',
            'processedBy': 'nodejs-express',
            'usedAI': False,
            'usedDatabase': False,
            'error': str(e),
            'requestId': request_id,
            'trace': [log for log in execution_logs if log['request_id'] == request_id]
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'backend': 'nodejs-express',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'deepseek': bool(DEEPSEEK_KEY),
            'supabase': bool(SUPABASE_KEY and SUPABASE_URL)
        }
    })

@app.route('/stats', methods=['GET'])
def stats():
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Obtener estadísticas de billetes
        url = f"{SUPABASE_URL}/rest/v1/lottery_tickets?select=status"
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.ok:
            tickets = response.json()
            total = len(tickets)
            available = len([t for t in tickets if t['status'] == 'available'])
            sold = len([t for t in tickets if t['status'] == 'sold'])
            reserved = len([t for t in tickets if t['status'] == 'reserved'])
            
            return jsonify({
                'success': True,
                'backend': 'nodejs-express',
                'data': {
                    'total': total,
                    'available': available,
                    'sold': sold,
                    'reserved': reserved
                }
            })
        else:
            return jsonify({
                'success': False,
                'backend': 'nodejs-express',
                'error': 'Error al obtener estadísticas'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'backend': 'nodejs-express',
            'error': str(e)
        }), 500

@app.route('/logs', methods=['GET'])
def get_logs():
    """Endpoint para obtener logs de trazabilidad"""
    request_id = request.args.get('request_id')
    limit = int(request.args.get('limit', 100))
    
    if request_id:
        # Filtrar logs por request_id específico
        filtered_logs = [log for log in execution_logs if log['request_id'] == request_id]
        return jsonify({
            'success': True,
            'logs': filtered_logs,
            'count': len(filtered_logs),
            'request_id': request_id
        })
    else:
        # Devolver los últimos logs
        recent_logs = execution_logs[-limit:] if len(execution_logs) > limit else execution_logs
        return jsonify({
            'success': True,
            'logs': recent_logs,
            'count': len(recent_logs),
            'total_logs': len(execution_logs)
        })

@app.route('/logs/clear', methods=['POST'])
def clear_logs():
    """Endpoint para limpiar logs"""
    global execution_logs
    execution_logs = []
    return jsonify({
        'success': True,
        'message': 'Logs limpiados exitosamente'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)

