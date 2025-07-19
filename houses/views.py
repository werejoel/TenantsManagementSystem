from django.shortcuts import render
from rest_framework import generics
from .models import House
from .serializers import HouseSerializer

class HouseListCreateView(generics.ListCreateAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer


# Create your views here.
