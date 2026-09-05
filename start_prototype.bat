@echo off
echo Starting FreightAI Prototype Server...
start http://localhost:8000/standalone_dashboard.html
python -m http.server 8000
