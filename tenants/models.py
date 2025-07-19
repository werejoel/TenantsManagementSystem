# tenants/models.py
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from houses.models import House
import os


class Tenant(models.Model):
    """Model representing a tenant"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('evicted', 'Evicted'),
        ('moved_out', 'Moved Out'),
    ]

    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='tenant_profile',
        help_text="Django user associated with this tenant",
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255, help_text="Full name of the tenant")
    phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )],
        help_text="Contact phone number"
    )
    email = models.EmailField(help_text="Email address for communication")
    national_id = models.CharField(
        max_length=20,
        help_text="National identification number"
    )
    
    # Relationship to house
    house = models.ForeignKey(
        House,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenants',
        help_text="Currently rented house"
    )
    
    # Status and dates
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='active',
        help_text="Current status of the tenant"
    )
    lease_start_date = models.DateField(null=True, blank=True, help_text="Start date of the lease")
    lease_end_date = models.DateField(null=True, blank=True, help_text="End date of the lease")
    
    # Emergency contact
    emergency_contact_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Emergency contact person"
    )
    emergency_contact_phone = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text="Emergency contact phone number"
    )
    # Additional information
    occupation = models.CharField(max_length=100, null=True, blank=True, help_text="Tenant's occupation")
    employer = models.CharField(max_length=255, null=True, blank=True, help_text="Tenant's employer")
    monthly_income = models.PositiveIntegerField(null=True, blank=True, help_text="Monthly income in UGX")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"

    def __str__(self):
        return f"{self.name} - {self.house.name if self.house else 'No House'}"

    def clean(self):
        """Validate tenant data"""
        if self.lease_start_date and self.lease_end_date:
            if self.lease_start_date >= self.lease_end_date:
                raise ValidationError("Lease start date must be before lease end date.")

    def total_overpayment(self):
        """Calculate total overpayment for the tenant"""
        last_payment = self.payments.order_by('-payment_date').first()
        return last_payment.overpayment if last_payment else 0

    def current_balance(self):
        """Calculate current balance due"""
        last_payment = self.payments.order_by('-payment_date').first()
        return last_payment.balance_due if last_payment else 0

    def is_lease_expired(self):
        """Check if the lease has expired"""
        if self.lease_end_date:
            return timezone.now().date() > self.lease_end_date
        return False

    def days_until_lease_expiry(self):
        """Calculate days until lease expiry"""
        if self.lease_end_date:
            delta = self.lease_end_date - timezone.now().date()
            return delta.days
        return None


class Payment(models.Model):
    """Model representing a rent payment"""
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('cheque', 'Cheque'),
        ('card', 'Card'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text="Tenant who made the payment"
    )
    amount_paid = models.PositiveIntegerField(help_text="Amount paid in UGX")
    rent_amount_due = models.PositiveIntegerField(help_text="Rent amount due for the period")
    balance_due = models.PositiveIntegerField(
        default=0,
        editable=False,
        help_text="Remaining balance after payment"
    )
    overpayment = models.PositiveIntegerField(
        default=0,
        editable=False,
        help_text="Amount overpaid (credit)"
    )
    
    # Dates
    payment_date = models.DateField(auto_now_add=True, help_text="Date payment was made")
    payment_start_date = models.DateField(help_text="Start date of rent period")
    payment_end_date = models.DateField(help_text="End date of rent period")
    rent_due_date = models.DateField(help_text="Date rent was due")
    
    # Payment details
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default='cash',
        help_text="Method of payment"
    )
    reference_number = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Payment reference number"
    )
    notes = models.TextField(null=True, blank=True, help_text="Additional notes about the payment")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Payment by {self.tenant.name} - UGX{self.amount_paid:,}"

    def clean(self):
        """Validate payment data"""
        if self.payment_start_date >= self.payment_end_date:
            raise ValidationError("Payment start date must be before payment end date.")
        
        if self.rent_due_date < self.payment_start_date:
            raise ValidationError("Rent due date cannot be before payment start date.")

    def save(self, *args, **kwargs):
        """Override save to calculate balance and overpayment"""
        house_price = self.rent_amount_due
        
        # Get previous overpayment
        previous_payments = self.tenant.payments.exclude(pk=self.pk).order_by('-payment_date')
        last_overpayment = previous_payments.first().overpayment if previous_payments.exists() else 0
        
        # Calculate effective payment including previous overpayment
        effective_payment = self.amount_paid + last_overpayment
        
        if effective_payment >= house_price:
            self.balance_due = 0
            self.overpayment = effective_payment - house_price
        else:
            self.balance_due = house_price - effective_payment
            self.overpayment = 0
        
        # Update house occupancy status
        if self.tenant and self.tenant.house:
            self.tenant.house.is_occupied = True
            self.tenant.house.save()
        
        super().save(*args, **kwargs)
        
        # Send payment confirmation email
        self.send_payment_confirmation()

    def send_payment_confirmation(self):
        """Send payment confirmation email to tenant"""
        subject = 'Payment Confirmation - Rent Payment Received'
        message = f"""
        Dear {self.tenant.name},

        Thank you for your rent payment. Here are the details:

        Payment Amount: UGX {self.amount_paid:,}
        Payment Date: {self.payment_date}
        Period: {self.payment_start_date} to {self.payment_end_date}
        Payment Method: {self.get_payment_method_display()}
        Reference: {self.reference_number or 'N/A'}
        
        Balance Due: UGX {self.balance_due:,}
        Overpayment: UGX {self.overpayment:,}
        
        Thank you for your prompt payment.

        Best regards,
        Property Management Team
        """
        
        try:
            send_mail(
                subject,
                message,
                'noreply@propertymanagement.com',  # Will be replaced with actual email
                [self.tenant.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't fail the save operation
            print(f"Error sending email: {e}")

    def is_late_payment(self):
        """Check if this payment was made after the due date"""
        return self.payment_date > self.rent_due_date

    def days_late(self):
        """Calculate how many days late the payment was"""
        if self.is_late_payment():
            return (self.payment_date - self.rent_due_date).days
        return 0


class Charge(models.Model):
    """Model representing additional charges to tenants"""
    CHARGE_TYPES = [
        ('water', 'Water Bill'),
        ('electricity', 'Electricity Bill'),
        ('maintenance', 'Maintenance Fee'),
        ('late_fee', 'Late Payment Fee'),
        ('cleaning', 'Cleaning Fee'),
        ('parking', 'Parking Fee'),
        ('security', 'Security Fee'),
        ('other', 'Other'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='charges',
        help_text="Tenant responsible for the charge"
    )
    house = models.ForeignKey(
        House,
        on_delete=models.CASCADE,
        related_name='charges',
        help_text="House related to the charge"
    )
    charge_type = models.CharField(
        max_length=50,
        choices=CHARGE_TYPES,
        help_text="Type of charge"
    )
    amount = models.PositiveIntegerField(help_text="Charge amount in UGX")
    description = models.TextField(null=True, blank=True, help_text="Description of the charge")
    
    # Dates
    charge_date = models.DateField(help_text="Date the charge was incurred")
    due_date = models.DateField(null=True, blank=True, help_text="Date the charge is due")
    
    # Status
    is_paid = models.BooleanField(default=False, help_text="Whether the charge has been paid")
    paid_date = models.DateField(null=True, blank=True, help_text="Date the charge was paid")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-charge_date']
        verbose_name = "Charge"
        verbose_name_plural = "Charges"

    def __str__(self):
        return f"{self.get_charge_type_display()} - {self.tenant.name} - UGX{self.amount:,}"

    def clean(self):
        """Validate charge data"""
        if self.due_date and self.due_date < self.charge_date:
            raise ValidationError("Due date cannot be before charge date.")

    def mark_as_paid(self):
        """Mark the charge as paid"""
        self.is_paid = True
        self.paid_date = timezone.now().date()
        self.save()

    def is_overdue(self):
        """Check if the charge is overdue"""
        if self.due_date and not self.is_paid:
            return timezone.now().date() > self.due_date
        return False


class MaintenanceRequest(models.Model):
    """Model representing maintenance requests from tenants"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='maintenance_requests',
        help_text="Tenant who made the request"
    )
    house = models.ForeignKey(
        House,
        on_delete=models.CASCADE,
        related_name='maintenance_requests',
        help_text="House requiring maintenance"
    )
    
    # Request details
    title = models.CharField(max_length=255, help_text="Brief title of the maintenance request")
    description = models.TextField(help_text="Detailed description of the issue")
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the request"
    )
    
    # Status and dates
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current status of the request"
    )
    request_date = models.DateTimeField(auto_now_add=True, help_text="Date the request was made")
    scheduled_date = models.DateTimeField(null=True, blank=True, help_text="Scheduled date for maintenance")
    completion_date = models.DateTimeField(null=True, blank=True, help_text="Date the maintenance was completed")
    
    # Additional information
    estimated_cost = models.PositiveIntegerField(null=True, blank=True, help_text="Estimated cost of maintenance")
    actual_cost = models.PositiveIntegerField(null=True, blank=True, help_text="Actual cost of maintenance")
    contractor = models.CharField(max_length=255, null=True, blank=True, help_text="Contractor assigned to the job")
    notes = models.TextField(null=True, blank=True, help_text="Additional notes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-request_date']
        verbose_name = "Maintenance Request"
        verbose_name_plural = "Maintenance Requests"

    def __str__(self):
        return f"{self.title} - {self.tenant.name} ({self.house.name})"

    def mark_as_completed(self):
        """Mark the maintenance request as completed"""
        self.status = 'completed'
        self.completion_date = timezone.now()
        self.save()

    def is_overdue(self):
        """Check if the maintenance request is overdue"""
        if self.scheduled_date and self.status in ['pending', 'in_progress']:
            return timezone.now() > self.scheduled_date
        return False

    def days_since_request(self):
        """Calculate days since the request was made"""
        return (timezone.now() - self.request_date).days


class Document(models.Model):
    """Model representing documents associated with tenants or houses"""
    DOCUMENT_TYPES = [
        ('lease_agreement', 'Lease Agreement'),
        ('id_copy', 'ID Copy'),
        ('passport_photo', 'Passport Photo'),
        ('employment_letter', 'Employment Letter'),
        ('bank_statement', 'Bank Statement'),
        ('reference_letter', 'Reference Letter'),
        ('inventory_list', 'Inventory List'),
        ('inspection_report', 'Inspection Report'),
        ('other', 'Other'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents',
        help_text="Tenant associated with the document"
    )
    house = models.ForeignKey(
        House,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents',
        help_text="House associated with the document"
    )
    
    # Document details
    document_type = models.CharField(
        max_length=100,
        choices=DOCUMENT_TYPES,
        help_text="Type of document"
    )
    title = models.CharField(max_length=255, help_text="Document title")
    file_path = models.FileField(
        upload_to='documents/',
        help_text="Path to the uploaded document file"
    )
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")
    
    # Dates
    upload_date = models.DateTimeField(auto_now_add=True, help_text="Date the document was uploaded")
    expiry_date = models.DateField(null=True, blank=True, help_text="Document expiry date (if applicable)")
    
    # Additional information
    description = models.TextField(null=True, blank=True, help_text="Additional description")
    is_verified = models.BooleanField(default=False, help_text="Whether the document has been verified")
    verified_by = models.CharField(max_length=255, null=True, blank=True, help_text="Who verified the document")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-upload_date']
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return f"{self.title} - {self.get_document_type_display()}"

    def clean(self):
        """Validate document data"""
        if not self.tenant and not self.house:
            raise ValidationError('Document must be linked to at least a tenant or a house.')

    def is_expired(self):
        """Check if the document has expired"""
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False

    def days_until_expiry(self):
        """Calculate days until document expiry"""
        if self.expiry_date:
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None


# Signal handlers
@receiver(post_delete, sender=Document)
def delete_document_file(sender, instance, **kwargs):
    """Delete the physical file when a Document instance is deleted"""
    if instance.file_path:
        if os.path.isfile(instance.file_path.path):
            os.remove(instance.file_path.path)

@receiver(post_save, sender=Tenant)
def update_house_occupancy(sender, instance, **kwargs):
    """Update house occupancy status when tenant status changes"""
    if instance.house:
        # Check if there are any active tenants for this house
        active_tenants = Tenant.objects.filter(house=instance.house, status='active').count()
        instance.house.is_occupied = active_tenants > 0
        instance.house.save()