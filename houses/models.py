from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone


class Landlord(models.Model):
    """Model representing a landlord who owns properties"""
    name = models.CharField(max_length=255, help_text="Full name of the landlord")
    phone = models.CharField(
        max_length=13,
        validators=[RegexValidator(
            regex=r'^\+256\d{9}$'
,
            message="Phone number must be entered in the format: '+256705672545'. Up to 13 digits allowed."
        )],
        help_text="Contact phone number"
    )
    email = models.EmailField(unique=True, help_text="Email address for communication")
    address = models.TextField(null=True, blank=True, help_text="Physical address of the landlord")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, help_text="Whether the landlord is active")

    class Meta:
        ordering = ['name']
        verbose_name = "Landlord"
        verbose_name_plural = "Landlords"

    def __str__(self):
        return self.name

    def total_properties(self):
        """Return the total number of properties owned by this landlord"""
        return self.houses.count()

    def occupied_properties(self):
        """Return the number of occupied properties"""
        return self.houses.filter(is_occupied=True).count()

    def vacant_properties(self):
        """Return the number of vacant properties"""
        return self.houses.filter(is_occupied=False).count()


class House(models.Model):
    """Model representing a rental property"""
    HOUSE_TYPES = [
        ('apartment', 'Apartment'),
        ('bungalow', 'Bungalow'),
        ('mansion', 'Mansion'),
        ('studio', 'Studio'),
        ('duplex', 'Duplex'),
        ('townhouse', 'Townhouse'),
        ('single_room', 'Single Room'),
        ('double_room', 'Double Room'),
    ]

    name = models.CharField(
        max_length=255,
        default='Unnamed Property',  # Added default value
        help_text="Name/identifier of the property"
    )
    price = models.PositiveIntegerField(help_text="Monthly rental price in UGX")
    location = models.CharField(max_length=255, help_text="Physical location/address")
    is_occupied = models.BooleanField(default=False, help_text="Whether the property is currently occupied")
    model = models.CharField(
        max_length=30,
        choices=HOUSE_TYPES,
        default='apartment',
        help_text="Type of property (kept as 'model' for backward compatibility)"
    )
    
    # Utility information
    electricity_meter_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Electricity meter number"
    )
    water_meter_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Water meter number"
    )
    
    # Property details
    bedrooms = models.PositiveIntegerField(default=1, help_text="Number of bedrooms")
    bathrooms = models.PositiveIntegerField(default=1, help_text="Number of bathrooms")
    square_footage = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Square footage of the property"
    )
    
    # Relationships
    landlord = models.ForeignKey(
        Landlord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='houses',
        help_text="Owner of the property"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields
    description = models.TextField(null=True, blank=True, help_text="Additional property description")
    amenities = models.TextField(null=True, blank=True, help_text="List of amenities (comma-separated)")
    is_active = models.BooleanField(default=True, help_text="Whether the property is active for rent")

    class Meta:
        ordering = ['name']
        verbose_name = "House"
        verbose_name_plural = "Houses"

    def __str__(self):
        return f"{self.name} - {self.location}"

    def current_tenant(self):
        """Return the current tenant of this house"""
        return self.tenants.filter(status='active').first()

    def is_available(self):
        """Check if the house is available for rent"""
        return not self.is_occupied and self.is_active

    def monthly_revenue(self):
        """Calculate monthly revenue from this property"""
        if self.is_occupied:
            return self.price
        return 0