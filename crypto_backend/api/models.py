from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """
    Custom user manager that uses email as the unique identifier
    """

    def create_user(self, email, name, password=None, **extra_fields):
        """
        Create and return a regular user with an email and password.
        """
        if not email:
            raise ValueError("The Email field must be set")
        if not name:
            raise ValueError("The Name field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """
        Create and return a superuser with an email and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, name, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model that uses email as the unique identifier
    instead of username for authentication.
    """

    # Override username field to make it non-unique and optional
    username = models.CharField(max_length=254, unique=False, null=True, blank=True)

    # Email field as the unique identifier
    email = models.EmailField(max_length=254, unique=True)

    # Name field (maps to first_name for compatibility)
    name = models.CharField(max_length=20)

    # Password field is inherited from AbstractUser

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    # Set email as the username field for authentication
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]  # Fields required when creating superuser

    # Use our custom manager
    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Set username to email if not provided (for compatibility)
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


class BankBalance(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="bank_balance"
    )
    cash_balance = models.DecimalField(
        max_digits=1000, decimal_places=50, default=500000.0, blank=True
    )
    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bank_balance"


class Coin(models.Model):
    """
    Model representing cryptocurrency data with all market information
    """

    # Primary key - unique identifier for the coin (e.g., 'bitcoin')
    id = models.CharField(max_length=50, primary_key=True)

    # Basic coin information
    symbol = models.CharField(max_length=20)  # Trading symbol (e.g., 'btc')
    name = models.CharField(max_length=100)  # Full name of the coin
    image = models.TextField(blank=True, null=True)  # URL to coin image/logo

    # Price information
    current_price = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    high_24h = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    low_24h = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    price_change_24h = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    price_change_percentage_24h = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )

    # Market cap information
    market_cap = models.BigIntegerField(null=True, blank=True)
    market_cap_rank = models.IntegerField(null=True, blank=True)
    market_cap_change_24h = models.BigIntegerField(null=True, blank=True)
    market_cap_change_percentage_24h = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )

    # Valuation and volume
    fully_diluted_valuation = models.BigIntegerField(null=True, blank=True)
    total_volume = models.BigIntegerField(null=True, blank=True)

    # Supply information
    circulating_supply = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    total_supply = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    max_supply = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )

    # All-time high information
    ath = models.DecimalField(max_digits=1000, decimal_places=50, null=True, blank=True)
    ath_change_percentage = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    ath_date = models.DateTimeField(null=True, blank=True)

    # All-time low information
    atl = models.DecimalField(max_digits=1000, decimal_places=50, null=True, blank=True)
    atl_change_percentage = models.DecimalField(
        max_digits=1000, decimal_places=50, null=True, blank=True
    )
    atl_date = models.DateTimeField(null=True, blank=True)

    # ROI data (can be null or complex object)
    roi = models.JSONField(null=True, blank=True)

    # Timestamps
    last_updated = models.DateTimeField()  # Required field for data freshness
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "coins"
        ordering = ["market_cap_rank"]  # Default ordering by market cap rank

    def __str__(self):
        return f"{self.name} ({self.symbol.upper()})"


class Wallet(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wallets")
    coin = models.ForeignKey(Coin, on_delete=models.CASCADE, related_name="wallets")
    quantity = models.DecimalField(max_digits=20, decimal_places=8)
    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wallet"
        unique_together = ("user", "coin")


class TradeHistory(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="trade_histories"
    )
    coin = models.ForeignKey(
        Coin, on_delete=models.CASCADE, related_name="trade_histories"
    )
    TRADE_TYPE_CHOICES = [
        ("BUY", "Buy"),
        ("SELL", "Sell"),
    ]
    trade_type = models.CharField(max_length=4, choices=TRADE_TYPE_CHOICES)
    trade_quantity = models.DecimalField(max_digits=20, decimal_places=8)
    trade_price_per_coin = models.DecimalField(max_digits=1000, decimal_places=50)
    balance_before_trade = models.DecimalField(max_digits=1000, decimal_places=50)
    balance_after_trade = models.DecimalField(max_digits=1000, decimal_places=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trade_history"
        ordering = ["-created_at"]


class Bookmark(models.Model):
    """
    Model representing user bookmarks for cryptocurrencies.
    Manages the many-to-many relationship between users and coins.
    """

    # Auto-incrementing primary key
    id = models.AutoField(primary_key=True)

    # Foreign key relationships
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="bookmarks_user"
    )
    coin = models.ForeignKey(
        Coin, on_delete=models.CASCADE, related_name="bookmarks_coin"
    )

    # Timestamp for when the bookmark was created
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bookmarks"
        # Ensure a user can only bookmark a coin once
        unique_together = ("user", "coin")
        ordering = ["-created_at"]  # Most recent bookmarks first

    def __str__(self):
        return f"{self.user.email} bookmarked {self.coin.name}"
