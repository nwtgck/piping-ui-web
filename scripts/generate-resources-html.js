// It is useful for Internet Archive to crawl

const fs = require("fs").promises;
const path = require("path");

(async () => {
  const dirPaths = ["."];
  while (dirPaths.length !== 0) {
    const dirPath = dirPaths.pop();
    const fileNames = await fs.readdir(dirPath);
    for (const fileName of fileNames) {
      const filePath = path.join(dirPath, fileName);
      const stat = await fs.lstat(filePath);
      // If directory
      if (stat.isDirectory()) {
        // Add this directory to search scope
        dirPaths.push(filePath);
      }
      if (!stat.isDirectory()) {
        console.log(`<a href="${filePath}">${filePath}</a><br>`);
      }
    }
  }
})();
