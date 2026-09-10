const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Mamo Sandbox Configuration (from interview assignment resources)
const MAMO_BASE_URL = process.env.MAMO_BASE_URL || 'https://sandbox.dev.business.mamopay.com/manage_api/v1';
const MAMO_API_KEY = process.env.MAMO_API_KEY || 'sk-05f603dd-f4eb-42ed-a9af-c406dd1ebd6f';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for received webhook events (for live UI display)
const webhookEvents = [];

/**
 * Utility function to dispatch authenticated requests to Mamo Sandbox API
 */
function callMamoApi(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${MAMO_BASE_URL}${endpoint}`);
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${MAMO_API_KEY}`,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            reject({ statusCode: res.statusCode, error: parsed });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, error: body });
        }
      });
    });

    req.on('error', (err) => reject({ statusCode: 500, error: err.message }));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// ==========================================
// 1. One-Time Inline Payment Link Endpoint
// ==========================================
app.post('/api/create-inline-link', async (req, res) => {
  try {
    const {
      title = 'Minimal One-Time Item',
      amount = 75,
      currency = 'AED',
      firstName = 'Jane',
      lastName = 'Doe',
      email = 'jane.doe@example.com'
    } = req.body;

    const payload = {
      title: title,
      name: title,
      amount: parseFloat(amount),
      amount_currency: currency,
      link_type: 'inline',
      first_name: firstName,
      last_name: lastName,
      email: email,
      send_customer_receipt: true,
      return_url: `http://localhost:${PORT}/?status=success`,
      failure_return_url: `http://localhost:${PORT}/?status=failed`
    };

    console.log('\n[Mamo API] Creating One-Time Inline Payment Link:', payload);
    const result = await callMamoApi('/links', 'POST', payload);
    
    console.log('[Mamo API] Link Created Successfully:', result.data.id, result.data.payment_url);
    res.json({
      success: true,
      linkId: result.data.id,
      paymentUrl: result.data.payment_url,
      raw: result.data
    });
  } catch (err) {
    console.error('[Mamo API] Error creating inline link:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.error || err.message
    });
  }
});

// ==========================================
// 2. Recurring Subscription Flow Endpoint
// ==========================================
app.post('/api/create-subscription-link', async (req, res) => {
  try {
    const {
      title = 'Pro Plan',
      amount = 49,
      currency = 'AED',
      description = 'Pro Plan — AED 49/month',
      frequency = 'monthly',
      frequencyInterval = 1
    } = req.body;

    const payload = {
      title: title,
      name: title,
      amount: parseFloat(amount),
      amount_currency: currency,
      description: description,
      send_customer_receipt: true,
      subscription: {
        frequency: frequency,
        frequency_interval: parseInt(frequencyInterval, 10)
      }
    };

    console.log('\n[Mamo API] Creating Subscription Payment Link:', payload);
    const result = await callMamoApi('/links', 'POST', payload);

    console.log('[Mamo API] Subscription Link Created Successfully:', result.data.id, result.data.payment_url);
    res.json({
      success: true,
      linkId: result.data.id,
      paymentUrl: result.data.payment_url,
      subscription: result.data.subscription,
      raw: result.data
    });
  } catch (err) {
    console.error('[Mamo API] Error creating subscription link:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.error || err.message
    });
  }
});

// ==========================================
// 3. Webhook Receiver Endpoint
// ==========================================
app.post('/webhooks/mamo', (req, res) => {
  const timestamp = new Date().toISOString();
  const event = req.body;
  const eventType = event.event || event.type || 'unknown.event';

  console.log('\n======================================================');
  console.log(`🔔 [MAMO WEBHOOK RECEIVED] ${timestamp}`);
  console.log(`📌 Event Type: ${eventType}`);
  console.log('📦 Payload Summary:');
  
  if (event.data) {
    console.log(`   - ID: ${event.data.id || 'N/A'}`);
    console.log(`   - Amount: ${event.data.amount || 'N/A'} ${event.data.currency || event.data.amount_currency || ''}`);
    console.log(`   - Status: ${event.data.status || 'N/A'}`);
    console.log(`   - Customer: ${event.data.customer ? event.data.customer.email : (event.data.email || 'N/A')}`);
  }
  
  console.log('📜 Full Payload:');
  console.log(JSON.stringify(event, null, 2));
  console.log('======================================================\n');

  // Add to in-memory store for dashboard inspection
  const recordedEntry = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    receivedAt: timestamp,
    eventType: eventType,
    payload: event
  };
  webhookEvents.unshift(recordedEntry);
  if (webhookEvents.length > 50) webhookEvents.pop();

  // Acknowledge receipt to Mamo with 200 OK
  res.status(200).json({
    status: 'success',
    message: 'Webhook received and processed',
    receivedAt: timestamp
  });
});

