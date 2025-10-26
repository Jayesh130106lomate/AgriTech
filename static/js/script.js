document.addEventListener('DOMContentLoaded', function() {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Check online status
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize modern navbar functionality
    initializeNavbar();

    // Initialize chart
    initializePriceChart();

    loadMarketPrices();
    loadBlockchainStats();

    document.getElementById('refresh-prices')?.addEventListener('click', loadMarketPrices);
    document.getElementById('refresh-chart')?.addEventListener('click', loadMarketPrices);
    document.getElementById('trade-form')?.addEventListener('submit', handleTradeSubmit);
    document.getElementById('mine-block')?.addEventListener('click', mineBlock);
    document.getElementById('preview-trade')?.addEventListener('click', previewTrade);
    document.getElementById('confirm-trade')?.addEventListener('click', confirmTrade);

    // Enhanced trade form event listeners
    setupTradeFormListeners();

    // Auto-refresh chart every 30 seconds
    setInterval(loadMarketPrices, 30000);

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                const navbarHeight = document.querySelector('.modern-navbar')?.offsetHeight || 70;
                const targetPosition = targetSection.offsetTop - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu after clicking
                closeMobileMenu();
            }
        });
    });
});

// Initialize modern navbar functionality
function initializeNavbar() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    if (mobileMenuToggle && mobileNavOverlay) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);

        mobileNavClose.addEventListener('click', closeMobileMenu);

        // Close mobile menu when clicking overlay
        mobileNavOverlay.addEventListener('click', function(e) {
            if (e.target === mobileNavOverlay) {
                closeMobileMenu();
            }
        });
    }

    // User dropdown toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Close mobile menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });

    // Update active navigation link on scroll
    updateActiveNavLink();
    window.addEventListener('scroll', updateActiveNavLink);
}

function toggleMobileMenu() {
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const hamburgerLines = document.querySelectorAll('.hamburger-line');

    if (mobileNavOverlay.classList.contains('active')) {
        closeMobileMenu();
    } else {
        mobileNavOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Animate hamburger to X
        if (hamburgerLines.length === 3) {
            hamburgerLines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            hamburgerLines[1].style.opacity = '0';
            hamburgerLines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        }
    }
}

function closeMobileMenu() {
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const hamburgerLines = document.querySelectorAll('.hamburger-line');

    mobileNavOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling

    // Reset hamburger animation
    if (hamburgerLines.length === 3) {
        hamburgerLines[0].style.transform = '';
        hamburgerLines[1].style.opacity = '';
        hamburgerLines[2].style.transform = '';
    }
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    const navbarHeight = document.querySelector('.modern-navbar')?.offsetHeight || 70;
    const scrollPosition = window.scrollY + navbarHeight + 100;

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    // Update desktop navigation
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });

    // Update mobile navigation
    mobileNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

function initializePriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');

    window.priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Turmeric Price (₹/kg)',
                data: [],
                borderColor: '#32cd32',
                backgroundColor: 'rgba(50, 205, 50, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#32cd32',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#228B22',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#32cd32',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `Time: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `Price: ₹${context.parsed.y}/kg`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price (₹/kg)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    },
                    beginAtZero: false
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function loadMarketPrices() {
    fetch('/market_prices')
        .then(response => response.json())
        .then(data => {
            const pricesDiv = document.getElementById('prices');
            const lastUpdatedDiv = document.getElementById('last-updated');

            // Update last updated time
            if (data.last_updated) {
                const date = new Date(data.last_updated);
                lastUpdatedDiv.textContent = `Last updated: ${date.toLocaleString()} | Sources: ${data.sources.join(', ')}`;
            }

            pricesDiv.innerHTML = '';

            if (data.prices) {
                // Update chart with historical data
                updatePriceChart(data);

                // Update market indicators
                updateMarketIndicators(data);

                for (const [crop, info] of Object.entries(data.prices)) {
                    const card = document.createElement('div');
                    card.className = `price-card ${info.trend === 'up' ? 'trending-up' : info.trend === 'down' ? 'trending-down' : ''}`;

                    // Determine trend color
                    let trendColor = '#666';
                    let trendSymbol = '→';
                    if (info.trend === 'up') {
                        trendColor = '#28a745';
                        trendSymbol = '↗';
                    } else if (info.trend === 'down') {
                        trendColor = '#dc3545';
                        trendSymbol = '↘';
                    }

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <h3>₹${info.price}</h3>
                            <span style="color: ${trendColor}; font-size: 1.2rem;">${trendSymbol}</span>
                        </div>
                        <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${crop.charAt(0).toUpperCase() + crop.slice(1)} (${info.unit})</p>
                        <p style="margin: 0; color: #888; font-size: 0.8rem;">${info.source} • ${info.market || 'Regional'}</p>
                        ${info.change_percent ? `<span class="price-change ${info.change_percent > 0 ? 'positive' : 'negative'}">${info.change_percent > 0 ? '+' : ''}${info.change_percent}%</span>` : ''}
                    `;
                    pricesDiv.appendChild(card);
                }
            } else {
                pricesDiv.innerHTML = '<p>No price data available at the moment.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading market prices:', error);
            document.getElementById('prices').innerHTML = '<p>Error loading prices. Please try again.</p>';
            document.getElementById('last-updated').textContent = 'Unable to load latest data';
        });
}

function updatePriceChart(data) {
    if (!window.priceChart) return;

    // Generate sample historical data for the chart (in real app, this would come from API)
    const now = new Date();
    const labels = [];
    const prices = [];

    // Create 24 data points (last 24 hours)
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

        // Get current price and add some variation for demo
        const basePrice = data.prices?.turmeric?.price || 275;
        const variation = (Math.random() - 0.5) * 20; // ±10 variation
        prices.push(Math.round(basePrice + variation));
    }

    window.priceChart.data.labels = labels;
    window.priceChart.data.datasets[0].data = prices;
    window.priceChart.update('active');
}

function updateMarketIndicators(data) {
    const turmericData = data.prices?.turmeric;
    if (!turmericData) return;

    // Update 24h change
    const change24h = document.getElementById('change-24h');
    if (turmericData.change_percent) {
        const change = turmericData.change_percent;
        change24h.textContent = `${change > 0 ? '+' : ''}${change}%`;
        change24h.className = `indicator-value ${change > 0 ? 'text-success' : 'text-danger'}`;
    }

    // Update volume (sample data)
    document.getElementById('volume').textContent = `${Math.floor(Math.random() * 500) + 500} kg`;

    // Update high/low (sample data based on current price)
    const currentPrice = turmericData.price;
    const high = currentPrice + Math.floor(Math.random() * 15) + 5;
    const low = currentPrice - Math.floor(Math.random() * 15) - 5;

    document.getElementById('high').textContent = `₹${high}`;
    document.getElementById('low').textContent = `₹${low}`;
}

function loadBlockchainStats() {
    fetch('/chain')
        .then(response => response.json())
        .then(data => {
            document.getElementById('block-count').textContent = data.length;
            const totalTransactions = data.chain.reduce((sum, block) => sum + block.transactions.length, 0);
            document.getElementById('transaction-count').textContent = totalTransactions;
        })
        .catch(error => {
            console.error('Error loading blockchain stats:', error);
        });
}

function handleTradeSubmit(e) {
    e.preventDefault();

    // Validate form
    if (!validateTradeForm()) {
        showError('Please correct the errors in the form before submitting.');
        return;
    }

    const tradeTypeElement = document.querySelector('input[name="tradeType"]:checked');
    const tradeType = tradeTypeElement ? tradeTypeElement.value : 'direct'; // Default to direct if none selected
    const turmericType = document.getElementById('turmeric_type').value;
    const qualityGrade = document.getElementById('quality_grade').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const buyerType = document.getElementById('buyer_type').value;
    const buyer = document.getElementById('buyer').value;
    const deliveryDate = document.getElementById('delivery_date').value;
    const deliveryLocation = document.getElementById('delivery_location').value;
    const tradeTerms = document.getElementById('trade_terms').value;

    const amount = quantity * price;

    // Enhanced transaction data
    const transactionData = {
        sender: 'farmer_' + Date.now(), // In real app, use actual user ID
        recipient: buyer,
        amount: amount,
        crop_type: turmericType,
        quantity: parseInt(quantity),
        trade_type: tradeType,
        quality_grade: qualityGrade,
        buyer_type: buyerType,
        delivery_date: deliveryDate || null,
        delivery_location: deliveryLocation || null,
        trade_terms: tradeTerms || null,
        timestamp: new Date().toISOString()
    };

    // Check if online
    if (!navigator.onLine) {
        // Store transaction locally for later sync
        storeOfflineTransaction(transactionData);
        const statusDiv = document.getElementById('transaction-status');
        statusDiv.className = 'transaction-status pending';
        statusDiv.textContent = '📱 Trade agreement saved offline. Will be submitted when you\'re back online.';
        document.getElementById('trade-form').reset();
        loadBlockchainStats(); // Update stats
        return;
    }

    // Online submission
    submitTradeTransaction(transactionData);
}

function submitTradeTransaction(transactionData) {
    const submitBtn = document.querySelector('#trade-form button[type="submit"]');
    setLoading(submitBtn, true);

    fetch('/transactions/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
    })
    .then(response => response.json())
    .then(data => {
        const statusDiv = document.getElementById('transaction-status');
        if (response.ok) {
            statusDiv.className = 'transaction-status success';
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <strong>Trade Agreement Created Successfully!</strong><br>
                Transaction recorded on blockchain. ${data.message}<br>
                <small class="text-muted">Trade ID: ${transactionData.sender.split('_')[1]}</small>
            `;
            document.getElementById('trade-form').reset();
            document.getElementById('trade-summary').style.display = 'none';

            // Reset form to initial state
            updateVarietyInfo();
            updateQualityInfo();
        } else {
            statusDiv.className = 'transaction-status error';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error creating trade agreement: ${data.message || 'Unknown error'}`;
        }
        loadBlockchainStats(); // Update stats
    })
    .catch(error => {
        console.error('Error creating trade transaction:', error);
        const statusDiv = document.getElementById('transaction-status');
        statusDiv.className = 'transaction-status error';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Network error. Please check your connection and try again.';
    })
    .finally(() => {
        setLoading(submitBtn, false);
    });
}

function storeOfflineTransaction(transactionData) {
    // Store in localStorage for now (in production, use IndexedDB)
    const offlineTransactions = JSON.parse(localStorage.getItem('offlineTransactions') || '[]');
    const offlineTransaction = {
        id: Date.now().toString(),
        data: transactionData,
        timestamp: new Date().toISOString(),
        synced: false,
        type: 'trade_agreement'
    };

    offlineTransactions.push(offlineTransaction);
    localStorage.setItem('offlineTransactions', JSON.stringify(offlineTransactions));

    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('background-sync-transactions');
        });
    }
}

// Try to sync offline transactions when coming back online
function syncOfflineTransactions() {
    const offlineTransactions = JSON.parse(localStorage.getItem('offlineTransactions') || '[]');
    const unsynced = offlineTransactions.filter(t => !t.synced);

    if (unsynced.length === 0) return;

    console.log(`Attempting to sync ${unsynced.length} offline transactions`);

    unsynced.forEach(transaction => {
        submitTransaction(transaction.data)
            .then(() => {
                transaction.synced = true;
                localStorage.setItem('offlineTransactions', JSON.stringify(offlineTransactions));
                console.log('Synced offline transaction:', transaction.id);
            })
            .catch(error => {
                console.error('Failed to sync transaction:', transaction.id, error);
            });
    });
}

// Sync when coming back online
window.addEventListener('online', function() {
    setTimeout(syncOfflineTransactions, 1000); // Wait 1 second for connection to stabilize
});

function mineBlock() {
    const mineButton = document.getElementById('mine-block');
    const statusDiv = document.getElementById('mining-status');

    mineButton.disabled = true;
    mineButton.textContent = 'Mining...';
    statusDiv.className = 'mining-status';
    statusDiv.textContent = 'Mining new block... This may take a few seconds.';

    fetch('/mine', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        statusDiv.className = 'mining-status success';
        statusDiv.textContent = `Block mined successfully! Block #${data.index} with ${data.transactions.length} transactions.`;
        mineButton.disabled = false;
        mineButton.textContent = 'Mine New Block';
        loadBlockchainStats(); // Update stats
    })
    .catch(error => {
        console.error('Error mining block:', error);
        statusDiv.className = 'mining-status error';
        statusDiv.textContent = 'Error mining block. Please try again.';
        mineButton.disabled = false;
        mineButton.textContent = 'Mine New Block';
    });
}

// Add loading state to buttons
function setLoading(button, loading) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
    }
}

