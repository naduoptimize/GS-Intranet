const http = require('http');

http.get('http://localhost:5000/api/users?subsidiaryId=2', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Data:', data);
        process.exit();
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
