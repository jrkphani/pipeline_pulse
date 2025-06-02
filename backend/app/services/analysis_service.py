"""
Analysis service for processing CSV data and generating insights
"""

import pandas as pd
from typing import Dict, Any, List
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from .currency_service import currency_service


class AnalysisService:
    """Service for analyzing pipeline data"""
    
    def process_csv_data(self, df: pd.DataFrame, db: Session = None) -> pd.DataFrame:
        """
        Process raw CSV data and clean it for analysis
        """
        
        # Make a copy to avoid modifying original
        processed_df = df.copy()
        
        # Standardize column names (CSV specification compliant)
        column_mapping = {
            'Deal Name': 'deal_name',
            'Opportunity Name': 'deal_name',
            'Amount': 'amount',
            'OCH Revenue': 'amount',
            'Stage': 'stage',
            'Probability (%)': 'probability',
            'Closing Date': 'closing_date',
            'Account Name': 'account_name',
            'Deal Owner': 'deal_owner',
            'Opportunity Owner': 'deal_owner',
            'Lead Source': 'lead_source',
            'Type': 'deal_type',
            'Description': 'description',
            'Currency': 'currency',
            'Exchange Rate': 'exchange_rate',
            'Country': 'country'
        }
        
        # Rename columns if they exist
        for old_name, new_name in column_mapping.items():
            if old_name in processed_df.columns:
                processed_df = processed_df.rename(columns={old_name: new_name})
        
        # Clean and process amount field
        if 'amount' in processed_df.columns:
            processed_df['amount'] = pd.to_numeric(processed_df['amount'], errors='coerce')
            processed_df = processed_df.dropna(subset=['amount'])
            processed_df = processed_df[processed_df['amount'] > 0]

            # Convert currencies to SGD using dynamic exchange rates
            if db is not None:
                processed_df['original_amount'] = processed_df['amount']
                processed_df['original_currency'] = processed_df.get('currency', 'SGD')
                processed_df['sgd_amount'] = processed_df.apply(
                    lambda row: self._convert_to_sgd(row, db), axis=1
                )
                # Replace amount with SGD converted amount
                processed_df['amount'] = processed_df['sgd_amount']
        
        # Clean probability field
        if 'probability' in processed_df.columns:
            processed_df['probability'] = pd.to_numeric(processed_df['probability'], errors='coerce')
            # Filter for active deals (10-89% probability)
            processed_df = processed_df[
                (processed_df['probability'] >= 10) & 
                (processed_df['probability'] <= 89)
            ]
        
        # Process closing date
        if 'closing_date' in processed_df.columns:
            processed_df['closing_date'] = pd.to_datetime(processed_df['closing_date'], errors='coerce')
        
        # Add derived fields
        processed_df['weighted_amount'] = (
            processed_df.get('amount', 0) * processed_df.get('probability', 0) / 100
        )
        
        return processed_df

    def _convert_to_sgd(self, row: pd.Series, db: Session) -> float:
        """
        Convert a single row's amount to SGD using dynamic exchange rates
        """
        try:
            amount = row.get('amount', 0)
            currency = row.get('currency', 'SGD')

            if not amount or amount == 0:
                return 0.0

            # Use currency service for conversion
            sgd_amount, rate_source = currency_service.convert_to_sgd(amount, currency, db)
            return sgd_amount

        except Exception as e:
            # Fallback to original amount if conversion fails
            return row.get('amount', 0)

    def generate_summary(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary statistics from processed data
        """
        
        if not data:
            return {
                "total_deals": 0,
                "total_value": 0,
                "average_deal_size": 0,
                "weighted_pipeline": 0,
                "average_probability": 0
            }
        
        df = pd.DataFrame(data)
        
        summary = {
            "total_deals": len(df),
            "total_value": df.get('amount', pd.Series([0])).sum(),
            "average_deal_size": df.get('amount', pd.Series([0])).mean(),
            "weighted_pipeline": df.get('weighted_amount', pd.Series([0])).sum(),
            "average_probability": df.get('probability', pd.Series([0])).mean()
        }
        
        # Convert numpy types to Python types for JSON serialization
        for key, value in summary.items():
            if isinstance(value, (np.integer, np.floating)):
                summary[key] = float(value)
        
        return summary
    
    def apply_filters(self, data: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Apply filters to the data
        """
        
        if not data:
            return []
        
        df = pd.DataFrame(data)
        
        # Apply probability range filter
        if 'probability_min' in filters:
            df = df[df.get('probability', 0) >= filters['probability_min']]
        
        if 'probability_max' in filters:
            df = df[df.get('probability', 100) <= filters['probability_max']]
        
        # Apply amount range filter
        if 'amount_min' in filters:
            df = df[df.get('amount', 0) >= filters['amount_min']]
        
        if 'amount_max' in filters:
            df = df[df.get('amount', float('inf')) <= filters['amount_max']]
        
        # Apply date range filter
        if 'date_from' in filters:
            df['closing_date'] = pd.to_datetime(df.get('closing_date'), errors='coerce')
            df = df[df['closing_date'] >= pd.to_datetime(filters['date_from'])]
        
        if 'date_to' in filters:
            df['closing_date'] = pd.to_datetime(df.get('closing_date'), errors='coerce')
            df = df[df['closing_date'] <= pd.to_datetime(filters['date_to'])]
        
        return df.to_dict('records')
    
    def get_country_breakdown(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate country-wise breakdown of deals
        """
        
        if not data:
            return []
        
        df = pd.DataFrame(data)
        
        # Assume country information is in account_name or a separate field
        # This is a simplified version - in real implementation, you'd need
        # proper country extraction logic
        
        if 'account_name' not in df.columns:
            return []
        
        # Group by account (as proxy for country/region)
        country_stats = df.groupby('account_name').agg({
            'amount': ['count', 'sum', 'mean'],
            'probability': 'mean',
            'weighted_amount': 'sum'
        }).round(2)
        
        # Flatten column names
        country_stats.columns = ['deal_count', 'total_value', 'avg_deal_size', 'avg_probability', 'weighted_value']
        
        # Convert to list of dictionaries
        breakdown = []
        for account, stats in country_stats.iterrows():
            breakdown.append({
                'country': account,
                'deal_count': int(stats['deal_count']),
                'total_value': float(stats['total_value']),
                'avg_deal_size': float(stats['avg_deal_size']),
                'avg_probability': float(stats['avg_probability']),
                'weighted_value': float(stats['weighted_value'])
            })
        
        # Sort by total value descending
        breakdown.sort(key=lambda x: x['total_value'], reverse=True)
        
        return breakdown
