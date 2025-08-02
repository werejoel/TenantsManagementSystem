from django.urls import path
from .views import MaintenanceRequestCreateView, MaintenanceRequestListView, MaintenanceRequestUpdateView, RegisterDeviceView

urlpatterns = [
    path('requests/', MaintenanceRequestListView.as_view(), name='maintenance-request-list'),
    path('requests/create/', MaintenanceRequestCreateView.as_view(), name='maintenance-request-create'),
    path('requests/<int:pk>/', MaintenanceRequestUpdateView.as_view(), name='maintenance-request-update'),
    path('devices/register/', RegisterDeviceView.as_view()),
]
