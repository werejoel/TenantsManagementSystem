from django.db.models import Count
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from django.shortcuts import render
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework import status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.serializers import AuthTokenSerializer
from .serializers import *
from . models import *
import random
import uuid
from django.core.mail import EmailMessage

# Dashboard API for admin/manager
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_view(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    if profile.role not in ['manager', 'admin']:
        return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

    total_tenants = Profile.objects.filter(role='tenant').count()
    total_houses = 0
    try:
        from houses.models import House
        total_houses = House.objects.count()
    except Exception:
        pass

    return Response({
        'dashboard': 'Admin/Manager Dashboard',
        'role': profile.role,
        'total_tenants': total_tenants,
        'total_houses': total_houses,
    }, status=status.HTTP_200_OK)


# Registration API View
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def accountsView(request):
    response = {
        "message":"Register URLs"
    }
    return Response(response, status=status.HTTP_200_OK)

@api_view(['POST'])
def loginView(request):
    data = request.data
    serialiser = AuthTokenSerializer(data = data)
    if serialiser.is_valid():
        user = serialiser.validated_data['user']
        token, created = Token.objects.get_or_create(user = user)
        # Get user role from Profile
        try:
            profile = Profile.objects.get(user=user)
            role = profile.role
        except Profile.DoesNotExist:
            role = 'tenant'
        msg = {
            'data': {
                'user id': user.id,
                'name': user.get_full_name(),
                'role': role
            },
            'token': token.key
        }
        return Response(msg, status=status.HTTP_200_OK)
    return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@authentication_classes([TokenAuthentication])
def logoutView(request):
    user = request.user
    try:
        token = Token.objects.get(user = user)
        token.delete()
        msg = {'msg':'logout successfull'}
        return Response(msg, status=status.HTTP_200_OK)
    except Token.DoesNotExist as e:
        return Response({'msg':f'Error {e}'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
def usersView(request):
    if request.method == 'GET':
        all_users = User.objects.all()
        serialiser = UserSerialiser(all_users, many = True)
        return Response(serialiser.data, status=status.HTTP_200_OK)
    else:
        data = request.data
        serialiser = UserSerialiser(data=data)
        if serialiser.is_valid():
            serialiser.save()
            return Response(serialiser.data, status=status.HTTP_201_CREATED)
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def userDetailView(request, **kwargs):
    try:
        user = User.objects.get(pk = kwargs['id'])
    except User.DoesNotExist as e:
        return Response({'msg':f'Error {e}'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serialiser = UserSerialiser(user)
        return Response(serialiser.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        data = request.data
        serialiser = UserSerialiser(user, data=data, partial = True)
        if serialiser.is_valid():
            serialiser.save()
            return Response(serialiser.data, status=status.HTTP_202_ACCEPTED)
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    else:
        name = user.get_full_name()
        msg = {'msg':f'{name} deleted successfully'}
        user.delete()
        return Response(msg, status=status.HTTP_404_NOT_FOUND)
    

@api_view(['POST'])
def passwordResetView(request):
    data = request.data
    code = random.randint(1000, 9999)
    link = uuid.uuid4()

    try:
        user = User.objects.get(username = data['username'])
    except User.DoesNotExist as e:
        return Response({'msg':f'Error {e}'}, status=status.HTTP_404_NOT_FOUND)

    resetInfo = PasswordReset.objects.get_or_create(user=user)
    resetInfo[0].code = code
    resetInfo[0].link = link
    resetInfo[0].save()

    mailMsg = f"Your receiving this mail because you \
        you recently requested for a password reset \
        click the link http://127.0.0.1:3000/password-reset/{link} \
        and the use code {code}"
    
    email = EmailMessage(
        "Password Reset",
        mailMsg,
        "joelwere992@gmail.com",
        ["joelwere992@gmail.com"],
        ["joelwere992@gmail.com"],
        reply_to=["crossroadsalphabytes@gmail.com"],
        headers={"Message-ID": code},
    )
    email.send(fail_silently=False)

    msg = f'Please check your Email for Instructions'
    return Response({'msg':msg}, status=status.HTTP_200_OK)
#{"username":"engjoel"}

@api_view(['POST'])
def passwordResetDoneView(request, **kwargs):
    link = kwargs['link']
    data = request.data

    if link and data['code'] and data['password']:
        try:
            resetInfo = PasswordReset.objects.get(
                link = link,
                code = data['code']
            )
            user = User.objects.get(username = resetInfo.user.username)
            user.set_password(data['password'])
            user.save()
            msg = f'{user.get_full_name()} password reset success'
            return Response({'msg':msg}, status=status.HTTP_200_OK)
        except PasswordReset.DoesNotExist as e:
            return Response({'msg':f'Error {e}'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@authentication_classes([TokenAuthentication])
def passwordChangeView(request):
    user = User.objects.get(username = request.user)
    data = request.data
    if user.check_password(data['old_password']):
        user.set_password(data['new_password'])
        user.save()
        return Response(
            {'msg':'password change successfull'},
            status=status.HTTP_200_OK)
    else:
        return Response(
            {'msg':'Your old Password is Incorrect'},
            status=status.HTTP_200_OK)
