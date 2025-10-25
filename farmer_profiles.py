import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid

class FarmerProfileManager:
    """
    Manages farmer profiles, income tracking, and farming history
    for impact measurement and cooperative management
    """

    def __init__(self, data_file: str = 'farmer_profiles.json'):
        self.data_file = data_file
        self.profiles = self._load_profiles()

    def _load_profiles(self) -> Dict:
        """Load farmer profiles from file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading profiles: {e}")
                return {}
        return {}

    def _save_profiles(self):
        """Save farmer profiles to file"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.profiles, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving profiles: {e}")

    def create_profile(self, user_id: str, profile_data: Dict) -> Dict:
        """
        Create a new farmer profile
        """
        profile = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'personal_info': {
                'name': profile_data.get('name', ''),
                'phone': profile_data.get('phone', ''),
                'village': profile_data.get('village', ''),
                'district': profile_data.get('district', 'Nizamabad'),
                'state': profile_data.get('state', 'Telangana'),
                'farming_experience_years': profile_data.get('experience', 0),
                'literacy_level': profile_data.get('literacy', 'basic'),  # basic, intermediate, advanced
                'preferred_language': profile_data.get('language', 'te')
            },
            'farm_details': {
                'land_size_acres': profile_data.get('land_size', 0),
                'crops_grown': profile_data.get('crops', ['turmeric']),
                'farming_type': profile_data.get('farming_type', 'traditional'),  # traditional, organic, mixed
                'irrigation_type': profile_data.get('irrigation', 'rainfed')
            },
            'economic_data': {
                'annual_income_before': profile_data.get('income_before', 0),
                'annual_income_current': 0,
                'monthly_income_history': [],
                'total_sales_volume': 0,
                'average_price_per_kg': 0,
                'cooperative_memberships': [],
                'loans_taken': [],
                'government_schemes': []
            },
            'transaction_history': [],
            'cooperative_activity': {
                'joined_cooperatives': [],
                'meetings_attended': [],
                'training_completed': [],
                'votes_cast': []
            },
            'impact_metrics': {
                'market_access_improved': False,
                'income_increased_percent': 0,
                'middleman_eliminated': False,
                'digital_literacy_improved': False,
                'cooperative_benefits_received': []
            }
        }

        self.profiles[user_id] = profile
        self._save_profiles()
        return profile

    def update_profile(self, user_id: str, updates: Dict) -> Optional[Dict]:
        """
        Update farmer profile
        """
        if user_id not in self.profiles:
            return None

        profile = self.profiles[user_id]

        # Update nested dictionaries
        for key, value in updates.items():
            if key in profile and isinstance(profile[key], dict):
                profile[key].update(value)
            else:
                profile[key] = value

        profile['updated_at'] = datetime.now().isoformat()
        self._save_profiles()
        return profile

    def record_transaction(self, user_id: str, transaction_data: Dict):
        """
        Record a farming transaction for impact tracking
        """
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]

        transaction = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'type': transaction_data.get('type', 'sale'),  # sale, purchase, cooperative
            'crop': transaction_data.get('crop', ''),
            'quantity_kg': transaction_data.get('quantity', 0),
            'price_per_kg': transaction_data.get('price_per_kg', 0),
            'total_amount': transaction_data.get('total_amount', 0),
            'buyer_type': transaction_data.get('buyer_type', 'direct'),  # direct, middleman, cooperative
            'market_price_at_time': transaction_data.get('market_price', 0),
            'profit_margin': transaction_data.get('profit_margin', 0)
        }

        profile['transaction_history'].append(transaction)

        # Update economic data
        economic = profile['economic_data']
        economic['total_sales_volume'] += transaction['quantity_kg']

        # Update monthly income history
        current_month = datetime.now().strftime('%Y-%m')
        monthly_income = economic['monthly_income_history']
        month_found = False

        for month_data in monthly_income:
            if month_data['month'] == current_month:
                month_data['income'] += transaction['total_amount']
                month_found = True
                break

        if not month_found:
            monthly_income.append({
                'month': current_month,
                'income': transaction['total_amount']
            })

        # Calculate average price
        total_transactions = len([t for t in profile['transaction_history'] if t['type'] == 'sale'])
        if total_transactions > 0:
            total_value = sum(t['total_amount'] for t in profile['transaction_history'] if t['type'] == 'sale')
            economic['average_price_per_kg'] = total_value / (economic['total_sales_volume'] or 1)

        self._save_profiles()
        return True

    def calculate_impact_metrics(self, user_id: str) -> Dict:
        """
        Calculate impact metrics for the farmer
        """
        if user_id not in self.profiles:
            return {}

        profile = self.profiles[user_id]
        economic = profile['economic_data']
        transactions = profile['transaction_history']

        # Calculate income increase
        income_before = economic['annual_income_before']
        current_income = sum(m['income'] for m in economic['monthly_income_history'][-12:])  # Last 12 months

        income_increase_percent = 0
        if income_before > 0:
            income_increase_percent = ((current_income - income_before) / income_before) * 100

        # Calculate market access improvement
        direct_sales = len([t for t in transactions if t['buyer_type'] == 'direct'])
        cooperative_sales = len([t for t in transactions if t['buyer_type'] == 'cooperative'])
        total_sales = len([t for t in transactions if t['type'] == 'sale'])

        market_access_score = 0
        if total_sales > 0:
            market_access_score = ((direct_sales + cooperative_sales) / total_sales) * 100

        # Calculate middleman elimination
        middleman_sales = len([t for t in transactions if t['buyer_type'] == 'middleman'])
        middleman_eliminated = middleman_sales == 0 and total_sales > 0

        # Update impact metrics
        impact = profile['impact_metrics']
        impact['income_increased_percent'] = round(income_increase_percent, 2)
        impact['market_access_improved'] = market_access_score > 50
        impact['middleman_eliminated'] = middleman_eliminated

        self._save_profiles()

        return {
            'income_increase_percent': income_increase_percent,
            'market_access_score': market_access_score,
            'middleman_eliminated': middleman_eliminated,
            'total_transactions': total_sales,
            'cooperative_memberships': len(profile['cooperative_activity']['joined_cooperatives']),
            'training_completed': len(profile['cooperative_activity']['training_completed'])
        }

    def get_profile(self, user_id: str) -> Optional[Dict]:
        """
        Get farmer profile
        """
        return self.profiles.get(user_id)

    def get_all_profiles(self) -> Dict:
        """
        Get all farmer profiles (admin function)
        """
        return self.profiles

    def join_cooperative(self, user_id: str, cooperative_id: str, cooperative_name: str):
        """
        Record cooperative membership
        """
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        cooperative_activity = profile['cooperative_activity']

        # Check if already joined
        if any(c['id'] == cooperative_id for c in cooperative_activity['joined_cooperatives']):
            return False

        cooperative_activity['joined_cooperatives'].append({
            'id': cooperative_id,
            'name': cooperative_name,
            'joined_at': datetime.now().isoformat()
        })

        self._save_profiles()
        return True

    def record_training(self, user_id: str, training_data: Dict):
        """
        Record completed training
        """
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        training = {
            'id': str(uuid.uuid4()),
            'title': training_data.get('title', ''),
            'type': training_data.get('type', 'general'),  # farming, digital, cooperative
            'completed_at': datetime.now().isoformat(),
            'duration_hours': training_data.get('duration', 0)
        }

        profile['cooperative_activity']['training_completed'].append(training)
        profile['impact_metrics']['digital_literacy_improved'] = True

        self._save_profiles()
        return True

    def get_impact_summary(self) -> Dict:
        """
        Get overall impact summary across all farmers
        """
        total_farmers = len(self.profiles)
        if total_farmers == 0:
            return {
                'total_farmers': 0,
                'average_income_increase_percent': 0.0,
                'farmers_with_improved_market_access': 0,
                'market_access_improvement_rate': 0.0,
                'farmers_without_middlemen': 0,
                'middleman_elimination_rate': 0.0,
                'total_cooperative_memberships': 0,
                'average_cooperative_memberships_per_farmer': 0.0,
                'message': 'No farmer data available yet'
            }

        total_income_increase = 0
        farmers_with_improved_access = 0
        farmers_without_middlemen = 0
        total_cooperative_members = 0

        for profile in self.profiles.values():
            impact = profile.get('impact_metrics', {})
            total_income_increase += impact.get('income_increased_percent', 0)

            if impact.get('market_access_improved', False):
                farmers_with_improved_access += 1

            if impact.get('middleman_eliminated', False):
                farmers_without_middlemen += 1

            total_cooperative_members += len(profile.get('cooperative_activity', {}).get('joined_cooperatives', []))

        return {
            'total_farmers': total_farmers,
            'average_income_increase_percent': round(total_income_increase / total_farmers, 2),
            'farmers_with_improved_market_access': farmers_with_improved_access,
            'market_access_improvement_rate': round((farmers_with_improved_access / total_farmers) * 100, 2),
            'farmers_without_middlemen': farmers_without_middlemen,
            'middleman_elimination_rate': round((farmers_without_middlemen / total_farmers) * 100, 2),
            'total_cooperative_memberships': total_cooperative_members,
            'average_cooperative_memberships_per_farmer': round(total_cooperative_members / total_farmers, 2)
        }