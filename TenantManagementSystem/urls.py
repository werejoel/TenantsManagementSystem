"""
URL configuration for TenantManagementSystem project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from tenants.views import DashboardAPIView, TenantListCreateView, TenantActivateView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.urls import include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', DashboardAPIView.as_view(), name='dashboard'), 
    path('api/', include('tenants.urls')), 
    path('api/tenants/', include('tenants.urls')),
    path('api/houses/', include('houses.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('tenants/', TenantListCreateView.as_view(), name='tenant-list'),
    path('tenants/<int:pk>/activate/', TenantActivateView.as_view(), name='tenant-activate')
]


