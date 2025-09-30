"""
Tests básicos del sistema de chatbot de lotería
"""
import requests
import json
import time

NODEJS_BACKEND_URL = "https://y0h0i3c86qv6.manus.space"
N8N_BACKEND_URL = "https://77h9ikc6nzl1.manus.space"

def test_nodejs_health():
    """Test salud del backend Node.js"""
    response = requests.get(f"{NODEJS_BACKEND_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "backend" in data
    print("✅ Node.js Backend: Healthy")

def test_n8n_health():
    """Test salud del backend N8N"""
    response = requests.get(f"{N8N_BACKEND_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["backend"] == "n8n-workflows"
    print("✅ N8N Backend: Healthy")

def test_nodejs_chat():
    """Test funcionalidad de chat Node.js"""
    payload = {
        "userId": "test_nodejs_user",
        "message": "10000",
        "isSubscriber": False
    }
    
    response = requests.post(
        f"{NODEJS_BACKEND_URL}/chat",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "message" in data
    assert "trace" in data
    assert "usedAI" in data
    assert "usedDatabase" in data
    
    traces = data["trace"]
    assert len(traces) >= 5
    
    print(f"✅ Node.js Chat: {len(traces)} traces generated")

def test_n8n_chat():
    """Test funcionalidad de chat N8N"""
    payload = {
        "userId": "test_n8n_user",
        "message": "¿Cuál es el horario?",
        "isSubscriber": False
    }
    
    response = requests.post(
        f"{N8N_BACKEND_URL}/chat",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "response" in data
    assert "traces" in data
    assert "usedAI" in data
    assert "usedDatabase" in data
    assert "workflowsExecuted" in data
    
    traces = data["traces"]
    assert len(traces) >= 5
    
    workflows = data["workflowsExecuted"]
    assert len(workflows) > 0
    
    print(f"✅ N8N Chat: {len(traces)} traces, {len(workflows)} workflows")

def test_performance():
    """Test básico de rendimiento"""
    payload = {
        "userId": "performance_test",
        "message": "10090",
        "isSubscriber": False
    }
    
    # Test Node.js
    start_time = time.time()
    response = requests.post(f"{NODEJS_BACKEND_URL}/chat", json=payload, timeout=30)
    nodejs_time = time.time() - start_time
    
    assert response.status_code == 200
    assert nodejs_time < 30
    
    # Test N8N
    start_time = time.time()
    response = requests.post(f"{N8N_BACKEND_URL}/chat", json=payload, timeout=30)
    n8n_time = time.time() - start_time
    
    assert response.status_code == 200
    assert n8n_time < 35
    
    print(f"✅ Performance: Node.js {nodejs_time:.2f}s, N8N {n8n_time:.2f}s")

if __name__ == "__main__":
    print("🧪 Running system tests...")
    
    test_nodejs_health()
    test_n8n_health()
    test_nodejs_chat()
    test_n8n_chat()
    test_performance()
    
    print("🎉 All tests passed!")
