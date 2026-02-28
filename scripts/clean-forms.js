const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (file.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync(path.join(__dirname, '..', 'app', 'admin'));
let updated = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // We look for any <Input, <Select, or <Textarea and read its entire opening tag
  const tagRegex = /<(Input|Textarea|Select)([\s\S]*?)>/g;
  
  newContent = newContent.replace(tagRegex, (match, tag, rest) => {
    // Check if variant prop is already defined
    if (rest.includes('\bvariant=') || rest.match(/\svariant=/)) {
      // If it has multiple variants by mistake, let's clean it up:
      const variantMatches = rest.match(/\svariant=(["'])(.*?)\1/g);
      if (variantMatches && variantMatches.length > 1) {
         // Keep only the first variant and remove the rest
         let cleanedRest = rest;
         for (let i = 1; i < variantMatches.length; i++) {
            cleanedRest = cleanedRest.replace(variantMatches[i], '');
         }
         return `<${tag}${cleanedRest}>`;
      }
      return match;
    }

    // It doesn't have variant, so add variant="bordered"
    // Handle self-closing vs normal tags
    if (rest.trimEnd().endsWith('/')) {
      const bareRest = rest.trimEnd().slice(0, -1);
      return `<${tag}${bareRest} variant="bordered" />`;
    } else {
      return `<${tag}${rest} variant="bordered">`;
    }
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Cleaned forms in', file);
    updated++;
  }
});

console.log('Files updated:', updated);
