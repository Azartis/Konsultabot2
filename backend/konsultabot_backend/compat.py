"""
Compatibility fixes for Python 3.14 and Django 4.2.7
This fixes the 'super' object has no attribute 'dicts' error in Django's template context
"""
import sys

# Only apply patch for Python 3.14+
if sys.version_info >= (3, 14):
    _patch_applied = False
    
    def apply_django_patch():
        """Apply the Django compatibility patch - call this after Django is imported"""
        global _patch_applied
        if _patch_applied:
            return
        
        try:
            import django
            
            # Check if we need to patch (Django 4.2.7 with Python 3.14)
            if django.VERSION[:2] == (4, 2):
                # Import Django template context
                import django.template.context
                
                # Check if already patched
                if hasattr(django.template.context.Context.__copy__, '_patched'):
                    _patch_applied = True
                    return
                
                def _patched_context_copy(self):
                    """Patched __copy__ method that works with Python 3.14"""
                    # Create a new Context instance without using super()
                    new_context = django.template.context.Context()
                    # Copy dicts if it exists
                    if hasattr(self, 'dicts'):
                        new_context.dicts = list(self.dicts) if self.dicts else []
                    # Copy other attributes
                    if hasattr(self, 'current'):
                        new_context.current = self.current
                    if hasattr(self, 'autoescape'):
                        new_context.autoescape = self.autoescape
                    if hasattr(self, 'use_l10n'):
                        new_context.use_l10n = self.use_l10n
                    if hasattr(self, 'use_tz'):
                        new_context.use_tz = self.use_tz
                    return new_context
                
                # Mark as patched
                _patched_context_copy._patched = True
                
                # Apply the patch
                django.template.context.Context.__copy__ = _patched_context_copy
                _patch_applied = True
        except (ImportError, AttributeError):
            # Django not installed or version mismatch - skip patch
            pass
    
    # Try to apply patch immediately if Django is already imported
    try:
        import django
        apply_django_patch()
    except ImportError:
        # Django not imported yet - will be applied when settings.py loads
        pass
