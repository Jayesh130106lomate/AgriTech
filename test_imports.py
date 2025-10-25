from flask import Flask
from flask_babel import Babel
from flask_wtf.csrf import CSRFProtect
import logging
from datetime import datetime
from blockchain import Blockchain
import uuid
from market_data import MarketDataService
from farmer_profiles import FarmerProfileManager
from procurement import procurement_bp
from user_manager import UserManager

app = Flask(__name__)
app.secret_key = 'test-key'
babel = Babel(app)
csrf = CSRFProtect(app)

print('All imports successful, app created')