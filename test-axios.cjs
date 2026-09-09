const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', {
            email: 'admin@iot.local',
            password: 'password'
        });
        const token = res.data.access_token;
        
        const updateRes = await axios.put('http://127.0.0.1:8000/api/v1/buckets/1/widgets', {
            widgets: [
                { id: '1', type: 'line', field: 'temperature', title: 'Temperature Chart' }
            ]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(updateRes.data);
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}
test();
