from django.urls import path
from .views import DashboardAPIView, dashboard_redirect, payment_report, tenant_balance_report
from .views import payment_report_pdf, tenant_balance_pdf
from .views import TenantListCreateView, PaymentListCreateView, HouseListCreateView

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
    ]
