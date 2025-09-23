#!/bin/bash
# localでpostgresqlDBを構築する時参考

echo "🐘 Setting up PostgreSQL for local development..."

# Check if local PostgreSQL is running and stop it
if brew services list | grep -q "postgresql.*started"; then
    echo "Stopping local PostgreSQL service to avoid port conflicts..."
    brew services stop postgresql@14 2>/dev/null || brew services stop postgresql 2>/dev/null || true
fi

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is running
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL is running!"
    
    # Run Django migrations
    echo "Running Django migrations..."
    cd crypto_backend
    python manage.py makemigrations
    python manage.py migrate
    
    echo "🎉 Setup complete! Your PostgreSQL database is ready."
    echo ""
    
    # Ask if user wants to create a superuser
    read -p "Do you want to create a Django superuser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Creating Django superuser..."
        python manage.py createsuperuser
    fi
    
    echo ""
    echo "Database connection details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: crypto_db"
    echo "  Username: postgres"
    echo "  Password: password"
    echo ""
    echo "Useful commands:"
    echo "  Stop PostgreSQL: docker-compose down"
    echo "  View logs: docker-compose logs postgres"
    echo "  Django admin: http://localhost:8000/admin/"
    echo "  Create superuser: python manage.py createsuperuser"
else
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi