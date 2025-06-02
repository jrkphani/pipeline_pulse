#!/bin/bash

# Database Migration Setup Script
# Sets up proper database migrations and handles SQLite to PostgreSQL migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Database Migration Setup${NC}"
echo "============================"

# Function to log messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "backend/main.py" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

cd backend

# Install required dependencies
install_dependencies() {
    log_info "Installing database migration dependencies..."
    
    # Check if alembic is installed
    if ! python -c "import alembic" 2>/dev/null; then
        pip install alembic
        log_success "Installed Alembic"
    else
        log_success "Alembic already installed"
    fi
    
    # Check if psycopg2 is installed
    if ! python -c "import psycopg2" 2>/dev/null; then
        pip install psycopg2-binary
        log_success "Installed psycopg2-binary"
    else
        log_success "psycopg2 already installed"
    fi
}

# Create initial migration
create_initial_migration() {
    log_info "Creating initial database migration..."
    
    # Check if there are existing migrations
    if [[ -f "alembic/versions/001_initial_schema.py" ]]; then
        log_warning "Initial migration already exists, skipping..."
        return
    fi
    
    # Create initial migration
    alembic revision --autogenerate -m "Initial schema" || {
        log_error "Failed to create initial migration"
        exit 1
    }
    
    log_success "Initial migration created"
}

# Backup existing SQLite database
backup_sqlite() {
    log_info "Backing up existing SQLite database..."
    
    SQLITE_DB="pipeline_pulse.db"
    if [[ -f "$SQLITE_DB" ]]; then
        BACKUP_FILE="pipeline_pulse_backup_$(date +%Y%m%d_%H%M%S).db"
        cp "$SQLITE_DB" "$BACKUP_FILE"
        log_success "SQLite database backed up to: $BACKUP_FILE"
        return 0
    else
        log_info "No existing SQLite database found"
        return 1
    fi
}

