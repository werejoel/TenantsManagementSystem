from rest_framework.permissions import BasePermission, IsAuthenticated
from django.shortcuts import render
from rest_framework import generics
from .models import House
from .serializers import HouseSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


# Custom permission: Only admin/manager can delete
class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = getattr(request.user, 'profile', None)
            if profile and profile.role in ['manager', 'admin']:
                return True
        except Exception:
            pass
        return False

class HouseListCreateView(generics.ListCreateAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logging.error(f"House update error: {serializer.errors}")
            print(f"House update error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data)

# Update house/unit info
class HouseRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer

# Delete house/unit
class HouseRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

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

