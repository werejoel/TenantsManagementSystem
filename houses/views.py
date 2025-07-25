from django.shortcuts import render
from rest_framework import generics
from .models import House
from .serializers import HouseSerializer


class HouseListCreateView(generics.ListCreateAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer

# Update house/unit info
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

class HouseRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer

# Delete house/unit
class HouseRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer

# Mark unit as vacant or occupied
class HouseOccupancyView(APIView):
    def patch(self, request, pk):
        try:
            house = House.objects.get(pk=pk)
            status_val = request.data.get('is_occupied')
            if status_val is None:
                return Response({'error': 'is_occupied field required'}, status=status.HTTP_400_BAD_REQUEST)
            house.is_occupied = bool(status_val)
            house.save()
            return Response({'is_occupied': house.is_occupied}, status=status.HTTP_200_OK)
        except House.DoesNotExist:
            return Response({'error': 'House not found'}, status=status.HTTP_404_NOT_FOUND)

