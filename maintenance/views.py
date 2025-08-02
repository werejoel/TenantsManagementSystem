from rest_framework import generics, permissions
from .models import MaintenanceRequest
from .serializers import MaintenanceRequestSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Device
import requests

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'manager'

class IsTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'tenant'

class MaintenanceRequestCreateView(generics.CreateAPIView):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated, IsTenant]

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)

class MaintenanceRequestListView(generics.ListAPIView):
    queryset = MaintenanceRequest.objects.all().order_by('-created_at')
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated, IsManager]

class MaintenanceRequestUpdateView(generics.RetrieveUpdateAPIView):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # After update, check if status changed
        new_status = serializer.instance.status
        if 'status' in request.data and old_status != new_status:
            send_push_notification(
                instance.tenant,
                "Maintenance Request Update",
                f"Your request status is now: {new_status}"
            )
        return Response(serializer.data)

class RegisterDeviceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=400)
        Device.objects.update_or_create(user=request.user, defaults={'expo_push_token': token})
        return Response({'status': 'registered'})

def send_push_notification(user, title, message):
    try:
        device = Device.objects.get(user=user)
        expo_push_token = device.expo_push_token
        payload = {
            "to": expo_push_token,
            "title": title,
            "body": message,
            "sound": "default",
            "data": {},
        }
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=10,
        )
        response.raise_for_status()
    except Device.DoesNotExist:
        pass
    except Exception as e:
        # Optionally log the error
        print(f"Expo push error: {e}")

# In your status update logic:
# if status_changed:
#     send_push_notification(
#         request_obj.tenant.user,
#         "Maintenance Request Update",
#         f"Your request status is now: {request_obj.status}"
#     )
