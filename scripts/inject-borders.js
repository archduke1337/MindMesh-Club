const fs = require('fs');
const path = require('path');
function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) filelist = walkSync(dirFile, filelist);
    else if (file.endsWith('.tsx')) filelist.push(dirFile);
  });
  return filelist;
}
const files = walkSync(path.join(__dirname, '..', 'app', 'admin'));
let updatedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/<(Input|Textarea|Select)(\s|\n)/g, '<$1 variant="bordered"$2');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Injected variant into', file);
    updatedCount++;
  }
});
console.log('Total files updated:', updatedCount);
