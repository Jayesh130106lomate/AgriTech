from flask import Flask, render_template, request, jsonify
from flask_babel import Babel, gettext as _
import logging

app = Flask(__name__)
babel = Babel(app)

# Configure Babel for multilingual support
app.config['BABEL_DEFAULT_LOCALE'] = 'en'
app.config['BABEL_SUPPORTED_LOCALES'] = ['en', 'te', 'hi']  # English, Telugu, Hindi

def get_locale():
    return request.accept_languages.best_match(app.config['BABEL_SUPPORTED_LOCALES'])

babel.localeselector = get_locale

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/market_prices')
def market_prices():
    # Placeholder for real-time market prices
    prices = {
        'turmeric': {'price': 150, 'unit': 'per kg'},
        'other_crop': {'price': 100, 'unit': 'per kg'}
    }
    return jsonify(prices)

if __name__ == '__main__':
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(debug=True)