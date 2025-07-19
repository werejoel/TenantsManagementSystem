from django.shortcuts import render, redirect
from django.db.models import Sum, Q
from .models import Payment, Tenant, House
from datetime import datetime
from django.utils.dateparse import parse_date
from django.http import HttpResponse
from django.template.loader import get_template
from weasyprint import HTML
import tempfile
import os
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .serializers import TenantSerializer, PaymentSerializer, HouseSerializer
from rest_framework.views import APIView

class DashboardAPIView(APIView):
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        role = getattr(user.profile, 'role', 'tenant') if hasattr(user, 'profile') else 'tenant'
        if role == 'manager':
            tenants = Tenant.objects.all()
            payments = Payment.objects.all().order_by('-payment_date')
            total_payments = Payment.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
            total_balance = Payment.objects.aggregate(total=Sum('balance_due'))['total'] or 0
            total_overpayment = Payment.objects.aggregate(total=Sum('overpayment'))['total'] or 0
            total_tenants = Tenant.objects.count()
            data = {
                'dashboard': 'Manager/Owner Dashboard',
                'role': role,
                'total_payments': total_payments,
                'total_balance': total_balance,
                'total_overpayment': total_overpayment,
                'total_tenants': total_tenants,
            }
        else:
            payments = Payment.objects.filter(tenant__user=user).order_by('-payment_date')
            total_payments = payments.aggregate(total=Sum('amount_paid'))['total'] or 0
            total_balance = payments.aggregate(total=Sum('balance_due'))['total'] or 0
            total_overpayment = payments.aggregate(total=Sum('overpayment'))['total'] or 0
            data = {
                'dashboard': 'Tenant Dashboard',
                'role': role,
                'total_payments': total_payments,
                'total_balance': total_balance,
                'total_overpayment': total_overpayment,
            }
        return Response(data, status=status.HTTP_200_OK)

def dashboard_redirect(request):
    return redirect('/dashboard/')

def payment_report(request):
    """ Generate a report of payments within a selected date range """
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    payments = Payment.objects.all()

    if start_date and end_date:
        payments = payments.filter(date_paid__range=[start_date, end_date])

    context = {
        'payments': payments,
        'start_date': start_date,
        'end_date': end_date
    }
    return render(request, 'reports/payment_report.html', context)

def tenant_balance_report(request):
    """ Generate a report of outstanding balances for each tenant """
    tenants = Tenant.objects.all().annotate(total_balance=Sum('payments__balance_due'))

    context = {
        'tenants': tenants
    }
    return render(request, 'reports/tenant_balance_report.html', context)

def payment_report_pdf(request):
    payments = Payment.objects.all()
    template = get_template('payment_report_pdf.html')
    context = {'payments': payments}
    html_content = template.render(context)

    # Generate PDF directly in memory
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="payment_report.pdf"'
    HTML(string=html_content).write_pdf(response)

    return response

def tenant_balance_pdf(request):
    tenants = Tenant.objects.all()
     # Ensure each tenant has an up-to-date balance
    tenant_data = []
    for tenant in tenants:
        total_paid = Payment.objects.filter(tenant=tenant).aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        balance_due = tenant.house.price - total_paid if tenant.house else 0

        tenant_data.append({
            'name': tenant.name,
            'house': tenant.house if tenant.house else "No House",
            'total_paid': total_paid,
            'balance_due': balance_due
        })
    template = get_template('tenant_balance_pdf.html')
    context = {'tenants': tenants}
    html_content = template.render(context)

    # Generate PDF directly in memory
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="tenant_balance_report.pdf"'
    HTML(string=html_content).write_pdf(response)

    return response

class TenantListCreateView(generics.ListCreateAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

class PaymentListCreateView(generics.ListCreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class HouseListCreateView(generics.ListCreateAPIView):  # Add this class
    queryset = House.objects.all()
    serializer_class = HouseSerializer

# Create your views here.
