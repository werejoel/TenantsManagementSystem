from django.urls import path
from .views import HouseListCreateView, HouseRetrieveUpdateView, HouseRetrieveDestroyView, HouseOccupancyView

urlpatterns = [
    path('', HouseListCreateView.as_view(), name='house-list'),
    path('<int:pk>/', HouseRetrieveUpdateView.as_view(), name='house-detail'),  # GET, PATCH, PUT
    path('<int:pk>/delete/', HouseRetrieveDestroyView.as_view(), name='house-delete'),  # DELETE
    path('<int:pk>/occupancy/', HouseOccupancyView.as_view(), name='house-occupancy'),  # PATCH
]