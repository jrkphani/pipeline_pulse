"""
Export service for generating reports in various formats from live CRM data
"""

import pandas as pd
from io import BytesIO
import json
from typing import Dict, Any, List
import xlsxwriter
from datetime import datetime


class ExportService:
    """Service for exporting live pipeline data in various formats"""
    
    def create_excel_report_from_data(self, deals: List[Dict[str, Any]]) -> bytes:
        """
        Create an Excel report with multiple sheets from raw deal data
        """
        
        # Convert to DataFrame
        df = pd.DataFrame(deals)
        
        # Create Excel file in memory
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Main data sheet
            df.to_excel(writer, sheet_name='Deal Data', index=False)
            
            # Summary sheet
            summary_data = {
                'Metric': [
                    'Total Deals',
                    'Total Value (SGD)',
                    'Average Deal Size (SGD)',
                    'Weighted Pipeline',
                    'Average Probability'
                ],
                'Value': [
                    len(df),
                    df.get('sgd_amount', pd.Series([0])).sum(),
                    df.get('sgd_amount', pd.Series([0])).mean(),
                    df.get('weighted_amount', pd.Series([0])).sum(),
                    df.get('probability', pd.Series([0])).mean()
                ]
            }
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Territory breakdown sheet if available
            if 'territory' in df.columns:
                territory_summary = df.groupby('territory').agg({
                    'sgd_amount': ['count', 'sum', 'mean'],
                    'probability': 'mean'
                }).round(2)
                territory_summary.to_excel(writer, sheet_name='Territory Breakdown')
            
            # Get workbook and add formatting
            workbook = writer.book
            
            # Add formats
            header_format = workbook.add_format({
                'bold': True,
                'text_wrap': True,
                'valign': 'top',
                'fg_color': '#D7E4BC',
                'border': 1
            })
            
            currency_format = workbook.add_format({'num_format': '$#,##0.00'})
            
            # Format headers
            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
                if sheet_name in ['Deal Data', 'Summary']:
                    cols = summary_df.columns.values if sheet_name == 'Summary' else df.columns.values
                    for col_num, value in enumerate(cols):
                        worksheet.write(0, col_num, value, header_format)
                        
                    # Apply currency formatting to amount columns
                    if sheet_name == 'Deal Data':
                        for col_num, col_name in enumerate(df.columns):
                            if 'amount' in col_name.lower() or 'value' in col_name.lower():
                                worksheet.set_column(col_num, col_num, None, currency_format)
        
        output.seek(0)
        return output.getvalue()
    
    def create_pdf_report_from_data(self, deals: List[Dict[str, Any]]) -> bytes:
        """
        Create a PDF report from raw deal data (placeholder implementation)
        """
        
        # Calculate summary statistics
        df = pd.DataFrame(deals)
        total_deals = len(deals)
        total_value = df.get('sgd_amount', pd.Series([0])).sum()
        avg_deal_size = df.get('sgd_amount', pd.Series([0])).mean()
        
        # For now, return a simple text-based "PDF"
        report_content = f"""
        Pipeline Pulse Live Analysis Report
        ==================================
        
        Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        Data Source: Live CRM Integration
        
        Executive Summary:
        - Total Deals: {total_deals:,}
        - Total Value (SGD): ${total_value:,.2f}
        - Average Deal Size (SGD): ${avg_deal_size:,.2f}
        
        Territory Breakdown:
        """
        
        # Add territory breakdown if available
        if 'territory' in df.columns and not df.empty:
            territory_stats = df.groupby('territory')['sgd_amount'].agg(['count', 'sum']).round(2)
            for territory, stats in territory_stats.iterrows():
                report_content += f"\n        - {territory}: {stats['count']} deals, ${stats['sum']:,.2f}"
        
        report_content += """
        
        Note: This is a placeholder PDF report.
        In production, this would be a properly formatted PDF document
        with charts, graphs, and detailed analytics.
        """
        
        return report_content.encode('utf-8')
    
    def create_csv_from_data(self, deals: List[Dict[str, Any]]) -> str:
        """
        Create CSV content from raw deal data
        """
        if not deals:
            return "No data available"
        
        df = pd.DataFrame(deals)
        return df.to_csv(index=False)
    
    def create_summary_report(self, deals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Create a summary report with key metrics
        """
        if not deals:
            return {"message": "No data available"}
        
        df = pd.DataFrame(deals)
        
        summary = {
            "overview": {
                "total_deals": len(deals),
                "total_value_sgd": df.get('sgd_amount', pd.Series([0])).sum(),
                "average_deal_size": df.get('sgd_amount', pd.Series([0])).mean(),
                "median_deal_size": df.get('sgd_amount', pd.Series([0])).median()
            },
            "generated_at": datetime.now().isoformat(),
            "data_source": "live_crm"
        }
        
        # Add territory breakdown if available
        if 'territory' in df.columns:
            territory_stats = df.groupby('territory').agg({
                'sgd_amount': ['count', 'sum', 'mean']
            }).round(2)
            
            summary["territory_breakdown"] = {}
            for territory, stats in territory_stats.iterrows():
                summary["territory_breakdown"][territory] = {
                    "deal_count": int(stats[('sgd_amount', 'count')]),
                    "total_value": float(stats[('sgd_amount', 'sum')]),
                    "average_value": float(stats[('sgd_amount', 'mean')])
                }
        
        # Add stage breakdown if available
        if 'stage' in df.columns:
            stage_stats = df.groupby('stage').agg({
                'sgd_amount': ['count', 'sum']
            }).round(2)
            
            summary["stage_breakdown"] = {}
            for stage, stats in stage_stats.iterrows():
                summary["stage_breakdown"][stage] = {
                    "deal_count": int(stats[('sgd_amount', 'count')]),
                    "total_value": float(stats[('sgd_amount', 'sum')])
                }
        
        return summary