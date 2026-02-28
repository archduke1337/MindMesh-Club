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
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // I originally injected `<Input variant="bordered"` into all files.
  // This removes that specific injection across all files, restoring them
  // to just `<Input` etc.
  let newContent = content.replace(/<(Input|Select|Textarea) variant="bordered"/g, '<$1');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Cleaned', file);
  }
});
