#!/usr/bin/env python3
"""
Script to extract color information from design PNG files
"""
import os
import sys
from PIL import Image
from collections import Counter
import colorsys

def rgb_to_hex(rgb):
    """Convert RGB tuple to hex string"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def get_dominant_colors(image_path, num_colors=10):
    """Extract dominant colors from an image"""
    try:
        image = Image.open(image_path)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize image to speed up processing
        image = image.resize((150, 150))
        
        # Get all pixels
        pixels = list(image.getdata())
        
        # Count pixel frequencies
        pixel_count = Counter(pixels)
        
        # Get most common colors
        dominant_colors = pixel_count.most_common(num_colors)
        
        # Convert to hex and filter out very similar colors
        hex_colors = []
        for color, count in dominant_colors:
            hex_color = rgb_to_hex(color)
            # Skip white, black, and very light/dark grays (likely background)
            if color != (255, 255, 255) and color != (0, 0, 0):
                # Check if color is not too similar to existing colors
                is_unique = True
                for existing_hex in hex_colors:
                    existing_rgb = tuple(int(existing_hex[i:i+2], 16) for i in (1, 3, 5))
                    # Simple color distance check
                    distance = sum(abs(a - b) for a, b in zip(color, existing_rgb))
                    if distance < 30:  # Threshold for similarity
                        is_unique = False
                        break
                
                if is_unique:
                    hex_colors.append(hex_color)
        
        return hex_colors[:8]  # Return top 8 unique colors
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return []

def analyze_design_files():
    """Analyze all design files and extract color information"""
    base_path = "/media/laura/datos/proyectos/web-paso-centurion-tours"
    style_guide_path = os.path.join(base_path, "designs", "style-guide")
    
    print("=== TINAMBÚ DESIGN SYSTEM COLOR ANALYSIS ===\n")
    
    # Analyze color guide specifically
    color_file = os.path.join(style_guide_path, "Color-08-10-2025_09_37_AM.png")
    if os.path.exists(color_file):
        print("🎨 COLOR PALETTE (from Color guide):")
        colors = get_dominant_colors(color_file)
        for i, color in enumerate(colors, 1):
            print(f"  Color {i}: {color}")
        print()
    
    # Analyze other style guide files
    style_files = [
        "Tipografía-08-10-2025_09_39_AM.png",
        "Aplicación-del-tema-light-y-dark-08-10-2025_09_37_AM.png",
        "Shadow-08-10-2025_09_51_AM.png"
    ]
    
    for filename in style_files:
        filepath = os.path.join(style_guide_path, filename)
        if os.path.exists(filepath):
            print(f"📋 {filename.split('-')[0].upper()}:")
            colors = get_dominant_colors(filepath, 5)
            for color in colors:
                print(f"  {color}")
            print()

if __name__ == "__main__":
    analyze_design_files()
