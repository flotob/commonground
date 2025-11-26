#!/bin/bash

# Check for input file
if [ -z "$1" ]; then
  echo "Usage: $0 <input.svg>"
  exit 1
fi

INPUT_SVG=$1

# Define the sizes required for a typical web manifest.json
SIZES=(
  "16"
  "32"
  "48"
  "64"
  "72"
  "96"
  "120"
  "128"
  "144"
  "152"
  "180"
  "192"
  "384"
  "512"
)

# Create output directory
OUTPUT_DIR="${0%/*}/../public/icons"
mkdir -p $OUTPUT_DIR

# Function to generate icon with given parameters
generate_icon() {
    local size_x=$1
    local size_y=$2
    local corner_radius=$3
    local logo_size=$4
    local input_file=$5
    local output_file=$6

    magick \
        \( -size "${size_x}x${size_y}" xc:none \
           -fill white \
           -draw "roundrectangle 0,0 ${size_x},${size_y} ${corner_radius},${corner_radius}" \) \
        \( "$input_file" -resize "${logo_size}x${logo_size}" \) -gravity center -composite \
        -background none \
        "$output_file"
}

# Convert SVG to PNG using ImageMagick at the specified sizes
for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$OUTPUT_DIR/${SIZE}.png"
    rm -f $OUTPUT_FILE
    echo "Generating icon with size ${SIZE}x${SIZE} -> $OUTPUT_FILE"
    
    # Calculate 80% of the size for the logo (making it 20% smaller)
    LOGO_SIZE=$(( SIZE * 60 / 100 ))
    # Calculate corner radius (adjust the divisor to change roundness)
    CORNER_RADIUS=$(( SIZE / 8 ))
    
    generate_icon $SIZE $SIZE $CORNER_RADIUS $LOGO_SIZE "$INPUT_SVG" "$OUTPUT_FILE"
done

# email_logo, favicon and preview
OUTPUT_FILE="$OUTPUT_DIR/email_logo.png"
rm -f $OUTPUT_FILE
echo "Generating email_logo -> $OUTPUT_FILE"
SIZE=161
LOGO_SIZE=$(( SIZE * 60 / 100 ))
CORNER_RADIUS=$(( SIZE / 8 ))
generate_icon $SIZE $SIZE $CORNER_RADIUS $LOGO_SIZE "$INPUT_SVG" "$OUTPUT_FILE"

OUTPUT_FILE="$OUTPUT_DIR/favicon.png"
rm -f $OUTPUT_FILE
echo "Generating favicon -> $OUTPUT_FILE"
SIZE=192
LOGO_SIZE=$(( SIZE * 60 / 100 ))
CORNER_RADIUS=$(( SIZE / 8 ))
generate_icon $SIZE $SIZE $CORNER_RADIUS $LOGO_SIZE "$INPUT_SVG" "$OUTPUT_FILE"

OUTPUT_FILE="$OUTPUT_DIR/preview.png"
rm -f $OUTPUT_FILE
echo "Generating preview -> $OUTPUT_FILE"
SIZE_X=1201
SIZE_Y=630
LOGO_SIZE=$(( SIZE_Y * 60 / 100 ))
CORNER_RADIUS=$(( SIZE_Y / 8 ))
generate_icon $SIZE_X $SIZE_Y $CORNER_RADIUS $LOGO_SIZE "$INPUT_SVG" "$OUTPUT_FILE"

echo "All icons generated and saved in the '$OUTPUT_DIR' directory."