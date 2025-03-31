# Converting SVG to PNG

To convert the SVG files to PNG format as required for the PWA, you can use one of these methods:

## Using Online Tools
1. Go to https://svgtopng.com/ or similar online converter
2. Upload each SVG file
3. Set the dimensions as specified (e.g., 512x512, 192x192, 96x96)
4. Download the PNG file

## Using Inkscape (Free Software)
1. Open the SVG file in Inkscape
2. Go to File > Export PNG Image
3. Set the dimensions as required
4. Export to the same directory

## Using Adobe Illustrator
1. Open the SVG file in Illustrator
2. Go to File > Export > Export As
3. Choose PNG format and set the dimensions
4. Save in the appropriate location

## Using Command Line (with ImageMagick)
```bash
# Install ImageMagick if not already installed
# Then run:
magick convert -background none -size 512x512 logo512.svg logo512.png
magick convert -background none -size 192x192 logo512.svg logo192.png
# For other icons:
magick convert -background none -size 96x96 shortcuts/add.svg shortcuts/add.png
magick convert -background none -size 96x96 shortcuts/invited.svg shortcuts/invited.png
# etc.
```

Make sure all PNG files are placed in the locations specified in manifest.json.
