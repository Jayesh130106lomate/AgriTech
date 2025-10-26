import qrcode
import json
from cryptography.fernet import Fernet
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from datetime import datetime

class TraceabilitySystem:
    def __init__(self):
        # Generate encryption key (in production, this should be stored securely)
        self.key = Fernet.generate_key()
        self.cipher = Fernet(self.key)

    def generate_traceability_qr(self, batch_data, include_logo=False):
        """
        Generate encrypted QR code for product traceability
        :param batch_data: dict containing supply chain information
        :param include_logo: bool to include AgriTech logo
        :return: PIL Image object
        """
        # Encrypt the data
        data_string = json.dumps(batch_data, sort_keys=True)
        encrypted_data = self.cipher.encrypt(data_string.encode())

        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )

        # Add encrypted data
        qr.add_data(encrypted_data.decode())
        qr.make(fit=True)

        # Create QR code image
        qr_image = qr.make_image(fill_color="black", back_color="white").convert('RGB')

        # Add AgriTech branding if requested
        if include_logo:
            qr_image = self._add_branding(qr_image, batch_data)

        return qr_image

    def _add_branding(self, qr_image, batch_data):
        """Add AgriTech branding to QR code"""
        # Create a larger canvas
        size = qr_image.size[0] + 100
        branded_image = Image.new('RGB', (size, size), 'white')
        branded_image.paste(qr_image, (50, 50))

        # Add text branding
        draw = ImageDraw.Draw(branded_image)

        # Try to use a default font, fallback to basic if not available
        try:
            font = ImageFont.truetype("arial.ttf", 20)
            small_font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Add AgriTech branding
        draw.text((size//2, 20), "AgriTech", fill="black", anchor="mm", font=font)
        draw.text((size//2, size-30), f"Batch: {batch_data.get('batch_id', 'N/A')}", fill="black", anchor="mm", font=small_font)
        draw.text((size//2, size-15), "Scan for Traceability", fill="black", anchor="mm", font=small_font)

        return branded_image

    def verify_traceability(self, encrypted_data):
        """
        Verify and decrypt traceability data
        :param encrypted_data: encrypted string from QR code
        :return: dict with decrypted data or None if invalid
        """
        try:
            decrypted = self.cipher.decrypt(encrypted_data.encode())
            data = json.loads(decrypted.decode())
            return data
        except Exception as e:
            print(f"Error decrypting traceability data: {e}")
            return None

    def generate_qr_data_url(self, batch_data, include_logo=False):
        """
        Generate QR code and return as base64 data URL for web display
        :param batch_data: dict containing supply chain information
        :param include_logo: bool to include branding
        :return: data URL string
        """
        qr_image = self.generate_traceability_qr(batch_data, include_logo)

        # Convert to base64
        buffer = io.BytesIO()
        qr_image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"

    def create_batch_qr(self, batch_id, farmer_id, crop_type, quantity, quality_data=None):
        """
        Create a complete batch QR code with all traceability information
        :param batch_id: unique batch identifier
        :param farmer_id: farmer identifier
        :param crop_type: type of crop
        :param quantity: quantity in kg
        :param quality_data: optional quality test results
        :return: QR code image and encrypted data
        """
        batch_data = {
            'batch_id': batch_id,
            'farmer_id': farmer_id,
            'crop_type': crop_type,
            'quantity': quantity,
            'timestamp': str(datetime.now()),
            'quality_data': quality_data or {},
            'traceability_url': f"/supply_chain/trace/{batch_id}",
            'verification_status': 'verified'
        }

        qr_image = self.generate_traceability_qr(batch_data, include_logo=True)
        encrypted_data = self.cipher.encrypt(json.dumps(batch_data).encode()).decode()

        return qr_image, encrypted_data, batch_data