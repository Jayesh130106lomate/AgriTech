from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

# Home route
@app.route('/')
def home():
    return render_template('index.html')  # or 'base.html'

# Market Prices page
@app.route('/market-prices')
def market_prices():
    return render_template('market_prices.html')

# Sell Produce page
@app.route('/sell-produce')
def sell_produce():
    return render_template('sell_produce.html')

# Buy Produce page
@app.route('/buy-produce')
def buy_produce():
    return render_template('buy_produce.html')

# Cooperative page
@app.route('/cooperative')
def cooperative():
    return render_template('cooperative.html')

# About page
@app.route('/about')
def about():
    return render_template('about.html')

# Contact page
@app.route('/contact')
def contact():
    return render_template('contact.html')

# Login page
@app.route('/login')
def login():
    return render_template('login.html')

# Register page
@app.route('/register')
def register():
    return render_template('register.html')

# Logout (redirect to home)
@app.route('/logout')
def logout():
    # Here you would normally clear session or token
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