// Endpoint to fetch recorded webhook logs in real time
app.get('/api/webhook-logs', (req, res) => {
  res.json({
    count: webhookEvents.length,
    events: webhookEvents
  });
});

// Endpoint to clear recorded webhook logs
app.post('/api/clear-webhook-logs', (req, res) => {
  webhookEvents.length = 0;
  res.json({ success: true });
});

// Endpoint to trigger simulated webhook payloads locally for testing
app.post('/api/test-webhook', (req, res) => {
  const { eventType = 'charge.succeeded' } = req.body;
  const samplePayloads = {
    'charge.succeeded': {
      event: 'charge.succeeded',
      created_at: new Date().toISOString(),
      data: {
        id: 'ch_' + Math.random().toString(36).substring(2, 11),
        amount: 75.0,
        amount_currency: 'AED',
        status: 'captured',
        description: 'Designer Ergonomic Desk Lamp',
        customer: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane.doe@example.com'
        },
        payment_method: {
          type: 'card',
          last4: '1157',
          brand: 'visa'
        }
      }
    },
    'charge.failed': {
      event: 'charge.failed',
      created_at: new Date().toISOString(),
      data: {
        id: 'ch_' + Math.random().toString(36).substring(2, 11),
        amount: 75.0,
        amount_currency: 'AED',
        status: 'failed',
        failure_code: 'insufficient_funds',
        failure_message: 'The card has insufficient funds to complete the transaction.',
        customer: {
          first_name: 'Alex',
          last_name: 'Smith',
          email: 'alex.smith@example.com'
        },
        payment_method: {
          type: 'card',
          last4: '1788',
          brand: 'visa'
        }
      }
    },
    'subscription.succeeded': {
      event: 'subscription.succeeded',
      created_at: new Date().toISOString(),
      data: {
        id: 'sub_' + Math.random().toString(36).substring(2, 11),
        title: 'Pro Plan',
        amount: 49.0,
        amount_currency: 'AED',
        status: 'active',
        frequency: 'monthly',
        frequency_interval: 1,
        customer: {
          first_name: 'Sara',
          last_name: 'Al-Mansoor',
          email: 'sara.m@example.com'
        },
        initial_charge_id: 'ch_' + Math.random().toString(36).substring(2, 11),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    },
    'subscription.failed': {
      event: 'subscription.failed',
      created_at: new Date().toISOString(),
      data: {
        id: 'sub_' + Math.random().toString(36).substring(2, 11),
        title: 'Pro Plan',
        amount: 49.0,
        amount_currency: 'AED',
        status: 'past_due',
        failure_reason: 'card_declined',
        customer: {
          first_name: 'Omar',
          last_name: 'Khatib',
          email: 'omar.k@example.com'
        }
      }
    }
  };

  const payload = samplePayloads[eventType] || samplePayloads['charge.succeeded'];
  
  // Forward to our own webhook handler
  const timestamp = new Date().toISOString();
  console.log('\n[SIMULATED WEBHOOK TRIGGERED]');
  const entry = {
    id: 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    receivedAt: timestamp,
    eventType: payload.event,
    payload: payload,
    simulated: true
  };
  webhookEvents.unshift(entry);
  if (webhookEvents.length > 50) webhookEvents.pop();

  console.log(`🔔 [MAMO WEBHOOK (SIMULATED)] ${timestamp} - Event: ${payload.event}`);
  console.log(JSON.stringify(payload, null, 2));

  res.json({
    success: true,
    triggeredEvent: payload.event,
    entry
  });
});

app.listen(PORT, () => {
  console.log('===========================================================');
  console.log(`🚀 Mamo Integration Server running at http://localhost:${PORT}`);
  console.log(`📡 Webhook Receiver Endpoint: http://localhost:${PORT}/webhooks/mamo`);
  console.log(`🔑 Using Sandbox Base: ${MAMO_BASE_URL}`);
  console.log('===========================================================');
});
