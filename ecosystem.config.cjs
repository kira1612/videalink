module.exports = {
  apps: [
    {
      name: 'videalink-mqtt-listener',
      script: './mqtt-listener.cjs',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        MQTT_BROKER_URL: 'mqtt://test.mosquitto.org:1883',
        API_BASE_URL: 'http://127.0.0.1/videalink/backend/public/api/v1',
      },
      env_production: {
        NODE_ENV: 'production',
        // Ganti dengan domain / broker private Anda saat live di VPS
        MQTT_BROKER_URL: 'mqtt://test.mosquitto.org:1883',
        API_BASE_URL: 'http://127.0.0.1/videalink/backend/public/api/v1',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/mqtt-error.log',
      out_file: './logs/mqtt-out.log',
      merge_logs: true
    }
  ]
};
