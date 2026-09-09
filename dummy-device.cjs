const mqtt = require('mqtt');

// Retrieve arguments
const args = process.argv.slice(2);
const topic = args.length > 0 ? args[0] : 'viki/home/sensor/temp';

// Connect to Mosquitto Broker
const brokerUrl = 'mqtt://test.mosquitto.org:1883';
const client = mqtt.connect(brokerUrl);

console.log(`[Dummy Device] Connecting to broker at ${brokerUrl}...`);

client.on('connect', () => {
    console.log(`[Dummy Device] Connected successfully!`);
    console.log(`[Dummy Device] Publishing data to topic: ${topic}`);
    console.log(`[Dummy Device] Press Ctrl+C to stop.\n`);
    
    // Publish data every 5 seconds
    setInterval(() => {
        // Generate some random dummy sensor data
        const payload = {
            temperature: (20 + Math.random() * 15).toFixed(2), // 20 - 35 C
            humidity: (40 + Math.random() * 30).toFixed(2),    // 40 - 70 %
            voltage: (3.0 + Math.random() * 1.2).toFixed(2)    // 3.0 - 4.2 V
        };

        const message = JSON.stringify(payload);
        
        client.publish(topic, message, (err) => {
            if (err) {
                console.error(`[Dummy Device] Error publishing:`, err);
            } else {
                console.log(`[Dummy Device] Published: ${message}`);
            }
        });
    }, 5000);
});

client.on('error', (err) => {
    console.error(`[Dummy Device] MQTT Connection Error:`, err);
});
