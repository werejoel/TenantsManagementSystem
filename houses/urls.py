from django.urls import path
from .views import HouseListCreateView

urlpatterns = [
    path('', HouseListCreateView.as_view(), name='house-list'),
]