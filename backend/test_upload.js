const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const data = new FormData();
  data.append('title', 'Test Script Document');
  data.append('category', 'Policies');
  data.append('subsidiary_id', 'null');
  data.append('uploaded_by', '1');
  
  // Create a dummy file
  const testFilePath = path.join(__dirname, 'test.txt');
  fs.writeFileSync(testFilePath, 'this is a test file');
  
  data.append('file', fs.createReadStream(testFilePath));

  try {
    const res = await axios.post('http://localhost:5000/api/documents/upload', data, {
      headers: data.getHeaders()
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('FAILED:', err.response ? err.response.data : err.message);
  } finally {
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  }
}

testUpload();
