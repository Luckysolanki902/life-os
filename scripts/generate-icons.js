const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Android app icon sizes (mipmap folders)
const iconSizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Android splash screen sizes
const splashSizes = [
  { folder: 'drawable-land-mdpi', width: 480, height: 320 },
  { folder: 'drawable-land-hdpi', width: 800, height: 480 },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { folder: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
  { folder: 'drawable-port-mdpi', width: 320, height: 480 },
  { folder: 'drawable-port-hdpi', width: 480, height: 800 },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { folder: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
];

const sourcePath = path.join(__dirname, '../public/penguin_logo.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  console.log('🐧 Loading penguin_logo.png...');
  const image = await loadImage(sourcePath);
  
  // Generate app icons
  console.log('\n📱 Generating app icons...');
  for (const { folder, size } of iconSizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Draw penguin centered
    ctx.drawImage(image, 0, 0, size, size);
    
    const outputPath = path.join(androidResPath, folder, 'ic_launcher.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Created ${folder}/ic_launcher.png (${size}x${size})`);
    
    // Also create round icon
    const roundOutputPath = path.join(androidResPath, folder, 'ic_launcher_round.png');
    fs.writeFileSync(roundOutputPath, buffer);
    console.log(`✅ Created ${folder}/ic_launcher_round.png (${size}x${size})`);
  }
  
  // Generate splash screens
  console.log('\n🎨 Generating splash screens...');
  for (const { folder, width, height } of splashSizes) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dark background (matching your theme)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate penguin size (30% of smaller dimension)
    const penguinSize = Math.min(width, height) * 0.3;
    const x = (width - penguinSize) / 2;
    const y = (height - penguinSize) / 2;
    
    // Draw penguin centered
    ctx.drawImage(image, x, y, penguinSize, penguinSize);
    
    const outputPath = path.join(androidResPath, folder, 'splash.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Created ${folder}/splash.png (${width}x${height})`);
  }
  
  // Generate foreground for adaptive icons
  console.log('\n🎭 Generating adaptive icon foregrounds...');
  const adaptiveSizes = [
    { folder: 'drawable-mdpi', size: 108 },
    { folder: 'drawable-hdpi', size: 162 },
    { folder: 'drawable-xhdpi', size: 216 },
    { folder: 'drawable-xxhdpi', size: 324 },
    { folder: 'drawable-xxxhdpi', size: 432 },
  ];
  
  for (const { folder, size } of adaptiveSizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Transparent background for foreground layer
    ctx.clearRect(0, 0, size, size);
    
    // Draw penguin
    ctx.drawImage(image, 0, 0, size, size);
    
    const folderPath = path.join(androidResPath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    const outputPath = path.join(folderPath, 'ic_launcher_foreground.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Created ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
