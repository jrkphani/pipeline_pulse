"""
O2R Tracker Test & Demo Script
Demonstrates the complete O2R tracking functionality
"""

import sys
import os
import pandas as pd
from datetime import datetime, date, timedelta
from pathlib import Path

# Add the backend path to sys.path for imports
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from app.api.o2r.import_processor import O2RImportProcessor, O2RDataEnricher
from app.api.o2r.review_engine import WeeklyReviewEngine
from app.api.o2r.export_service import O2RExportService
from app.models.o2r.health import HealthSignalEngine

def create_sample_csv():
    """Create a sample CSV file for testing"""
    
    sample_data = {
        'Record Id': ['12345', '12346', '12347', '12348', '12349'],
        'Opportunity Name': [
            'CloudHub Migration - ABC Corp',
            'Gen AI Implementation - XYZ Ltd', 
            'MSP Services - Government Agency',
            'AWS Modernization - StartupCo',
            'Data Analytics Platform - BigCorp'
        ],
        'Account Name': ['ABC Corp', 'XYZ Ltd', 'Government Agency', 'StartupCo', 'BigCorp'],
        'OCH Revenue': [150000, 280000, 450000, 120000, 350000],
        'Currency': ['SGD', 'SGD', 'SGD', 'SGD', 'SGD'],
        'Exchange Rate': [1.0, 1.0, 1.0, 1.0, 1.0],
        'Probability (%)': [75, 60, 85, 45, 70],
        'Stage': ['Proposal Sent', 'Negotiation', 'Verbal Commitment', 'Proposal Sent', 'Contract Negotiation'],
        'Closing Date': ['2025-07-15', '2025-08-30', '2025-06-20', '2025-09-15', '2025-07-30'],
        'Opportunity Owner': ['John Doe', 'Jane Smith', 'Mike Wilson', 'Sarah Lee', 'David Chen'],
        'Created Time': ['2025-01-15 10:30:00', '2025-02-01 14:20:00', '2024-12-15 09:15:00', '2025-03-01 11:45:00', '2025-02-15 16:30:00'],
        'Country': ['Singapore', 'Malaysia', 'Singapore', 'Indonesia', 'Thailand'],
        'Business Region': ['APAC', 'APAC', 'APAC', 'APAC', 'APAC'],
        'Solution Type': ['Cloud Migration', 'Gen AI', 'MSP', 'Cloud Migration', 'Data Analytics'],
        'Type of Funding': ['AWS CPPO', 'Self-funded', 'Government', 'AWS CPPO', 'Self-funded'],
        'Market Segment': ['Enterprise', 'SMB', 'Government', 'Startup', 'Enterprise'],
        'Proposal Submission date': ['2025-03-01', '2025-03-15', '2024-12-20', '2025-04-01', '2025-03-10'],
        'PO Generation Date': ['', '2025-04-01', '2025-01-10', '', '2025-04-15'],
        'Kick-off Date': ['', '', '2025-01-20', '', ''],
        'Invoice Date': ['', '', '2025-03-15', '', ''],
        'Received On': ['', '', '2025-04-10', '', ''],
        'OB Recognition Date': ['', '', '2025-04-15', '', '']
    }
    
    df = pd.DataFrame(sample_data)
    csv_path = backend_path / 'sample_o2r_data.csv'
    df.to_csv(csv_path, index=False)
    
    print(f"✅ Created sample CSV: {csv_path}")
    return str(csv_path)

def test_csv_import(csv_path: str):
    """Test CSV import functionality"""
    
    print("\n🔄 Testing CSV Import...")
    
    # Initialize processor
    processor = O2RImportProcessor()
    
    # Process CSV
    opportunities = processor.process_csv_import(csv_path, updated_by="test_user")
    
    print(f"✅ Imported {len(opportunities)} opportunities")
    
    # Generate import summary
    summary = processor.generate_import_summary(opportunities)
    print(f"📊 Total Value: SGD {summary['total_value_sgd']:,.0f}")
    print(f"📊 Average Deal Size: SGD {summary['avg_deal_size']:,.0f}")
    print(f"📊 Phase Distribution: {summary['phase_distribution']}")
    print(f"📊 Health Distribution: {summary['health_distribution']}")
    
    # Validate data
    validation = processor.validate_import_data(opportunities)
    print(f"✅ Validation Passed: {validation['validation_passed']}")
    if validation['warnings']:
        print(f"⚠️ Warnings: {len(validation['warnings'])}")
    if validation['errors']:
        print(f"❌ Errors: {len(validation['errors'])}")
    
    return opportunities

