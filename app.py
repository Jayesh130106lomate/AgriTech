from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_babel import Babel, gettext as _
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
import logging
from datetime import datetime
from blockchain import Blockchain
import uuid
from market_data import MarketDataService
from farmer_profiles import FarmerProfileManager
from procurement import procurement_bp
from user_manager import UserManager
from werkzeug.security import generate_password_hash
import re
import os
from dotenv import load_dotenv
import google.generativeai as genai

app = Flask(__name__)
app.secret_key = 'your-very-secure-secret-key-change-in-production-123456789'  # Change this in production
babel = Babel(app)
csrf = CSRFProtect(app)
CORS(app)  # Enable CORS for all routes

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro-latest')

# Configure Babel for multilingual support
app.config['BABEL_DEFAULT_LOCALE'] = 'en'
app.config['BABEL_SUPPORTED_LOCALES'] = ['en', 'te', 'hi']  # English, Telugu, Hindi

def get_locale():
    return request.accept_languages.best_match(app.config['BABEL_SUPPORTED_LOCALES'])

babel.localeselector = get_locale

# Instantiate services
blockchain = Blockchain()
market_service = MarketDataService()
profile_manager = FarmerProfileManager()
user_manager = UserManager()

# Register blueprints
app.register_blueprint(procurement_bp)

# Generate a globally unique address for this node
node_identifier = str(uuid.uuid4()).replace('-', '')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/market_prices')
def market_prices():
    # Get live market prices with real-time data
    market_data = market_service.get_live_prices()
    return jsonify(market_data)

@app.route('/market_intelligence')
def market_intelligence():
    # Get market intelligence and recommendations
    intelligence = market_service.get_market_intelligence()
    return jsonify(intelligence)

@app.route('/price_history/<crop>')
def price_history(crop):
    # Get historical price data for a specific crop
    days = request.args.get('days', 30, type=int)
    history = market_service.get_price_history(crop, days)
    return jsonify({'crop': crop, 'history': history})

@app.route('/regional_prices/<region>')
def regional_prices(region):
    # Get region-specific pricing
    prices = market_service.get_regional_prices(region)
    return jsonify({'region': region, 'prices': prices})

@app.route('/api/agmarknet')
def agmarknet_data():
    # Get Agmarknet data
    state = request.args.get('state', 'Telangana')
    commodity = request.args.get('commodity', 'Turmeric')
    data = market_service.get_agmarknet_data(state, commodity)
    return jsonify(data)

@app.route('/api/commodityonline')
def commodityonline_data():
    # Get private aggregator data
    commodity = request.args.get('commodity', 'turmeric')
    data = market_service.get_commodityonline_data(commodity)
    return jsonify(data)

@app.route('/api/ncdex')
def ncdex_data():
    # Get NCDEX futures and spot data
    commodity = request.args.get('commodity', 'turmeric')
    data = market_service.get_ncdex_data(commodity)
    return jsonify(data)

@app.route('/api/datagovin')
def datagovin_data():
    # Get Data.gov.in data
    state = request.args.get('state', 'Telangana')
    commodity = request.args.get('commodity', 'Turmeric')
    data = market_service.get_datagovin_data(state, commodity)
    return jsonify(data)

@app.route('/api/all_sources')
def all_sources_data():
    # Get data from all sources
    commodity = request.args.get('commodity', 'turmeric')
    state = request.args.get('state', 'Telangana')

    data = {
        'agmarknet': market_service.get_agmarknet_data(state, commodity),
        'commodityonline': market_service.get_commodityonline_data(commodity),
        'ncdex': market_service.get_ncdex_data(commodity),
        'datagovin': market_service.get_datagovin_data(state, commodity),
        'last_updated': datetime.now().isoformat(),
        'commodity': commodity,
        'state': state
    }
    return jsonify(data)

@app.route('/farmer/profile', methods=['GET', 'POST'])
def farmer_profile():
    if 'user' not in session:
        return redirect(url_for('login'))

    user_id = session['user']

    if request.method == 'POST':
        profile_data = request.get_json()
        if profile_manager.get_profile(user_id):
            profile = profile_manager.update_profile(user_id, profile_data)
        else:
            profile = profile_manager.create_profile(user_id, profile_data)
        return jsonify({'success': True, 'profile': profile})

    profile = profile_manager.get_profile(user_id)
    if not profile:
        return render_template('farmer_profile.html', profile=None)
    return render_template('farmer_profile.html', profile=profile)

