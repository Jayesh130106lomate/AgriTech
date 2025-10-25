# AgriTech & Rural Markets — Turmeric Farmers in Nizamabad

## Problem Statement
Turmeric farmers in Nizamabad face unfair pricing, middlemen exploitation, and lack of real-time market information. This leads to financial losses and hinders fair trade practices.

## Goal
Build a mobile or web system (possibly blockchain + multilingual UI) for fair trading, live market prices, and cooperative management.

## Core Idea
Empower farmers with price transparency, fair trade tools, and easy-to-use digital access.

## Features
- **Real-time Market Prices**: Live price updates for turmeric and other crops
- **Blockchain-Based Fair Trade**: Secure, transparent transactions using proof-of-work blockchain
- **Farmer Cooperatives**: Join cooperatives for collective bargaining and shared resources
- **User Authentication**: Secure login and registration system
- **Multilingual UI**: Support for English, Telugu, and Hindi
- **Responsive Design**: Mobile-friendly interface
- **Interactive Dashboard**: Real-time blockchain statistics and transaction management

## Technology Stack
- **Backend**: Python Flask
- **Blockchain**: Custom proof-of-work implementation
- **Frontend**: HTML, CSS, JavaScript
- **Multilingual**: Flask-Babel
- **Sessions**: Flask-Session
- **Blockchain Library**: Web3.py (for future Ethereum integration)

## Setup Instructions
1. Install Python 3.8+
2. Clone or download the project
3. Install dependencies: `pip install -r requirements.txt`
4. Run the application: `python app.py`
5. Open http://localhost:5000 in your browser

## API Endpoints
- `GET /`: Home page
- `GET /market_prices`: Get current market prices
- `POST /transactions/new`: Create new blockchain transaction
- `GET /mine`: Mine a new block
- `GET /chain`: Get full blockchain
- `GET/POST /login`: User login
- `GET/POST /register`: User registration
- `GET /cooperatives`: Cooperative information
- `GET /logout`: User logout

## Project Structure
```
AgriTech/
├── app.py                 # Main Flask application with blockchain integration
├── blockchain.py          # Custom blockchain implementation
├── requirements.txt       # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css      # Modern, responsive CSS
│   └── js/
│       └── script.js      # Interactive JavaScript
├── templates/
│   ├── index.html         # Main dashboard
│   ├── login.html         # User login page
│   ├── register.html      # User registration page
│   └── cooperatives.html  # Cooperative management
└── README.md              # Project documentation
```

## Blockchain Features
- **Proof-of-Work**: Secure block mining with adjustable difficulty
- **Transaction Recording**: All fair trade transactions recorded immutably
- **Chain Validation**: Automatic verification of blockchain integrity
- **Mining Rewards**: Incentive system for block miners
- **Real-time Stats**: Live display of blocks and transactions

## Usage
1. **View Market Prices**: Check live prices on the home page
2. **Create Transactions**: Use the fair trade form to initiate blockchain transactions
3. **Mine Blocks**: Click "Mine New Block" to process pending transactions
4. **Join Cooperatives**: Explore cooperative options and apply for membership
5. **User Management**: Register/login to access personalized features

## Future Enhancements
- Real-time market data integration with external APIs
- Advanced user profiles and transaction history
- Cooperative voting and governance systems
- Mobile app development
- Integration with Ethereum blockchain
- Smart contracts for automated fair trade agreements
- Multi-language expansion
- Farmer education and training modules

## Security Features
- Session-based authentication
- CSRF protection
- Secure password handling
- Blockchain immutability
- Transaction validation

## Contributing
This platform is designed to empower farmers and promote fair agriculture. Contributions for improving farmer welfare and agricultural transparency are welcome.