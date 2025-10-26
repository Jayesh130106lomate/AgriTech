document.addEventListener('DOMContentLoaded', function() {
    let html5QrCode = null;
    let isScanning = false;

    // Initialize QR scanner
    initializeQRScanner();

    // Setup event listeners
    setupEventListeners();

    // Setup file upload
    setupFileUpload();

    function initializeQRScanner() {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    function setupEventListeners() {
        // Scan control buttons
        document.getElementById('start-scan').addEventListener('click', startScanning);
        document.getElementById('stop-scan').addEventListener('click', stopScanning);

        // Manual verification
        document.getElementById('verify-batch').addEventListener('click', verifyBatchManually);

        // Enter key support for manual entry
        document.getElementById('batch-id-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyBatchManually();
            }
        });
    }

    function setupFileUpload() {
        console.log('Setting up file upload...');

        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('qr-file-input');
        const uploadBtn = document.getElementById('upload-btn');
        const previewDiv = document.getElementById('upload-preview');
        const previewImage = document.getElementById('preview-image');
        const processBtn = document.getElementById('process-upload');
        const cancelBtn = document.getElementById('cancel-upload');

        console.log('Elements found:', {
            uploadArea: !!uploadArea,
            fileInput: !!fileInput,
            uploadBtn: !!uploadBtn,
            previewDiv: !!previewDiv,
            previewImage: !!previewImage,
            processBtn: !!processBtn,
            cancelBtn: !!cancelBtn
        });

        // Upload button click
        uploadBtn.addEventListener('click', () => {
            console.log('Upload button clicked');
            fileInput.click();
        });

        // Also allow clicking on the upload area
        uploadArea.addEventListener('click', (e) => {
            // Only trigger if not clicking on the button itself
            if (e.target !== uploadBtn && !uploadBtn.contains(e.target)) {
                console.log('Upload area clicked');
                fileInput.click();
            }
        });

        // File input change
        fileInput.addEventListener('change', handleFileSelect);

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        // Process button click
        processBtn.addEventListener('click', processUploadedQR);

        // Cancel button click
        cancelBtn.addEventListener('click', cancelUpload);

        function handleFileSelect(e) {
            console.log('File selected:', e.target.files);
            const file = e.target.files[0];
            if (file) {
                console.log('Processing file:', file.name, file.type, file.size);
                handleFile(file);
            } else {
                console.log('No file selected');
            }
        }

        function handleFile(file) {
            console.log('Handling file:', file.name, file.type);
            if (!file.type.startsWith('image/')) {
                showError('Please select a valid image file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                console.log('File loaded, setting preview');
                previewImage.src = e.target.result;
                previewDiv.style.display = 'block';
                uploadArea.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }

        function cancelUpload() {
            previewDiv.style.display = 'none';
            uploadArea.style.display = 'block';
            fileInput.value = '';
            previewImage.src = '';
        }
    }

    async function processUploadedQR() {
        const previewImage = document.getElementById('preview-image');

        if (!previewImage.src) {
            showError('No image selected for processing.');
            return;
        }

        showLoading('Processing uploaded QR code...');

        try {
            // Create a temporary Html5Qrcode instance for file scanning
            const fileScanner = new Html5Qrcode("hidden-reader");

            const imageFile = await urlToFile(previewImage.src, 'qr-code.png', 'image/png');

            // Create a hidden element for the reader
            const hiddenReader = document.createElement('div');
            hiddenReader.id = 'hidden-reader';
            hiddenReader.style.display = 'none';
            document.body.appendChild(hiddenReader);

            // Scan the file with proper callback handling
            const qrResult = await new Promise((resolve, reject) => {
                fileScanner.scanFile(imageFile, false) // false = don't show progress
                    .then(decodedText => {
                        resolve(decodedText);
                    })
                    .catch(error => {
                        reject(error);
                    });
            });

            // Clean up
            fileScanner.clear();
            document.body.removeChild(hiddenReader);

            console.log('QR Code decoded from image:', qrResult);
            processQRCode(qrResult);

        } catch (error) {
            console.error('Error processing uploaded QR:', error);
            showError('Failed to process the uploaded image. Please try again.');
        }
    }

    // Helper function to convert data URL to File object
    function urlToFile(url, filename, mimeType) {
        return fetch(url)
            .then(res => res.arrayBuffer())
            .then(buf => new File([buf], filename, { type: mimeType }));
    }

    async function startScanning() {
        if (isScanning) return;

        try {
            isScanning = true;
            document.getElementById('start-scan').disabled = true;
            document.getElementById('stop-scan').disabled = false;

            // Clear previous results
            clearResults();

            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                console.log('QR Code detected:', decodedText);
                stopScanning();
                processQRCode(decodedText);
            };

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback
            );

        } catch (err) {
            console.error('Error starting QR scanner:', err);
            showError('Failed to start camera. Please check permissions.');
            resetScannerButtons();
        }
    }

    function stopScanning() {
        if (!isScanning) return;

        try {
            html5QrCode.stop().then(() => {
                console.log('QR scanner stopped');
                isScanning = false;
                resetScannerButtons();
            }).catch((err) => {
                console.error('Error stopping scanner:', err);
            });
        } catch (err) {
            console.error('Error stopping scanner:', err);
            isScanning = false;
            resetScannerButtons();
        }
    }

    function resetScannerButtons() {
        document.getElementById('start-scan').disabled = false;
        document.getElementById('stop-scan').disabled = true;
    }

    async function processQRCode(qrData) {
        console.log('Processing QR code data:', qrData);

        // Show loading
        showLoading('Verifying QR code...');

        try {
            // Try to verify as encrypted data first
            const verifyResponse = await fetch('/api/verify_qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ encrypted_data: qrData })
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.verified) {
                displayVerificationResults(verifyResult.data, true);
            } else {
                // Try as batch ID
                await verifyBatchId(qrData);
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            showError('Failed to verify QR code. Please try again.');
        }
    }

    async function verifyBatchManually() {
        const batchId = document.getElementById('batch-id-input').value.trim();
        if (!batchId) {
            showError('Please enter a Batch ID');
            return;
        }

        await verifyBatchId(batchId);
    }

    async function verifyBatchId(batchId) {
        showLoading('Verifying batch...');

        try {
            const response = await fetch(`/supply_chain/trace/${batchId}`);
            const data = await response.json();

            if (response.ok && data.trace && data.trace.length > 0) {
                displayVerificationResults(data.trace[0], true);
            } else {
                showError('Batch not found or invalid Batch ID');
            }
        } catch (error) {
            console.error('Error verifying batch:', error);
            showError('Failed to verify batch. Please try again.');
        }
    }

    function displayVerificationResults(data, verified) {
        const resultsDiv = document.getElementById('verification-results');
        const statusDiv = document.getElementById('verification-status');
        const detailsDiv = document.getElementById('product-details');
        const timelineDiv = document.getElementById('supply-chain-timeline');

        // Show results section
        resultsDiv.style.display = 'block';

        // Set status
        if (verified) {
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Product Verified Successfully!';
        } else {
            statusDiv.className = 'alert alert-danger';
            statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Verification Failed';
            return;
        }

        // Display product details
        const supplyChain = data.supply_chain || {};
        detailsDiv.innerHTML = `
            <h4 class="text-primary mb-3">
                <i class="fas fa-box"></i> Product Details
            </h4>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="detail-item">
                        <strong>Batch ID:</strong> ${supplyChain.batch_id || 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="detail-item">
                        <strong>Crop Type:</strong> ${data.crop_type || supplyChain.crop_type || 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="detail-item">
                        <strong>Quantity:</strong> ${data.quantity || 0} kg
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="detail-item">
                        <strong>Quality Grade:</strong>
                        <span class="badge bg-${getQualityColor(supplyChain.quality_grade)}">
                            ${supplyChain.quality_grade || 'standard'}
                        </span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="detail-item">
                        <strong>Farm Location:</strong> ${supplyChain.farm_location || 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="detail-item">
                        <strong>Harvest Date:</strong> ${supplyChain.harvest_date || 'N/A'}
                    </div>
                </div>
            </div>

            ${supplyChain.certifications && supplyChain.certifications.length > 0 ?
                `<div class="mt-3">
                    <strong>Certifications:</strong>
                    ${supplyChain.certifications.map(cert =>
                        `<span class="badge bg-info me-1">${cert}</span>`
                    ).join('')}
                </div>` : ''
            }
        `;

        // Display supply chain timeline
        timelineDiv.innerHTML = `
            <h4 class="text-primary mb-3">
                <i class="fas fa-route"></i> Supply Chain Journey
            </h4>
            <div class="timeline">
                ${generateTimelineHTML(supplyChain)}
            </div>
        `;

        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    function generateTimelineHTML(supplyChain) {
        const steps = [];

        // Farm step
        if (supplyChain.farm_location) {
            steps.push({
                icon: 'fas fa-tractor',
                title: 'Farm Production',
                description: `${supplyChain.farm_location} - Harvested on ${supplyChain.harvest_date || 'N/A'}`,
                status: 'completed'
            });
        }

        // Processing steps
        if (supplyChain.processing_steps && supplyChain.processing_steps.length > 0) {
            supplyChain.processing_steps.forEach(step => {
                steps.push({
                    icon: 'fas fa-industry',
                    title: 'Processing',
                    description: step,
                    status: 'completed'
                });
            });
        }

        // Transport step
        if (supplyChain.transport_info) {
            steps.push({
                icon: 'fas fa-truck',
                title: 'Transportation',
                description: `Via ${supplyChain.transport_info.vehicle || 'truck'} at ${supplyChain.transport_info.temperature || 'room temp'}`,
                status: 'completed'
            });
        }

        // Storage step
        if (supplyChain.storage_conditions) {
            steps.push({
                icon: 'fas fa-warehouse',
                title: 'Storage',
                description: `Humidity: ${supplyChain.storage_conditions.humidity || 'N/A'}, Temperature: ${supplyChain.storage_conditions.temperature || 'N/A'}`,
                status: 'completed'
            });
        }

        // Generate HTML
        return steps.map((step, index) => `
            <div class="timeline-item">
                <div class="timeline-marker ${step.status}">
                    <i class="${step.icon}"></i>
                </div>
                <div class="timeline-content">
                    <h5>${step.title}</h5>
                    <p class="mb-0">${step.description}</p>
                </div>
            </div>
        `).join('');
    }

    function getQualityColor(grade) {
        const colors = {
            'premium': 'success',
            'standard': 'primary',
            'basic': 'warning',
            'poor': 'danger'
        };
        return colors[grade] || 'secondary';
    }

    function showLoading(message) {
        const resultsDiv = document.getElementById('verification-results');
        const statusDiv = document.getElementById('verification-status');

        resultsDiv.style.display = 'block';
        statusDiv.className = 'alert alert-info';
        statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;

        document.getElementById('product-details').innerHTML = '';
        document.getElementById('supply-chain-timeline').innerHTML = '';
    }

    function showError(message) {
        const resultsDiv = document.getElementById('verification-results');
        const statusDiv = document.getElementById('verification-status');

        resultsDiv.style.display = 'block';
        statusDiv.className = 'alert alert-danger';
        statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

        document.getElementById('product-details').innerHTML = '';
        document.getElementById('supply-chain-timeline').innerHTML = '';
    }

    function clearResults() {
        document.getElementById('verification-results').style.display = 'none';
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (html5QrCode && isScanning) {
            html5QrCode.stop();
        }
    });
});