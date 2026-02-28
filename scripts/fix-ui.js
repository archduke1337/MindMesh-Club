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
  
  // Replace <Input ...> without variant=... with <Input variant="bordered" ...>
  // using a regex that makes sure variant isn't already there.
  // We look for <Input (any characters not containing variant=) >
  let newContent = content.replace(/<(Input|Textarea|Select)\b(?![^>]*\bvariant=)([^>]*?)>/g, '<$1 variant="bordered"$2>');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated', file);
    updated++;
  }
});
console.log('Files updated:', updated);