def test_health_engine(opportunities):
    """Test health signal engine"""
    
    print("\n🚦 Testing Health Signal Engine...")
    
    health_engine = HealthSignalEngine()
    
    for opp in opportunities:
        health_signal = health_engine.calculate_health_signal(opp)
        print(f"📋 {opp.deal_name}: {health_signal.signal} - {health_signal.reason}")
    
    # Portfolio health summary
    portfolio_health = health_engine.get_health_summary_for_portfolio(opportunities)
    print(f"\n📊 Portfolio Health Summary: {portfolio_health}")
    
    # Opportunities requiring attention
    attention_required = health_engine.get_opportunities_requiring_attention(opportunities)
    print(f"⚠️ Requiring Attention: {len(attention_required)} opportunities")
    
    return opportunities

def test_weekly_review(opportunities):
    """Test weekly review engine"""
    
    print("\n📅 Testing Weekly Review Engine...")
    
    review_engine = WeeklyReviewEngine()
    
    # Generate weekly review
    current_week = date.today()
    review = review_engine.prepare_weekly_review(opportunities, current_week)
    
    print(f"📊 Week of: {review['week_of']}")
    print(f"📊 Total Opportunities: {review['summary']['total_opportunities']}")
    print(f"📊 Updated This Week: {review['summary']['updated_this_week']}")
    print(f"📊 Attention Required: {review['summary']['attention_required']}")
    print(f"📊 Revenue Realized: SGD {review['summary']['revenue_realized_this_week']:,.0f}")
    
    print(f"\n✨ Key Highlights:")
    for highlight in review['insights']['key_highlights']:
        print(f"  • {highlight}")
    
    print(f"\n⚠️ Concerns:")
    for concern in review['insights']['concerns']:
        print(f"  • {concern}")
    
    print(f"\n🎯 Action Items:")
    for action in review['action_items'][:5]:  # Show first 5
        print(f"  • {action['priority']}: {action['description']} ({action['owner']})")
    
    return review

def test_data_enrichment(opportunities):
    """Test data enrichment"""
    
    print("\n🔧 Testing Data Enrichment...")
    
    enricher = O2RDataEnricher()
    
    # Enrich opportunities
    enriched_opportunities = enricher.enrich_opportunities(opportunities)
    
    print("✅ Data enrichment completed")
    
    for opp in enriched_opportunities:
        print(f"📋 {opp.deal_name}:")
        print(f"   Phase: {opp.current_phase}")
        print(f"   Health: {opp.health_signal}")
        print(f"   Updated This Week: {opp.updated_this_week}")
        print(f"   Action Items: {len(opp.action_items)}")
        print()
    
    return enriched_opportunities