@app.route('/farmer/impact')
def farmer_impact():
    if 'user' not in session:
        return redirect(url_for('login'))

    user_id = session['user']
    impact = profile_manager.calculate_impact_metrics(user_id)
    return jsonify(impact)

@app.route('/impact/dashboard')
def impact_dashboard():
    # Admin endpoint for overall impact metrics with live market data
    summary = profile_manager.get_impact_summary()

    # Get live market data for real-time display
    live_market_data = market_service.get_live_prices()
    market_intelligence = market_service.get_market_intelligence()

    # Get price history for charts
    price_history = {}
    for crop in ['alleppey', 'erode', 'nizamabad']:
        try:
            price_history[crop] = market_service.get_price_history(crop, days=30)
        except:
            price_history[crop] = []

    return render_template('impact_dashboard.html',
                         summary=summary,
                         live_market_data=live_market_data,
                         market_intelligence=market_intelligence,
                         price_history=price_history)

@app.route('/farmer/join_cooperative', methods=['POST'])
def join_cooperative():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})

    data = request.get_json()
    user_id = session['user']
    success = profile_manager.join_cooperative(user_id, data['cooperative_id'], data['cooperative_name'])

    if success:
        return jsonify({'success': True, 'message': 'Successfully joined cooperative'})
    return jsonify({'success': False, 'message': 'Already a member or cooperative not found'})

@app.route('/supply_chain/trace/<batch_id>')
def trace_supply_chain(batch_id):
    """Trace a product through the supply chain using batch ID"""
    # Search through blockchain for transactions with this batch ID
    traced_transactions = []

    for block in blockchain.chain:
        for transaction in block['transactions']:
            if (transaction.get('supply_chain', {}).get('batch_id') == batch_id or
                batch_id in transaction.get('supply_chain', {}).get('traceability_qr', '')):
                traced_transactions.append({
                    'block_index': block['index'],
                    'timestamp': transaction['timestamp'],
                    'sender': transaction['sender'],
                    'recipient': transaction['recipient'],
                    'crop_type': transaction['crop_type'],
                    'quantity': transaction['quantity'],
                    'supply_chain': transaction.get('supply_chain', {})
                })

    return jsonify({
        'batch_id': batch_id,
        'trace': traced_transactions,
        'total_steps': len(traced_transactions)
    })

