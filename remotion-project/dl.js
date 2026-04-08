const https = require('https');
const fs = require('fs');

const url = "https://assets.meshy.ai/df585f1c-0435-4e9a-b846-faf1519a9c44/tasks/019d0fb0-2f40-7e62-bcb5-44efb31d130e/output/model.glb";
const file = fs.createWriteStream("public/chair.glb");

https.get(url, function(response) {
  response.pipe(file);
  file.on("finish", () => {
      file.close();
      console.log("Download Completed!");
  });
}).on("error", (err) => {
  fs.unlink("public/chair.glb");
  console.log("Error: " + err.message);
});
