document.addEventListener('DOMContentLoaded', function() {
    loadMarketPrices();

    document.getElementById('refresh-prices').addEventListener('click', loadMarketPrices);
});

function loadMarketPrices() {
    fetch('/market_prices')
        .then(response => response.json())
        .then(data => {
            const pricesDiv = document.getElementById('prices');
            pricesDiv.innerHTML = '';
            for (const [crop, info] of Object.entries(data)) {
                const p = document.createElement('p');
                p.textContent = `${crop}: ₹${info.price} ${info.unit}`;
                pricesDiv.appendChild(p);
            }
        })
        .catch(error => {
            console.error('Error loading market prices:', error);
            document.getElementById('prices').innerHTML = '<p>Error loading prices. Please try again.</p>';
        });
}

// Placeholder for blockchain integration
function initBlockchain() {
    // Initialize Web3 or other blockchain librar
    console.log('Blockchain integration placeholder');
}

// Call initBlockchain if needed
// initBlockchain();