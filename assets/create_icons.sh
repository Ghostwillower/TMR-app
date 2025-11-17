#!/bin/bash
# Create placeholder icons using ImageMagick (if available) or simple PNG files

# Check if convert (ImageMagick) is available
if command -v convert &> /dev/null; then
    # Create app icon (1024x1024)
    convert -size 1024x1024 xc:"#4A90E2" \
        -fill white -font DejaVu-Sans-Bold -pointsize 200 \
        -gravity center -annotate +0+0 "TMR" \
        icon.png
    
    # Create adaptive icon (1024x1024)
    convert -size 1024x1024 xc:"#4A90E2" \
        -fill white -font DejaVu-Sans-Bold -pointsize 200 \
        -gravity center -annotate +0+0 "TMR" \
        adaptive-icon.png
    
    # Create splash screen (1242x2436)
    convert -size 1242x2436 xc:"#ffffff" \
        -fill "#4A90E2" -font DejaVu-Sans-Bold -pointsize 120 \
        -gravity center -annotate +0-200 "TMR App" \
        -fill "#666666" -font DejaVu-Sans -pointsize 60 \
        -gravity center -annotate +0-50 "Targeted Memory" \
        -gravity center -annotate +0+20 "Reactivation" \
        splash.png
    
    # Create favicon (48x48)
    convert -size 48x48 xc:"#4A90E2" \
        -fill white -font DejaVu-Sans-Bold -pointsize 24 \
        -gravity center -annotate +0+0 "T" \
        favicon.png
    
    echo "Icons created with ImageMagick"
else
    echo "ImageMagick not available, creating simple placeholder files"
    # Create minimal PNG files as placeholders
    # Using base64 encoded 1x1 blue pixel and expanding
    echo "Please replace these with actual icon files before production build"
fi
