/**
 * Webhook Simulation Script
 * Sends realistic mock Mamo webhook payloads to the local server endpoint.
 * Events tested:
 *  - charge.succeeded
 *  - charge.failed
 *  - subscription.succeeded
 *  - subscription.failed
 */

const http = require('http');

const WEBHOOK_URL = process.env.WEBHOOK_TARGET || 'http://localhost:3000/webhooks/mamo';

const eventsToSimulate = [
  {
    event: 'charge.succeeded',
    created_at: new Date().toISOString(),
    data: {
      id: 'ch_test_98827361',
      amount: 75.0,
      amount_currency: 'AED',
      status: 'captured',
      description: 'Designer Ergonomic Desk Lamp',
      customer: {
        first_name: 'Sarah',
        last_name: 'Al-Hashimi',
        email: 'sarah.h@example.com'
      },
      payment_method: {
        type: 'card',
        last4: '1157',
        brand: 'visa',
        country: 'AE'
      },
      receipt_url: 'https://sandbox.dev.business.mamopay.com/receipt/rcpt_98827361'
    }
  },
  {
    event: 'charge.failed',
    created_at: new Date().toISOString(),
    data: {
      id: 'ch_test_10928374',
      amount: 75.0,
      amount_currency: 'AED',
      status: 'failed',
      failure_code: 'card_declined',
      failure_message: 'Your card has expired or was declined by the issuer.',
      customer: {
        first_name: 'Khalid',
        last_name: 'Mansoor',
        email: 'khalid.m@example.com'
      },
      payment_method: {
        type: 'card',
        last4: '1788',
        brand: 'mastercard'
      }
    }
  },
  {
    event: 'subscription.succeeded',
    created_at: new Date().toISOString(),
    data: {
      id: 'sub_test_48372619',
      title: 'Pro Plan',
      amount: 49.0,
      amount_currency: 'AED',
      status: 'active',
      frequency: 'monthly',
      frequency_interval: 1,
      customer: {
        first_name: 'Fatima',
        last_name: 'Zahra',
        email: 'fatima.z@example.com'
      },
      initial_charge_id: 'ch_test_48372619_01',
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  },
  {
    event: 'subscription.failed',
    created_at: new Date().toISOString(),
    data: {
      id: 'sub_test_77263849',
      title: 'Pro Plan',
      amount: 49.0,
      amount_currency: 'AED',
      status: 'past_due',
      failure_reason: 'recurring_charge_declined',
      customer: {
        first_name: 'David',
        last_name: 'Miller',
        email: 'david.m@example.com'
      }
    }
  }
];

function sendWebhook(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mamo-Webhook-Simulator/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', err => reject(err));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('============================================================');
  console.log(`📡 Simulating Mamo Webhooks to: ${WEBHOOK_URL}`);
  console.log('============================================================\n');

  for (const evt of eventsToSimulate) {
    try {
      console.log(`Sending event: ${evt.event}...`);
      const res = await sendWebhook(evt);
      console.log(`  -> Server response [HTTP ${res.status}]: ${res.body}`);
    } catch (e) {
      console.error(`  -> Failed to send ${evt.event}:`, e.message);
    }
    // Small delay between events
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\nAll simulation events dispatched successfully!');
}

run();
