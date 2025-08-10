#!/usr/bin/env python3
"""
Comprehensive design analysis script for Tinambú Tours
"""
import os
from PIL import Image, ImageStat
from collections import Counter
import json

def rgb_to_hex(rgb):
    """Convert RGB tuple to hex string"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def analyze_image_colors(image_path, sample_size=100):
    """Analyze colors in an image with better sampling"""
    try:
        image = Image.open(image_path)
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get image statistics
        stat = ImageStat.Stat(image)
        
        # Sample colors from different regions
        width, height = image.size
        colors = []
        
        # Sample from grid points
        for x in range(0, width, width//10):
            for y in range(0, height, height//10):
                if x < width and y < height:
                    pixel = image.getpixel((x, y))
                    colors.append(pixel)
        
        # Count and filter colors
        color_counter = Counter(colors)
        unique_colors = []
        
        for color, count in color_counter.most_common(20):
            # Filter out pure white, black, and very light grays
            if not (color == (255, 255, 255) or color == (0, 0, 0) or 
                   (245 <= color[0] <= 255 and 245 <= color[1] <= 255 and 245 <= color[2] <= 255)):
                hex_color = rgb_to_hex(color)
                unique_colors.append({
                    'hex': hex_color,
                    'rgb': color,
                    'count': count
                })
        
        return unique_colors[:8]
        
    except Exception as e:
        return []

def analyze_design_system():
    """Analyze the complete design system"""
    base_path = "/media/laura/datos/proyectos/web-paso-centurion-tours"
    designs_path = os.path.join(base_path, "designs")
    
    analysis = {
        'colors': {},
        'components': {},
        'pages': {}
    }
    
    # Analyze style guide
    style_guide_path = os.path.join(designs_path, "style-guide")
    style_files = {
        'colors': 'Color-08-10-2025_09_37_AM.png',
        'typography': 'Tipografía-08-10-2025_09_39_AM.png',
        'themes': 'Aplicación-del-tema-light-y-dark-08-10-2025_09_37_AM.png',
        'shadows': 'Shadow-08-10-2025_09_51_AM.png',
        'rounded': 'Rounded-08-10-2025_09_50_AM.png'
    }
    
    print("🎨 ANALYZING TINAMBÚ DESIGN SYSTEM")
    print("="*50)
    
    for category, filename in style_files.items():
        filepath = os.path.join(style_guide_path, filename)
        if os.path.exists(filepath):
            colors = analyze_image_colors(filepath)
            analysis['colors'][category] = colors
            
            print(f"\n📋 {category.upper()}:")
            for i, color_info in enumerate(colors[:6], 1):
                print(f"  {color_info['hex']} (used {color_info['count']} times)")
    
    # Analyze key components
    components_path = os.path.join(designs_path, "components")
    component_files = {
        'buttons': 'Botones-08-10-2025_09_44_AM.png',
        'cards': 'Cards-y-componentes-08-10-2025_09_43_AM.png',
        'navbar': 'Navbar-08-10-2025_09_47_AM.png',
        'footer': 'Footer-08-10-2025_09_43_AM.png'
    }
    
    print(f"\n🧩 ANALYZING COMPONENTS")
    print("="*30)
    
    for component, filename in component_files.items():
        filepath = os.path.join(components_path, filename)
        if os.path.exists(filepath):
            colors = analyze_image_colors(filepath)
            analysis['components'][component] = colors
            
            print(f"\n🔹 {component.upper()}:")
            for color_info in colors[:4]:
                print(f"  {color_info['hex']}")
    
    # Analyze key pages
    pages_path = os.path.join(designs_path, "public")
    page_dirs = ['home', 'registro_y_login', 'alojamiento']
    
    print(f"\n📄 ANALYZING KEY PAGES")
    print("="*30)
    
    for page_dir in page_dirs:
        page_path = os.path.join(pages_path, page_dir)
        if os.path.exists(page_path):
            # Get first PNG file in directory
            png_files = [f for f in os.listdir(page_path) if f.endswith('.png')]
            if png_files:
                filepath = os.path.join(page_path, png_files[0])
                colors = analyze_image_colors(filepath)
                analysis['pages'][page_dir] = colors
                
                print(f"\n📃 {page_dir.upper()}:")
                for color_info in colors[:4]:
                    print(f"  {color_info['hex']}")
    
    # Generate CSS color variables
    print(f"\n🎯 SUGGESTED CSS COLOR VARIABLES")
    print("="*40)
    
    all_colors = []
    for category in analysis['colors'].values():
        all_colors.extend(category)
    
    # Find most common colors across all designs
    color_frequency = {}
    for color_info in all_colors:
        hex_color = color_info['hex']
        if hex_color in color_frequency:
            color_frequency[hex_color] += color_info['count']
        else:
            color_frequency[hex_color] = color_info['count']
    
    # Sort by frequency
    sorted_colors = sorted(color_frequency.items(), key=lambda x: x[1], reverse=True)
    
    print("\n:root {")
    color_names = ['primary', 'secondary', 'accent', 'neutral-dark', 'neutral-light', 'background', 'surface', 'text']
    
    for i, (hex_color, frequency) in enumerate(sorted_colors[:8]):
        name = color_names[i] if i < len(color_names) else f'color-{i+1}'
        print(f"  --color-{name}: {hex_color};")
    
    print("}")
    
    return analysis

if __name__ == "__main__":
    analysis = analyze_design_system()
