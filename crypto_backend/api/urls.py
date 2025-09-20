from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # Cryptocurrency endpoints
    path('coins/', views.coin_list, name='coin_list'),
    path('coins/<str:coin_id>/', views.coin_detail, name='coin_detail'),
    
    # Bookmark endpoints
    path('bookmarks/', views.bookmark_create, name='bookmark_create'),
    path('bookmarks/<str:coin_id>/', views.bookmark_delete, name='bookmark_delete'),
    path('user/bookmarks/', views.user_bookmarks, name='user_bookmarks'),
]