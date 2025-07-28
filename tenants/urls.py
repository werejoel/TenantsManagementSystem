from django.urls import path
from .views import DashboardAPIView, dashboard_redirect, payment_report, tenant_balance_report
from .views import payment_report_pdf, tenant_balance_pdf
from .views import TenantListCreateView, PaymentListCreateView, HouseListCreateView, \
    TenantRetrieveUpdateDeactivateView, AssignTenantToHouseView, TenantAssignedHouseView, TenantActivateView, ChargeListCreateView

urlpatterns = [
    path('', dashboard_redirect, name='dashboard_redirect'),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
    path('reports/payments/', payment_report, name='payment_report'),
    path('reports/tenant-balances/', tenant_balance_report, name='tenant_balance_report'),
    path('payment_report_pdf/', payment_report_pdf, name='payment_report_pdf'),
    path('tenant_balance_pdf/', tenant_balance_pdf, name='tenant_balance_pdf'),
    path('list/', TenantListCreateView.as_view(), name='tenant-list'),
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('houses/', HouseListCreateView.as_view(), name='house-list'),
    path('charges/', ChargeListCreateView.as_view(), name='charge-list'),
    # Tenant management endpoints
    path('tenant/<int:pk>/', TenantRetrieveUpdateDeactivateView.as_view(), name='tenant-detail'),  # GET, PATCH, DELETE (deactivate)
    path('tenant/<int:pk>/activate/', TenantActivateView.as_view(), name='tenant-activate'),  # PATCH
    path('tenant/<int:pk>/assign-house/', AssignTenantToHouseView.as_view(), name='tenant-assign-house'),  # PATCH
    path('my-house/', TenantAssignedHouseView.as_view(), name='tenant-my-house'),  # GET
    ]
