from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import json
from datetime import datetime
from typing import Dict, List

# Procurement partner blueprint
procurement_bp = Blueprint('procurement', __name__, url_prefix='/procurement')

# In-memory storage for procurement data (in production, use database)
procurement_orders = []
partner_profiles = {}

@procurement_bp.route('/')
def procurement_home():
    if 'partner_type' not in session or session.get('partner_type') != 'procurement':
        return redirect(url_for('procurement.login'))
    return render_template('procurement_dashboard.html')

@procurement_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        partner_id = request.form['partner_id']
        password = request.form['password']

        # Simple authentication (in real app, check database)
        if partner_id == 'buyer' and password == 'password':
            session['partner_id'] = partner_id
            session['partner_type'] = 'procurement'
            return redirect(url_for('procurement.procurement_home'))

        return render_template('procurement_login.html', error='Invalid credentials')

    return render_template('procurement_login.html')

@procurement_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        partner_data = {
            'company_name': request.form['company_name'],
            'contact_person': request.form['contact_person'],
            'phone': request.form['phone'],
            'business_type': request.form['business_type'],  # processor, exporter, retailer
            'regions': request.form.getlist('regions'),
            'crops_interested': request.form.getlist('crops'),
            'created_at': datetime.now().isoformat()
        }

        partner_id = f"partner_{len(partner_profiles) + 1}"
        partner_profiles[partner_id] = partner_data

        session['partner_id'] = partner_id
        session['partner_type'] = 'procurement'
        return redirect(url_for('procurement.procurement_home'))

    return render_template('procurement_register.html')

@procurement_bp.route('/api/available_supply')
def available_supply():
    """Get available farmer supply for procurement"""
    # In real app, this would aggregate from farmer profiles and current inventory
    supply_data = {
        'turmeric': {
            'total_available': 1250,  # kg
            'farmers_available': 45,
            'avg_price': 185,
            'quality_grades': {
                'premium': {'quantity': 800, 'price': 195},
                'standard': {'quantity': 350, 'price': 175},
                'basic': {'quantity': 100, 'price': 165}
            }
        },
        'rice': {
            'total_available': 2100,
            'farmers_available': 67,
            'avg_price': 26,
            'quality_grades': {
                'premium': {'quantity': 1200, 'price': 28},
                'standard': {'quantity': 700, 'price': 25},
                'basic': {'quantity': 200, 'price': 23}
            }
        }
    }
    return jsonify(supply_data)

@procurement_bp.route('/api/place_order', methods=['POST'])
def place_order():
    if 'partner_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'})

    order_data = request.get_json()
    order = {
        'order_id': f"order_{len(procurement_orders) + 1}",
        'partner_id': session['partner_id'],
        'crop': order_data['crop'],
        'quantity': order_data['quantity'],
        'quality_grade': order_data['quality_grade'],
        'max_price': order_data['max_price'],
        'delivery_location': order_data['delivery_location'],
        'delivery_date': order_data['delivery_date'],
        'status': 'pending',
        'created_at': datetime.now().isoformat()
    }

    procurement_orders.append(order)
    return jsonify({'success': True, 'order_id': order['order_id'], 'message': 'Order placed successfully'})

@procurement_bp.route('/api/my_orders')
def my_orders():
    if 'partner_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'})

    partner_orders = [order for order in procurement_orders if order['partner_id'] == session['partner_id']]
    return jsonify({'orders': partner_orders})

@procurement_bp.route('/api/market_insights')
def market_insights():
    """Provide procurement-focused market insights"""
    insights = {
        'demand_trends': {
            'turmeric': 'High demand from export markets',
            'rice': 'Stable domestic demand',
            'wheat': 'Seasonal demand increase expected'
        },
        'price_predictions': {
            'turmeric': {'next_week': '+2-3%', 'next_month': '+5-7%'},
            'rice': {'next_week': 'stable', 'next_month': '+1-2%'}
        },
        'supply_alerts': [
            'Turmeric supply expected to increase next week',
            'Rice quality premium commanding higher prices',
            'New farmer cooperatives joining platform'
        ],
        'logistics_options': [
            {'provider': 'AgriLogistics Pro', 'cost_per_kg': 2.5, 'delivery_time': '2-3 days'},
            {'provider': 'FarmFresh Express', 'cost_per_kg': 3.0, 'delivery_time': '1-2 days'},
            {'provider': 'Rural Connect', 'cost_per_kg': 1.8, 'delivery_time': '3-5 days'}
        ]
    }
    return jsonify(insights)

@procurement_bp.route('/logout')
def logout():
    session.pop('partner_id', None)
    session.pop('partner_type', None)
    return redirect(url_for('home'))