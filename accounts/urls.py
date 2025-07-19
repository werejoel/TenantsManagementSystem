
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('', views.accountsView, name='accountsView'),
    path('login', views.loginView, name='loginView'),
    path('users', views.usersView, name='usersView'),
    path('users/<int:id>', views.userDetailView, name='usersDetailView'),
    path('password-reset', views.passwordResetView, name='passwordResetView'),
    path('password-reset/<str:link>', views.passwordResetDoneView, name='passwordResetDoneView'),
    path('password-change', views.passwordChangeView, name='passwordChangeView'),
]
