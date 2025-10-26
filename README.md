#  AgriTech Platform

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-lightgrey.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A blockchain-based platform for fair turmeric trading, empowering Nizamabad farmers with transparent pricing, real-time market intelligence, and supply chain traceability.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Jayesh130106lomate/AgriTech.git
cd AgriTech

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Visit `http://localhost:5000` to access the platform.

##  Key Features

###  **Market Intelligence**
- Real-time price feeds from multiple sources
- Historical price trends and analytics
- Regional market comparisons

###  **Blockchain Trading**
- Transparent, immutable trade records
- Fair trade agreements on blockchain
- Supply chain traceability with QR codes

###  **Farmer Cooperatives**
- Cooperative membership management
- Collective bargaining tools
- Impact tracking and metrics

###  **AI Assistant**
- AgriBot for farming advice
- Market insights and recommendations
- Multilingual support (English, Telugu, Hindi)

##  Requirements

- Python 3.8+
- Flask 2.3.3
- SQLite (built-in)
- Modern web browser

##  Installation

### 1. Clone Repository
```bash
git clone https://github.com/Jayesh130106lomate/AgriTech.git
cd AgriTech
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment (Optional)
Create a `.env` file for API keys:
```env
GEMINI_API_KEY=your-gemini-api-key-here
SECRET_KEY=your-secret-key-here
```

### 4. Run Application
```bash
python app.py
```

##  Usage

### For Farmers
1. **Register/Login** - Create your farmer profile
2. **View Market Prices** - Check real-time turmeric prices
3. **Create Trade Agreements** - Record fair trades on blockchain
4. **Generate QR Codes** - Create traceable product batches
5. **Join Cooperatives** - Access collective bargaining tools

### For Buyers
1. **Browse Market** - View available turmeric batches
2. **Verify Products** - Scan QR codes for authenticity
3. **Direct Trading** - Connect with farmers transparently

##  API Endpoints

### Market Data
- GET /market_prices - Real-time market prices
- GET /market_intelligence - AI-powered insights
- GET /price_history/<crop> - Historical price data

### Blockchain
- POST /transactions/new - Create blockchain transaction
- GET /chain - View blockchain
- GET /mine - Mine pending transactions

### Supply Chain
- GET /supply_chain/trace/<batch_id> - Trace product batch
- POST /create_batch_qr - Generate QR code for batch
- POST /api/verify_qr - Verify QR code authenticity

### AI Assistant
- POST /chat - Interact with AgriBot

## 🏗 Project Structure

```
AgriTech/
├── app.py                 # Main Flask application
├── blockchain.py          # Custom blockchain implementation
├── market_data.py         # Market data aggregation service
├── farmer_profiles.py     # Farmer profile management
├── user_manager.py        # User authentication system
├── traceability.py        # QR code and traceability system
├── procurement.py         # Procurement management
├── requirements.txt       # Python dependencies
├── static/                # CSS, JavaScript, images
├── templates/             # HTML templates
└── README.md             # This file
```

## 🧪 Testing

Run the application and test endpoints:

```bash
python app.py
```

Test market prices endpoint:
```bash
curl http://localhost:5000/market_prices
```

## 🚀 Deployment

### Local Development
```bash
export FLASK_ENV=development
python app.py
```

### Production (using Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Contact

**Jayesh Lomate** - Lead Developer
- Email: jayesh130106lomate@gmail.com
- GitHub: [Jayesh130106lomate](https://github.com/Jayesh130106lomate)

---

<div align="center">
🌾 Empowering farmers with technology for fair trade 🌾
</div>
