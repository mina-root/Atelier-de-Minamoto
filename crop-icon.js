import Jimp from 'jimp';

async function cropIcon() {
  const image = await Jimp.read('public/illustrations/狂信.PNG');
  const width = image.getWidth();
  const height = image.getHeight();
  
  // Center crop (square)
  const size = Math.min(width, height);
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  
  image.crop(x, y, size, size);
  
  // Save as multiple sizes
  await image.resize(32, 32).write('public/favicon-32x32.png');
  await image.resize(16, 16).write('public/favicon-16x16.png');
  await image.resize(180, 180).write('public/apple-touch-icon.png');
  
  // For SVG, we'll keep the existing one or create a new one based on the image (but SVG from PNG is not ideal)
  // We'll just update index.html to point to the PNGs first.
  
  console.log('Icons generated successfully.');
}

cropIcon().catch(err => {
  console.error(err);
  process.exit(1);
});
