"""
Custom permissions for Admin Panel
"""
from rest_framework import permissions


class IsAdminOrStaff(permissions.BasePermission):
    """Allow access only to admin or staff users"""
    
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.role == 'admin')


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'


class IsAdminOrITStaff(permissions.BasePermission):
    """Allow access to admin or IT staff"""
    
    def has_permission(self, request, view):
        return request.user and (request.user.role == 'admin' or request.user.role == 'it_staff')

