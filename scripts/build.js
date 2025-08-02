import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function cleanBuild() {
  const indexPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Remove the Tailwind CDN script (multiple possible patterns)
    html = html.replace(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4"><\/script>/g,
      ''
    );
    
    // Also remove any other Tailwind CDN references
    html = html.replace(
      /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g,
      ''
    );
    
    // Clean up any extra whitespace
    html = html.replace(/\n\s*\n/g, '\n');
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ Cleaned build files - removed Tailwind CDN references');
  } else {
    console.log('⚠️  Build directory not found, skipping cleanup');
  }
}

cleanBuild(); 