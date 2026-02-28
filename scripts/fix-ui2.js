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

  // We look for any <Input, <Select, or <Textarea and read its entire tag content up to >
  const tagRegex = /<(Input|Textarea|Select)([\s\S]*?)>/g;
  newContent = newContent.replace(tagRegex, (match, tag, rest) => {
    const variantMatches = rest.match(/\bvariant=(["'])(.*?)\1/g);
    
    // if there are multiple variant= declarations
    if (variantMatches && variantMatches.length > 1) {
      // Remove all variant= matches except the last one (or remove the first 'variant="bordered"' we mistakenly added)
      // Since we know we prefixed ' variant="bordered"', we can just replace the first exact match
      const cleanedRest = rest.replace(' variant="bordered"', '');
      return `<${tag}${cleanedRest}>`;
    }
    return match;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed multiple variants in', file);
    updated++;
  }
});

console.log('Files updated:', updated);