@app.route('/supply_chain/qr/<qr_code>')
def trace_by_qr(qr_code):
    """Trace a product using QR code"""
    # Similar to batch trace but using QR code
    traced_transactions = []

    for block in blockchain.chain:
        for transaction in block['transactions']:
            if qr_code in transaction.get('supply_chain', {}).get('traceability_qr', ''):
                traced_transactions.append({
                    'block_index': block['index'],
                    'timestamp': transaction['timestamp'],
                    'supply_chain': transaction.get('supply_chain', {})
                })

    return jsonify({
        'qr_code': qr_code,
        'trace': traced_transactions
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chatbot messages using Gemini API"""
    data = request.get_json()
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        # Generate response using Gemini
        response = model.generate_content(
            f"You are a helpful agricultural assistant for farmers. Provide helpful, accurate information about farming, crops, market prices, and agricultural best practices. User message: {user_message}"
        )
        bot_response = response.text
        return jsonify({'response': bot_response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/quality_verification/<batch_id>')
def quality_verification(batch_id):
    """Get quality verification data for a batch"""
    # Search for quality certifications in the supply chain
    quality_data = None

    for block in blockchain.chain:
        for transaction in block['transactions']:
            supply_chain = transaction.get('supply_chain', {})
            if supply_chain.get('batch_id') == batch_id:
                quality_data = {
                    'batch_id': batch_id,
                    'quality_grade': supply_chain.get('quality_grade', 'unknown'),
                    'certifications': supply_chain.get('certifications', []),
                    'farm_location': supply_chain.get('farm_location', ''),
                    'harvest_date': supply_chain.get('harvest_date', ''),
                    'processing_steps': supply_chain.get('processing_steps', []),
                    'storage_conditions': supply_chain.get('storage_conditions', {}),
                    'verified_at': transaction['timestamp'],
                    'block_hash': blockchain.hash(block)
                }
                break
        if quality_data:
            break

    if quality_data:
        return jsonify({'success': True, 'quality_data': quality_data})
    return jsonify({'success': False, 'message': 'Batch not found or no quality data available'})

@app.route('/mine', methods=['GET'])
def mine():
    # We run the proof of work algorithm to get the next proof...
    last_block = blockchain.last_block
    last_proof = last_block['proof']
    proof = blockchain.proof_of_work(last_proof)

    # We must receive a reward for finding the proof.
    # The sender is "0" to signify that this node has mined a new coin.
    blockchain.new_transaction(
        sender="0",
        recipient=node_identifier,
        amount=1,
        crop_type="mining_reward",
        quantity=1
    )

    # Forge the new Block by adding it to the chain
    previous_hash = blockchain.hash(last_block)
    block = blockchain.new_block(proof, previous_hash)

    response = {
        'message': "New Block Forged",
        'index': block['index'],
        'transactions': block['transactions'],
        'proof': block['proof'],
        'previous_hash': block['previous_hash'],
    }
    return jsonify(response), 200

@app.route('/transactions/new', methods=['POST'])
def new_transaction():
    values = request.get_json()

    # Check that the required fields are in the POST'ed data
    required = ['sender', 'recipient', 'amount', 'crop_type', 'quantity']
    if not all(k in values for k in required):
        return 'Missing values', 400

    # Extract supply chain data if provided
    supply_chain_data = values.get('supply_chain', {})

    # Create a new Transaction
    index = blockchain.new_transaction(values['sender'], values['recipient'], values['amount'], values['crop_type'], values['quantity'], supply_chain_data)

    # Record transaction in farmer profile if sender is a farmer
    if 'farmer_' in values['sender']:
        profile_manager.record_transaction(values['sender'], {
            'type': 'sale',
            'crop': values['crop_type'],
            'quantity': values['quantity'],
            'price_per_kg': values['amount'] / values['quantity'] if values['quantity'] > 0 else 0,
            'total_amount': values['amount'],
            'buyer_type': 'direct' if 'buyer_' in values['recipient'] else 'cooperative',
            'market_price': market_service.get_live_prices()['prices'].get(values['crop_type'], {}).get('price', 0)
        })

    response = {'message': f'Transaction will be added to Block {index}'}
    return jsonify(response), 201

@app.route('/chain', methods=['GET'])
def full_chain():
    response = {
        'chain': blockchain.chain,
        'length': len(blockchain.chain),
    }
    return jsonify(response), 200

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        # Server-side validation
        if not username or not password:
            flash('Please fill in all fields', 'error')
            return render_template('login.html')

        if len(username) < 3:
            flash('Username must be at least 3 characters long', 'error')
            return render_template('login.html')

        # Authenticate user
        user, error = user_manager.authenticate_user(username, password)
        if user:
            session['user'] = user['username']
            session['user_id'] = user['id']
            session['is_verified'] = user['is_verified']
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash(error or 'Invalid credentials', 'error')
            return render_template('login.html')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        email = request.form.get('email', '').strip()
        terms = request.form.get('terms')

        # Server-side validation
        errors = []

        if not username or not password or not confirm_password:
            errors.append('Please fill in all required fields')

        if len(username) < 3:
            errors.append('Username must be at least 3 characters long')

        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')

        if password != confirm_password:
            errors.append('Passwords do not match')

        # Password strength validation
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', password):
            errors.append('Password must contain at least one uppercase letter, one lowercase letter, and one number')

        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            errors.append('Please enter a valid email address')

        # Terms and conditions validation
        if not terms:
            errors.append('You must agree to the Terms and Conditions')

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')

        # Create user
        user_id = user_manager.create_user(username, password, email if email else None)
        if user_id:
            session['user'] = username
            session['user_id'] = user_id
            session['is_verified'] = False
            flash('Registration successful! Welcome to TurmericTech.', 'success')
            return redirect(url_for('home'))
        else:
            flash('Username or email already exists', 'error')
            return render_template('register.html')

    return render_template('register.html')

@app.route('/cooperatives')
def cooperatives():
    return render_template('cooperatives.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('home'))

@app.route('/profile')
def profile():
    if 'user' not in session:
        return redirect(url_for('login'))

    user = user_manager.get_user_by_id(session['user_id'])
    return render_template('profile.html', user=user)

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    return '', 204  # No content response for favicon

@app.route('/terminal.html')
def terminal():
    """Handle terminal requests - redirect to home"""
    return redirect(url_for('home'))

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors gracefully"""
    return render_template('index.html'), 404

# Exempt login and register routes from CSRF protection
csrf.exempt(login)
csrf.exempt(register)

# Exempt procurement blueprint from CSRF protection
csrf.exempt(procurement_bp)

# Exempt chat route from CSRF protection
csrf.exempt(chat)

if __name__ == '__main__':
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(debug=True)