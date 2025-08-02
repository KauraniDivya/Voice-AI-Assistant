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
    
    // Remove the Tailwind CDN script
    html = html.replace(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4"><\/script>/g,
      ''
    );
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ Cleaned build files');
  }
}

cleanBuild(); 