def test_exports(opportunities, review_data):
    """Test export functionality"""
    
    print("\n📤 Testing Export Functionality...")
    
    export_service = O2RExportService()
    
    # Test CSV export
    print("📄 Testing CSV export...")
    csv_data = export_service.generate_csv_export(opportunities)
    print(f"✅ Generated CSV: {len(csv_data)} characters")
    
    # Save CSV sample
    csv_export_path = backend_path / 'exported_opportunities.csv'
    with open(csv_export_path, 'w') as f:
        f.write(csv_data)
    print(f"💾 Saved CSV export: {csv_export_path}")
    
    # Test opportunity slide (if ReportLab available)
    try:
        print("📄 Testing PDF slide generation...")
        first_opp = opportunities[0]
        pdf_bytes = export_service.generate_opportunity_slide(first_opp)
        
        pdf_path = backend_path / f'{first_opp.deal_name.replace(" ", "_")}_slide.pdf'
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        print(f"✅ Generated PDF slide: {pdf_path}")
        
    except ImportError as e:
        print(f"⚠️ PDF generation skipped: {e}")
    
    # Test weekly review report
    try:
        print("📄 Testing weekly review report...")
        review_pdf = export_service.generate_weekly_review_report(review_data)
        
        review_path = backend_path / f'weekly_review_{review_data["week_of"]}.pdf'
        with open(review_path, 'wb') as f:
            f.write(review_pdf)
        print(f"✅ Generated weekly review: {review_path}")
        
    except ImportError as e:
        print(f"⚠️ Weekly review PDF skipped: {e}")
    
    # Test PowerPoint deck (if python-pptx available)
    try:
        print("📄 Testing PowerPoint deck generation...")
        apac_opportunities = [opp for opp in opportunities if opp.territory == 'APAC']
        deck_bytes = export_service.generate_territory_deck('APAC', apac_opportunities)
        
        deck_path = backend_path / 'APAC_O2R_Deck.pptx'
        with open(deck_path, 'wb') as f:
            f.write(deck_bytes)
        print(f"✅ Generated PowerPoint deck: {deck_path}")
        
    except ImportError as e:
        print(f"⚠️ PowerPoint generation skipped: {e}")

def run_comprehensive_demo():
    """Run comprehensive O2R tracker demo"""
    
    print("🚀 O2R Tracker - Comprehensive Demo")
    print("=" * 50)
    
    try:
        # Step 1: Create sample data
        csv_path = create_sample_csv()
        
        # Step 2: Test CSV import
        opportunities = test_csv_import(csv_path)
        
        # Step 3: Test health engine
        opportunities = test_health_engine(opportunities)
        
        # Step 4: Test data enrichment
        opportunities = test_data_enrichment(opportunities)
        
        # Step 5: Test weekly review
        review_data = test_weekly_review(opportunities)
        
        # Step 6: Test exports
        test_exports(opportunities, review_data)
        
        print("\n🎉 Demo Completed Successfully!")
        print("=" * 50)
        
        # Summary
        print(f"\n📊 DEMO SUMMARY:")
        print(f"📈 Processed {len(opportunities)} opportunities")
        print(f"💰 Total pipeline value: SGD {sum(opp.sgd_amount for opp in opportunities):,.0f}")
        print(f"🏆 Average deal size: SGD {sum(opp.sgd_amount for opp in opportunities) / len(opportunities):,.0f}")
        
        # Health breakdown
        health_counts = {}
        for opp in opportunities:
            health_counts[opp.health_signal] = health_counts.get(opp.health_signal, 0) + 1
        print(f"🚦 Health signals: {health_counts}")
        
        # Files generated
        print(f"\n📁 Generated Files:")
        print(f"   • Sample CSV: sample_o2r_data.csv")
        print(f"   • Exported CSV: exported_opportunities.csv")
        print(f"   • PDF files: *.pdf (if ReportLab available)")
        print(f"   • PowerPoint: *.pptx (if python-pptx available)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def show_installation_requirements():
    """Show installation requirements for full functionality"""
    
    print("\n📦 Installation Requirements for Full Functionality:")
    print("=" * 50)
    print("pip install pandas")
    print("pip install reportlab  # For PDF generation")
    print("pip install python-pptx  # For PowerPoint generation")
    print("pip install fastapi uvicorn  # For API server")
    print("pip install pydantic  # For data models")
    print("\n💡 Note: The core O2R functionality works without ReportLab and python-pptx")
    print("         These are only needed for PDF/PowerPoint export features")

if __name__ == "__main__":
    print("🎯 1CloudHub O2R (Opportunity-to-Revenue) Tracker")
    print("Built for comprehensive deal lifecycle management")
    print()
    
    # Show requirements
    show_installation_requirements()
    
    # Run demo
    success = run_comprehensive_demo()
    
    if success:
        print("\n🎊 Ready for production deployment!")
        print("Next steps:")
        print("1. Set up database (PostgreSQL recommended)")
        print("2. Configure Zoho CRM integration")
        print("3. Deploy FastAPI backend")
        print("4. Build React frontend")
        print("5. Set up role-based access control")
    else:
        print("\n🔧 Please install missing dependencies and try again")
