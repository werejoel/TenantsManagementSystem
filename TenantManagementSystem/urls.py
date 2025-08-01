from django.contrib import admin
from django.urls import path, include
from tenants.views import DashboardAPIView, TenantListCreateView, TenantActivateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


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