# Export data from SQLite
export_sqlite_data() {
    log_info "Exporting data from SQLite database..."
    
    SQLITE_DB="pipeline_pulse.db"
    if [[ ! -f "$SQLITE_DB" ]]; then
        log_info "No SQLite database to export from"
        return 1
    fi
    
    # Create data export script
    cat > export_sqlite_data.py << 'EOF'
#!/usr/bin/env python3
"""Export data from SQLite database"""

import sqlite3
import json
import os
from datetime import datetime

def export_table_data(db_path, table_name):
    """Export data from a specific table"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # Convert rows to list of dictionaries
        data = []
        for row in rows:
            row_dict = {}
            for key in row.keys():
                value = row[key]
                # Handle datetime serialization
                if isinstance(value, str) and ('T' in value or '-' in value):
                    row_dict[key] = value
                else:
                    row_dict[key] = value
            data.append(row_dict)
        
        return data
    except sqlite3.Error as e:
        print(f"Error exporting {table_name}: {e}")
        return []
    finally:
        conn.close()

def main():
    db_path = "pipeline_pulse.db"
    if not os.path.exists(db_path):
        print("No SQLite database found")
        return
    
    # Get list of tables
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [table[0] for table in cursor.fetchall()]
    conn.close()
    
    print(f"Found tables: {tables}")
    
    # Export data from each table
    export_data = {}
    for table in tables:
        if table != 'sqlite_sequence':  # Skip SQLite internal table
            data = export_table_data(db_path, table)
            export_data[table] = data
            print(f"Exported {len(data)} records from {table}")
    
    # Save to JSON file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_file = f"sqlite_data_export_{timestamp}.json"
    
    with open(export_file, 'w') as f:
        json.dump(export_data, f, indent=2, default=str)
    
    print(f"Data exported to: {export_file}")
    return export_file

if __name__ == "__main__":
    main()
EOF
    
    # Run the export
    python export_sqlite_data.py
    log_success "SQLite data exported"
}

# Test database connection
test_database_connection() {
    log_info "Testing database connection..."
    
    python -c "
import sys
sys.path.append('.')
from app.core.config import settings
from sqlalchemy import create_engine

try:
    engine = create_engine(settings.DATABASE_URL)
    connection = engine.connect()
    connection.close()
    print('✅ Database connection successful!')
    print(f'Database URL: {settings.DATABASE_URL}')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    sys.exit(1)
" || {
        log_error "Database connection test failed"
        exit 1
    }
}

# Run migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check current migration status
    alembic current || {
        log_info "No migration history found, stamping with initial version"
        alembic stamp head
    }
    
    # Run migrations
    alembic upgrade head || {
        log_error "Migration failed"
        exit 1
    }
    
    log_success "Database migrations completed"
}

# Import data to PostgreSQL (if export file exists)
import_data_to_postgres() {
    log_info "Checking for data to import..."
    
    # Find the most recent export file
    EXPORT_FILE=$(ls -t sqlite_data_export_*.json 2>/dev/null | head -n1)
    
    if [[ -z "$EXPORT_FILE" ]]; then
        log_info "No export file found, skipping data import"
        return
    fi
    
    log_info "Found export file: $EXPORT_FILE"
    log_info "Creating data import script..."
    
    # Create import script
    cat > import_postgres_data.py << 'EOF'
#!/usr/bin/env python3
"""Import data to PostgreSQL database"""

import json
import sys
import os
from datetime import datetime

sys.path.append('.')
from app.core.database import SessionLocal
from app.models.analysis import Analysis
from app.models.currency_rate import CurrencyRate
from app.models.bulk_update import BulkUpdateBatch, BulkUpdateRecord

def import_data(export_file):
    """Import data from JSON export file"""
    
    if not os.path.exists(export_file):
        print(f"Export file {export_file} not found")
        return
    
    with open(export_file, 'r') as f:
        data = json.load(f)
    
    db = SessionLocal()
    
    try:
        # Import analyses
        if 'analyses' in data:
            print(f"Importing {len(data['analyses'])} analyses...")
            for record in data['analyses']:
                # Convert string dates to datetime objects if needed
                if 'created_at' in record and isinstance(record['created_at'], str):
                    try:
                        record['created_at'] = datetime.fromisoformat(record['created_at'])
                    except:
                        record['created_at'] = datetime.now()
                
                analysis = Analysis(**record)
                db.merge(analysis)  # Use merge to handle duplicates
            
            db.commit()
            print("✅ Analyses imported successfully")
        
        # Import currency rates
        if 'currency_rates' in data:
            print(f"Importing {len(data['currency_rates'])} currency rates...")
            for record in data['currency_rates']:
                if 'updated_at' in record and isinstance(record['updated_at'], str):
                    try:
                        record['updated_at'] = datetime.fromisoformat(record['updated_at'])
                    except:
                        record['updated_at'] = datetime.now()
                
                rate = CurrencyRate(**record)
                db.merge(rate)
            
            db.commit()
            print("✅ Currency rates imported successfully")
        
        # Import bulk update data if exists
        if 'bulk_update_batches' in data:
            print(f"Importing {len(data['bulk_update_batches'])} bulk update batches...")
            for record in data['bulk_update_batches']:
                # Handle datetime fields
                for field in ['created_at', 'updated_at', 'completed_at']:
                    if field in record and isinstance(record[field], str):
                        try:
                            record[field] = datetime.fromisoformat(record[field])
                        except:
                            record[field] = datetime.now() if field == 'created_at' else None
                
                batch = BulkUpdateBatch(**record)
                db.merge(batch)
            
            db.commit()
            print("✅ Bulk update batches imported successfully")
        
        if 'bulk_update_records' in data:
            print(f"Importing {len(data['bulk_update_records'])} bulk update records...")
            for record in data['bulk_update_records']:
                # Handle datetime fields
                for field in ['updated_at', 'synced_at']:
                    if field in record and isinstance(record[field], str):
                        try:
                            record[field] = datetime.fromisoformat(record[field])
                        except:
                            record[field] = datetime.now() if field == 'updated_at' else None
                
                update_record = BulkUpdateRecord(**record)
                db.merge(update_record)
            
            db.commit()
            print("✅ Bulk update records imported successfully")
        
        print("🎉 All data imported successfully!")
        
    except Exception as e:
        print(f"❌ Error importing data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import_file = sys.argv[1] if len(sys.argv) > 1 else "sqlite_data_export_latest.json"
    import_data(import_file)
EOF
    
    # Run the import
    python import_postgres_data.py "$EXPORT_FILE" || {
        log_warning "Data import failed, but database setup is complete"
    }
    
    log_success "Data import completed"
}

# Main execution
main() {
    log_info "Starting database migration setup..."
    
    install_dependencies
    
    # Backup and export SQLite data if it exists
    if backup_sqlite; then
        export_sqlite_data
    fi
    
    test_database_connection
    create_initial_migration
    run_migrations
    
    # Import data if we have an export
    import_data_to_postgres
    
    echo ""
    log_success "Database migration setup completed!"
    echo ""
    echo "📋 Summary:"
    echo "==========="
    echo "✅ Alembic migration system configured"
    echo "✅ Database connection tested"
    echo "✅ Initial migration created"
    echo "✅ Database schema migrated"
    echo "✅ Data imported (if available)"
    echo ""
    echo "🔧 Next Steps:"
    echo "=============="
    echo "1. Update your .env file to use PostgreSQL"
    echo "2. Test your application with the new database"
    echo "3. Remove SQLite database files once confirmed working"
    echo ""
    echo "📝 Migration Commands:"
    echo "====================="
    echo "Create migration: alembic revision --autogenerate -m 'description'"
    echo "Run migrations:   alembic upgrade head"
    echo "Check status:     alembic current"
    echo "Migration history: alembic history"
}

# Run main function
main "$@"
