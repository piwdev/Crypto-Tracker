from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Coin, Bookmark


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin configuration
    """
    # Fields to display in the user list
    list_display = ('email', 'name', 'is_active', 'is_staff', 'created_at', 'last_login_at')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('email', 'name')
    ordering = ('email',)
    
    # Fields for the user detail/edit form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login_at', 'created_at', 'date_joined')}),
    )
    
    # Fields for the add user form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'date_joined')


@admin.register(Coin)
class CoinAdmin(admin.ModelAdmin):
    """
    Coin admin configuration
    """
    # Fields to display in the coin list
    list_display = ('id', 'name', 'symbol', 'market_cap_rank', 'current_price', 'market_cap', 'last_updated')
    list_filter = ('market_cap_rank', 'last_updated', 'created_at')
    search_fields = ('id', 'name', 'symbol')
    ordering = ('market_cap_rank',)
    
    # Fields for the coin detail/edit form
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'symbol', 'name', 'image')
        }),
        ('Price Information', {
            'fields': ('current_price', 'high_24h', 'low_24h', 'price_change_24h', 'price_change_percentage_24h')
        }),
        ('Market Information', {
            'fields': ('market_cap', 'market_cap_rank', 'market_cap_change_24h', 'market_cap_change_percentage_24h', 'fully_diluted_valuation', 'total_volume')
        }),
        ('Supply Information', {
            'fields': ('circulating_supply', 'total_supply', 'max_supply')
        }),
        ('All-Time High/Low', {
            'fields': ('ath', 'ath_change_percentage', 'ath_date', 'atl', 'atl_change_percentage', 'atl_date')
        }),
        ('Additional Data', {
            'fields': ('roi', 'last_updated')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    # Enable filtering by market cap rank ranges
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    """
    Bookmark admin configuration
    """
    # Fields to display in the bookmark list
    list_display = ('user', 'coin', 'created_at')
    list_filter = ('created_at', 'coin__market_cap_rank')
    search_fields = ('user__email', 'user__name', 'coin__name', 'coin__symbol')
    ordering = ('-created_at',)
    
    # Fields for the bookmark detail/edit form
    fieldsets = (
        ('Bookmark Information', {
            'fields': ('user', 'coin', 'created_at')
        }),
    )
    
    readonly_fields = ('created_at',)
    
    # Optimize queries
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'coin')
