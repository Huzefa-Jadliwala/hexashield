import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
from pathlib import Path

base_url = os.getenv('BASE_URL', 'http://localhost:5173')

def send_reset_password_email(to_email: str, first_name: str, token: str):
    from_email = os.getenv('GMAIL_USER')
    password = os.getenv('GMAIL_PASSWORD')
    subject = "Password Reset Request"
    reset_link = f"{base_url}/reset-password?token={token}"

    base_dir = Path(__file__).resolve().parent  # Current file's directory
    file_path = base_dir.parent / 'templates' / 'reset_password_email.html'

    # Construct the path to the logo image file
    logo_path = base_dir.parent  / 'assets' / 'HexaShield.png'

    with file_path.open('r', encoding='utf-8') as file:
        html_template = file.read()

    # Replace the placeholder with the actual reset link
    body = html_template.replace("{{ reset_link }}", reset_link).replace("{{ first_name }}", first_name)

    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "html"))

    # Attach the logo image to the email
    with open(logo_path, 'rb') as img:
        mime_image = MIMEImage(img.read())
        mime_image.add_header('Content-ID', '<logo>')
        mime_image.add_header('Content-Disposition', 'inline', filename='HexaShield.png')
        msg.attach(mime_image)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(from_email, password)
        text = msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        print("Email sent successfully")
        print(f"Reset link: {reset_link}")  # Print the reset link for testing
        print(f"Reset token: {token}")  # Print the reset token for debugging
    except Exception as e:
        print(f"Failed to send email: {e}")            