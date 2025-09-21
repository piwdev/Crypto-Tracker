# Generated for AWS RDS deployment - Coin model decimal field updates
# This migration updates all decimal fields in the Coin model to support higher precision

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_alter_user_username'),
    ]

    operations = [
        # Update User model to remove unique constraint from username
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(blank=True, max_length=254, null=True, unique=False),
        ),
        
        # Update all Coin decimal fields to support higher precision
        migrations.AlterField(
            model_name='coin',
            name='current_price',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='high_24h',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='low_24h',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='price_change_24h',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='price_change_percentage_24h',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='market_cap_change_percentage_24h',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='circulating_supply',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='total_supply',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='max_supply',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='ath',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='ath_change_percentage',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='atl',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
        migrations.AlterField(
            model_name='coin',
            name='atl_change_percentage',
            field=models.DecimalField(blank=True, decimal_places=50, max_digits=1000, null=True),
        ),
    ]