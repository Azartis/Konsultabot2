from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET"])
def health_redirect(request):
    """Redirect /health/ to the REST API health check endpoint"""
    return redirect('/api/v1/chat/health/', permanent=True)