// Enhanced form submission with loading states
document.getElementById('tradeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    fetch('/trade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadBlockchainStats();
        this.reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing your trade.');
    })
    .finally(() => {
        setLoading(submitBtn, false);
    });
});

// Enhanced cooperative form submission
document.getElementById('cooperativeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    fetch('/create_cooperative', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadCooperatives();
        this.reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while creating the cooperative.');
    })
    .finally(() => {
        setLoading(submitBtn, false);
    });
});

// Enhanced login form submission
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during login.');
    })
    .finally(() => {
        setLoading(submitBtn, false);
    });
});

// Enhanced register form submission
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/login';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during registration.');
    })
    .finally(() => {
        setLoading(submitBtn, false);
    });
});

function updateOnlineStatus() {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'connection-status';
    statusIndicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 0.5rem;
        text-align: center;
        font-weight: bold;
        z-index: 1000;
        transition: all 0.3s ease;
    `;

    const existing = document.getElementById('connection-status');
    if (existing) {
        existing.remove();
    }

    if (!navigator.onLine) {
        statusIndicator.style.background = '#dc3545';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = '🔴 You are offline. Some features may be limited.';
        document.body.insertBefore(statusIndicator, document.body.firstChild);

        // Adjust body padding to account for status bar
        document.body.style.paddingTop = '40px';
    } else {
        statusIndicator.style.background = '#28a745';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = '🟢 You are back online!';
        document.body.insertBefore(statusIndicator, document.body.firstChild);

        // Hide the message after 3 seconds
        setTimeout(() => {
            statusIndicator.remove();
            document.body.style.paddingTop = '0';
        }, 3000);
    }
}

// Enhanced trade form functionality
function setupTradeFormListeners() {
    // Turmeric variety change
    document.getElementById('turmeric_type')?.addEventListener('change', updateVarietyInfo);

    // Quality grade change
    document.getElementById('quality_grade')?.addEventListener('change', updateQualityInfo);

    // Quantity input
    document.getElementById('quantity')?.addEventListener('input', updateTradeSummary);

    // Price input
    document.getElementById('price')?.addEventListener('input', updateTradeSummary);

    // Real-time validation
    const formControls = document.querySelectorAll('#trade-form input, #trade-form select');
    formControls.forEach(control => {
        control.addEventListener('blur', validateField);
        control.addEventListener('input', clearFieldError);
    });

    // Trade type selector
    document.querySelectorAll('input[name="tradeType"]').forEach(radio => {
        radio.addEventListener('change', updateTradeType);
    });

    // Initialize with default values
    updateVarietyInfo();
    updateQualityInfo();
    updateMarketStats();
}

function updateVarietyInfo() {
    const variety = document.getElementById('turmeric_type').value;
    const infoDiv = document.getElementById('variety-info');

    const varietyData = {
        'alleppey': { region: 'Kerala', quality: 'Premium', description: 'World-renowned for curcumin content and aroma' },
        'erode': { region: 'Tamil Nadu', quality: 'Standard', description: 'Popular variety with good market acceptance' },
        'nizamabad': { region: 'Telangana', quality: 'Organic', description: 'Local variety with organic certification focus' },
        'rajapore': { region: 'Maharashtra', quality: 'Premium', description: 'High-quality variety with export potential' },
        'duggirala': { region: 'Andhra Pradesh', quality: 'Standard', description: 'Reliable variety with consistent quality' },
        'other': { region: 'Various', quality: 'Variable', description: 'Other varieties - please specify details' }
    };

    const data = varietyData[variety] || varietyData['other'];
    infoDiv.innerHTML = `<small class="text-muted"><i class="fas fa-info-circle"></i> ${data.region} • ${data.quality} Quality • ${data.description}</small>`;

    // Auto-set quality grade based on variety
    if (variety && data.quality !== 'Variable') {
        const qualityMap = { 'Premium': 'premium', 'Standard': 'standard', 'Organic': 'premium' };
        document.getElementById('quality_grade').value = qualityMap[data.quality] || 'standard';
        updateQualityInfo();
    }
}

function updateQualityInfo() {
    const quality = document.getElementById('quality_grade').value;
    const infoDiv = document.getElementById('quality-info');

    const qualityData = {
        'premium': { premium: '₹15-25/kg', description: 'A+ grade with superior curcumin content' },
        'standard': { premium: '₹5-15/kg', description: 'A grade with good market standards' },
        'basic': { premium: '₹0-5/kg', description: 'B grade with basic quality requirements' }
    };

    const data = qualityData[quality];
    if (data) {
        infoDiv.innerHTML = `<small class="text-muted"><i class="fas fa-award"></i> Quality Premium: ${data.premium} • ${data.description}</small>`;
    }
}

function updateTradeSummary() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('price').value) || 0;
    const quality = document.getElementById('quality_grade').value;
    const variety = document.getElementById('turmeric_type').value;

    if (quantity > 0 && price > 0) {
        const totalValue = quantity * price;

        // Calculate quality premium
        const qualityPremiums = { 'premium': 20, 'standard': 10, 'basic': 0 };
        const qualityPremium = qualityPremiums[quality] || 0;
        const qualityBonus = (totalValue * qualityPremium) / 100;

        // Estimate profit (rough calculation)
        const estimatedProfit = totalValue * 0.15; // 15% estimated profit margin

        // Update summary
        document.getElementById('total-value').textContent = `₹${totalValue.toLocaleString()}`;
        document.getElementById('quality-premium').textContent = `₹${qualityBonus.toLocaleString()}`;
        document.getElementById('estimated-profit').textContent = `₹${estimatedProfit.toLocaleString()}`;

        // Market alignment check
        const marketPrice = 275; // This should come from API
        const alignment = price >= marketPrice * 0.9 && price <= marketPrice * 1.1 ? 'success' : 'warning';
        const alignmentText = price >= marketPrice * 0.9 && price <= marketPrice * 1.1 ? 'Fair Price' : 'Price Alert';

        document.getElementById('market-alignment').className = `badge bg-${alignment}`;
        document.getElementById('market-alignment').textContent = alignmentText;

        // Show summary
        document.getElementById('trade-summary').style.display = 'block';

        // Price suggestion
        updatePriceSuggestion(price, marketPrice);
    } else {
        document.getElementById('trade-summary').style.display = 'none';
    }
}

function updatePriceSuggestion(currentPrice, marketPrice) {
    const suggestionDiv = document.getElementById('price-suggestion');

    if (currentPrice < marketPrice * 0.9) {
        suggestionDiv.innerHTML = `<i class="fas fa-arrow-up text-success"></i> Consider increasing to ₹${Math.round(marketPrice * 0.95)}+ for better returns`;
        suggestionDiv.className = 'text-success';
    } else if (currentPrice > marketPrice * 1.1) {
        suggestionDiv.innerHTML = `<i class="fas fa-arrow-down text-warning"></i> Price seems high - market average is ₹${marketPrice}`;
        suggestionDiv.className = 'text-warning';
    } else {
        suggestionDiv.innerHTML = `<i class="fas fa-check-circle text-success"></i> Price aligns well with market rates`;
        suggestionDiv.className = 'text-success';
    }
}

function updateMarketStats() {
    // Update market statistics cards
    fetch('/market_prices')
        .then(response => response.json())
        .then(data => {
            if (data.prices && Object.keys(data.prices).length > 0) {
                // Get the first available price or a specific variety
                const firstPrice = Object.values(data.prices)[0];
                const alleppeyPrice = data.prices.alleppey || firstPrice;

                document.getElementById('current-market-price').textContent = `₹${alleppeyPrice.price}`;

                // Calculate fair price (market price - 5% for farmer margin)
                const fairPrice = Math.round(alleppeyPrice.price * 0.95);
                document.getElementById('fair-price-suggestion').textContent = `₹${fairPrice}`;
            }
        })
        .catch(error => console.error('Error updating market stats:', error));
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name || field.id;

    // Clear previous validation
    field.classList.remove('is-valid', 'is-invalid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, `${fieldName.replace('_', ' ').toUpperCase()} is required`);
        return false;
    }

    // Specific validations
    switch (field.id) {
        case 'quantity':
            if (value && (parseFloat(value) < 1 || parseFloat(value) > 10000)) {
                showFieldError(field, 'Quantity must be between 1 and 10,000 kg');
                return false;
            }
            break;
        case 'price':
            if (value && (parseFloat(value) < 1 || parseFloat(value) > 1000)) {
                showFieldError(field, 'Price must be between ₹1 and ₹1000 per kg');
                return false;
            }
            break;
        case 'buyer':
            if (value && value.length < 3) {
                showFieldError(field, 'Buyer ID must be at least 3 characters long');
                return false;
            }
            break;
    }

    if (value) {
        field.classList.add('is-valid');
    }

    return true;
}

function showFieldError(field, message) {
    field.classList.add('is-invalid');
    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
}

function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('is-invalid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
}

function updateTradeType(e) {
    const tradeType = e.target.value;
    const form = document.getElementById('trade-form');

    // Update form styling based on trade type
    form.classList.remove('direct-trade', 'auction-trade', 'contract-trade');
    form.classList.add(`${tradeType}-trade`);

    // Show/hide relevant fields based on trade type
    const deliveryDate = document.getElementById('delivery_date').parentNode;
    const tradeTerms = document.getElementById('trade_terms').parentNode;

    if (tradeType === 'contract') {
        deliveryDate.style.display = 'block';
        tradeTerms.style.display = 'block';
    } else if (tradeType === 'auction') {
        deliveryDate.style.display = 'block';
        tradeTerms.style.display = 'none';
    } else {
        deliveryDate.style.display = 'none';
        tradeTerms.style.display = 'none';
    }
}

function previewTrade() {
    // Validate form before preview
    if (!validateTradeForm()) {
        return;
    }

    // Collect form data
    const formData = {
        turmeric_type: document.getElementById('turmeric_type').value,
        quality_grade: document.getElementById('quality_grade').value,
        quantity: document.getElementById('quantity').value,
        price: document.getElementById('price').value,
        buyer_type: document.getElementById('buyer_type').value,
        buyer: document.getElementById('buyer').value,
        delivery_date: document.getElementById('delivery_date').value,
        delivery_location: document.getElementById('delivery_location').value,
        trade_terms: document.getElementById('trade_terms').value,
        trade_type: document.querySelector('input[name="tradeType"]:checked').value
    };

    // Generate preview content
    const previewContent = generateTradePreview(formData);

    // Show modal
    document.getElementById('trade-preview-content').innerHTML = previewContent;
    const modal = new bootstrap.Modal(document.getElementById('tradePreviewModal'));
    modal.show();
}

function generateTradePreview(data) {
    const varietyNames = {
        'alleppey': 'Alleppey Turmeric',
        'erode': 'Erode Turmeric',
        'nizamabad': 'Nizamabad Local',
        'rajapore': 'Rajapore Turmeric',
        'duggirala': 'Duggirala Turmeric',
        'other': 'Other Variety'
    };

    const qualityNames = {
        'premium': 'Premium Grade (A+)',
        'standard': 'Standard Grade (A)',
        'basic': 'Basic Grade (B)'
    };

    const buyerTypeNames = {
        'cooperative': 'Farmer Cooperative',
        'exporter': 'Export Company',
        'processor': 'Processing Unit',
        'retailer': 'Retail Buyer',
        'wholesaler': 'Wholesale Trader'
    };

    const totalValue = parseFloat(data.quantity) * parseFloat(data.price);

    return `
        <div class="trade-preview-content">
            <h6><i class="fas fa-file-contract"></i> Trade Agreement Details</h6>

            <div class="preview-item">
                <strong>Trade Type:</strong> ${data.trade_type.charAt(0).toUpperCase() + data.trade_type.slice(1)} Trade
            </div>

            <div class="preview-item">
                <strong>Product:</strong> ${varietyNames[data.turmeric_type] || data.turmeric_type}
            </div>

            <div class="preview-item">
                <strong>Quality Grade:</strong> ${qualityNames[data.quality_grade] || data.quality_grade}
            </div>

            <div class="preview-item">
                <strong>Quantity:</strong> ${data.quantity} kg
            </div>

            <div class="preview-item">
                <strong>Agreed Price:</strong> ₹${data.price}/kg
            </div>

            <div class="preview-item">
                <strong>Total Value:</strong> ₹${totalValue.toLocaleString()}
            </div>

            <h6><i class="fas fa-user"></i> Buyer Information</h6>

            <div class="preview-item">
                <strong>Buyer Type:</strong> ${buyerTypeNames[data.buyer_type] || data.buyer_type}
            </div>

            <div class="preview-item">
                <strong>Buyer ID:</strong> ${data.buyer}
            </div>

            ${data.delivery_date ? `
            <h6><i class="fas fa-calendar"></i> Delivery Information</h6>

            <div class="preview-item">
                <strong>Delivery Date:</strong> ${new Date(data.delivery_date).toLocaleDateString()}
            </div>

            ${data.delivery_location ? `
            <div class="preview-item">
                <strong>Delivery Location:</strong> ${data.delivery_location}
            </div>
            ` : ''}
            ` : ''}

            ${data.trade_terms ? `
            <h6><i class="fas fa-handshake"></i> Trade Terms</h6>

            <div class="preview-item">
                <strong>Special Terms:</strong> ${data.trade_terms}
            </div>
            ` : ''}

            <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle"></i>
                <strong>Important:</strong> By confirming this trade, you agree to deliver the specified quantity and quality of turmeric at the agreed price. The transaction will be recorded on the blockchain for transparency and immutability.
            </div>
        </div>
    `;
}

function validateTradeForm() {
    let isValid = true;
    const requiredFields = ['turmeric_type', 'quality_grade', 'quantity', 'price', 'buyer_type', 'buyer'];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });

    // Check trade type specific requirements
    const tradeType = document.querySelector('input[name="tradeType"]:checked').value;
    if (tradeType === 'contract' && !document.getElementById('delivery_date').value) {
        showFieldError(document.getElementById('delivery_date'), 'Delivery date is required for contract trades');
        isValid = false;
    }

    return isValid;
}

function confirmTrade() {
    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('tradePreviewModal'));
    modal.hide();

    // Submit the form
    handleTradeSubmit(new Event('submit'));
}