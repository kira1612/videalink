const mqtt = require('mqtt');

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node mqtt-publish.cjs <topic> <message>');
    process.exit(1);
}

const topic = args[0];
const message = args[1];
const brokerUrl = 'mqtt://test.mosquitto.org:1883';

const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    client.publish(topic, message, { qos: 0 }, (err) => {
        if (err) {
            console.error('Error publishing:', err);
            process.exit(1);
        } else {
            console.log(`Published to ${topic}`);
            client.end();
            process.exit(0);
        }
    });
});

client.on('error', (err) => {
    console.error('Connection error:', err);
    client.end();
    process.exit(1);
});
