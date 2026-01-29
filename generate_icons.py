#!/usr/bin/env python3
"""
Generate Android launcher icons with logo on dark background
"""
import os
from PIL import Image, ImageDraw

# Dark background color (slate-950)
BG_COLOR = (2, 6, 23)  # #020617

# Icon sizes for different densities
SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

def create_icon_with_logo(size, logo_path, output_path):
    """Create an icon with logo centered on dark background"""
    # Create dark background
    icon = Image.new('RGB', (size, size), BG_COLOR)
    
    # Load and resize logo
    if os.path.exists(logo_path):
        logo = Image.open(logo_path)
        logo = logo.convert('RGBA')
        
        # Calculate size to fit (80% of icon size, maintaining aspect ratio)
        max_logo_size = int(size * 0.8)
        logo.thumbnail((max_logo_size, max_logo_size), Image.Resampling.LANCZOS)
        
        # Center the logo
        x = (size - logo.width) // 2
        y = (size - logo.height) // 2
        
        # Paste logo onto background (with alpha channel support)
        icon.paste(logo, (x, y), logo)
    else:
        print(f"Warning: Logo file not found at {logo_path}, creating solid color icon")
    
    # Save icon
    icon.save(output_path, 'PNG')
    print(f"Created: {output_path} ({size}x{size})")

def main():
    base_dir = 'android/app/src/main/res'
    logo_path = 'public/assets/logo-v2.png'
    
    # If logo-v2.png doesn't exist, try logo.png
    if not os.path.exists(logo_path):
        logo_path = 'public/assets/logo.png'
    
    if not os.path.exists(logo_path):
        print(f"Error: Logo file not found. Tried: public/assets/logo-v2.png and public/assets/logo.png")
        return
    
    # Generate icons for each density
    for density, size in SIZES.items():
        output_dir = os.path.join(base_dir, density)
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate foreground (logo on transparent, will be used with adaptive icon)
        output_path = os.path.join(output_dir, 'ic_launcher_foreground.png')
        create_icon_with_logo(size, logo_path, output_path)
        
        # Generate full launcher icon
        output_path = os.path.join(output_dir, 'ic_launcher.png')
        create_icon_with_logo(size, logo_path, output_path)
        
        # Generate round launcher icon
        output_path = os.path.join(output_dir, 'ic_launcher_round.png')
        icon = Image.new('RGB', (size, size), BG_COLOR)
        if os.path.exists(logo_path):
            logo = Image.open(logo_path)
            logo = logo.convert('RGBA')
            max_logo_size = int(size * 0.8)
            logo.thumbnail((max_logo_size, max_logo_size), Image.Resampling.LANCZOS)
            x = (size - logo.width) // 2
            y = (size - logo.height) // 2
            icon.paste(logo, (x, y), logo)
        
        # Create circular mask
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        
        # Apply circular mask
        output = Image.new('RGB', (size, size), BG_COLOR)
        output.paste(icon, (0, 0), mask)
        output.save(output_path, 'PNG')
        print(f"Created: {output_path} ({size}x{size}, round)")

if __name__ == '__main__':
    try:
        main()
        print("\n✅ Icon generation complete!")
    except ImportError:
        print("Error: PIL/Pillow not installed. Install with: pip3 install Pillow")
    except Exception as e:
        print(f"Error: {e}")
