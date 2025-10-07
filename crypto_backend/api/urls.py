from django.urls import path
from .views import authentication_views, crypto_views, bookmark_views


urlpatterns = [
    # Authentication endpoints
    path("auth/register/", authentication_views.register, name="register"),
    path("auth/login/", authentication_views.login_view, name="login"),
    path("auth/logout/", authentication_views.logout_view, name="logout"),

    # Cryptocurrency endpoints
    path("coins/top10", crypto_views.coin_top10_list, name="coin_top10_list"),
    path("coins/detail/<str:coin_id>/", crypto_views.coin_detail, name="coin_detail"),
    path("coins/list", crypto_views.coin_list, name="coin_list"),

    # Bookmark endpoints
    path("bookmarks/", bookmark_views.bookmark_create, name="bookmark_create"),
    path(
        "bookmarks/<str:coin_id>/",
        bookmark_views.bookmark_delete,
        name="bookmark_delete",
    ),
    path("user/bookmarks/", bookmark_views.user_bookmarks, name="user_bookmarks"),
]
