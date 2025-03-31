#!/bin/bash

# Create a simple blue square with text for logo192.png
convert -size 192x192 xc:#3498db -fill white -pointsize 40 -gravity center -annotate 0 "GUEST\nMANAGER" logo192.png

# Create a simple blue square with text for logo512.png
convert -size 512x512 xc:#3498db -fill white -pointsize 100 -gravity center -annotate 0 "GUEST\nMANAGER" logo512.png

echo "Created placeholder icons"
