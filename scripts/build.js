import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function cleanBuild() {
  const indexPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Build completed successfully');
  } else {
    console.log('⚠️  Build directory not found');
  }
}

cleanBuild(); 