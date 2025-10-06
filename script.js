class QRGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentQRCode = null;
        this.logoImage = null;
    }

    initializeElements() {
        this.urlInput = document.getElementById('urlInput');
        this.logoUpload = document.getElementById('logoUpload');
        this.sizeInput = document.getElementById('sizeInput');
        this.sizeValue = document.getElementById('sizeValue');
        this.errorLevel = document.getElementById('errorLevel');
        this.foregroundColor = document.getElementById('foregroundColor');
        this.backgroundColor = document.getElementById('backgroundColor');
        this.generateBtn = document.getElementById('generateBtn');
        this.qrOutput = document.getElementById('qrOutput');
        this.downloadButtons = document.getElementById('downloadButtons');
        this.downloadPNG = document.getElementById('downloadPNG');
        this.downloadSVG = document.getElementById('downloadSVG');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateQRCode());
        this.sizeInput.addEventListener('input', () => this.updateSizeValue());
        this.logoUpload.addEventListener('change', (e) => this.handleLogoUpload(e));
        this.downloadPNG.addEventListener('click', () => this.downloadQRCode('png'));
        this.downloadSVG.addEventListener('click', () => this.downloadQRCode('svg'));
    }

    updateSizeValue() {
        this.sizeValue.textContent = this.sizeInput.value + 'px';
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.logoImage = new Image();
                this.logoImage.onload = () => {
                    console.log('Logo loaded successfully');
                };
                this.logoImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    async generateQRCode() {
        const url = this.urlInput.value.trim();
        if (!url) {
            alert('Please enter a URL or text');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.textContent = 'Generating...';

        try {
            const size = parseInt(this.sizeInput.value);
            
            // Check if QRCode library is loaded
            if (typeof QRCode === 'undefined') {
                throw new Error('QRCode library not loaded');
            }

            const options = {
                width: size,
                height: size,
                color: {
                    dark: this.foregroundColor.value,
                    light: this.backgroundColor.value
                },
                errorCorrectionLevel: this.errorLevel.value,
                margin: 2
            };

            console.log('Generating QR code with options:', options);

            // Generate QR code using QRCode.js library
            const qrCodeDataURL = await QRCode.toDataURL(url, options);
            console.log('QR code generated successfully');
            
            // Create canvas to add logo if provided
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Draw QR code
            const qrImage = new Image();
            qrImage.crossOrigin = 'anonymous';
            
            qrImage.onload = () => {
                try {
                    ctx.drawImage(qrImage, 0, 0, size, size);

                    // Add logo if provided
                    if (this.logoImage) {
                        this.addLogoToQR(ctx, size);
                    } else {
                        this.displayQRCode(canvas);
                    }
                } catch (error) {
                    console.error('Error drawing QR code:', error);
                    alert('Error processing QR code. Please try again.');
                }
            };
            
            qrImage.onerror = (error) => {
                console.error('Error loading QR code image:', error);
                alert('Error loading QR code. Please try again.');
            };
            
            qrImage.src = qrCodeDataURL;

        } catch (error) {
            console.error('Error generating QR code:', error);
            console.log('Trying fallback method...');
            
            try {
                await this.generateQRCodeFallback(url);
            } catch (fallbackError) {
                console.error('Fallback method also failed:', fallbackError);
                alert('Error generating QR code. Please check your internet connection and try again.');
            }
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = 'Generate QR Code';
        }
    }

    addLogoToQR(ctx, size) {
        const logoSize = Math.floor(size * 0.2); // Logo is 20% of QR code size
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // Add white background for logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

        // Draw logo
        ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize);
        
        this.displayQRCode(ctx.canvas);
    }

    displayQRCode(canvas) {
        this.currentQRCode = canvas;
        
        this.qrOutput.innerHTML = `
            <div class="flex justify-center">
                <img src="${canvas.toDataURL()}" alt="Generated QR Code" class="max-w-full h-auto border border-gray-300 rounded-lg">
            </div>
        `;
        
        this.downloadButtons.classList.remove('hidden');
    }

    downloadQRCode(format) {
        if (!this.currentQRCode) {
            alert('Please generate a QR code first');
            return;
        }

        const url = this.urlInput.value.trim();
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `qr-code-${timestamp}.${format}`;

        if (format === 'png') {
            // Download as PNG
            const link = document.createElement('a');
            link.download = filename;
            link.href = this.currentQRCode.toDataURL('image/png');
            link.click();
        } else if (format === 'svg') {
            // Generate SVG version
            this.generateSVG(url, filename);
        }
    }

    async generateSVG(url, filename) {
        try {
            const size = parseInt(this.sizeInput.value);
            const options = {
                width: size,
                height: size,
                color: {
                    dark: this.foregroundColor.value,
                    light: this.backgroundColor.value
                },
                errorCorrectionLevel: this.errorLevel.value,
                margin: 2
            };

            const svgString = await QRCode.toString(url, { 
                ...options, 
                type: 'svg' 
            });

            // Create blob and download
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const link = document.createElement('a');
            link.download = filename;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Error generating SVG:', error);
            alert('Error generating SVG. Please try again.');
        }
    }

    // Fallback method using a different approach
    async generateQRCodeFallback(url) {
        try {
            const size = parseInt(this.sizeInput.value);
            
            // Create a simple canvas-based QR code
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Fill background
            ctx.fillStyle = this.backgroundColor.value;
            ctx.fillRect(0, 0, size, size);

            // Generate QR code using a simpler method
            const qrCodeDataURL = await QRCode.toDataURL(url, {
                width: size,
                height: size,
                margin: 2,
                color: {
                    dark: this.foregroundColor.value,
                    light: this.backgroundColor.value
                }
            });

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
                
                if (this.logoImage) {
                    this.addLogoToQR(ctx, size);
                } else {
                    this.displayQRCode(canvas);
                }
            };
            img.src = qrCodeDataURL;

        } catch (error) {
            console.error('Fallback QR generation failed:', error);
            throw error;
        }
    }
}

// Initialize the QR Generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QRGenerator();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Auto-resize textarea
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    // Add drag and drop for logo upload
    const logoUpload = document.getElementById('logoUpload');
    const logoContainer = logoUpload.parentElement;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        logoContainer.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        logoContainer.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        logoContainer.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        logoContainer.classList.add('bg-blue-50', 'border-blue-300');
    }

    function unhighlight(e) {
        logoContainer.classList.remove('bg-blue-50', 'border-blue-300');
    }

    logoContainer.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            logoUpload.files = files;
            const event = new Event('change', { bubbles: true });
            logoUpload.dispatchEvent(event);
        }
    }
});
