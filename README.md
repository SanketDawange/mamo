# Mamo: Technical Support Specialist Challenge

This repository contains the complete implementation for the **Mamo Technical Support Specialist Take-Home Exercise**, covering both **Part 1 (Customer Communication)** and **Part 2 (Integration Exercise)**.

---

## 🚀 Quick Start & Demo Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install & Run
```bash
# Install dependencies
npm install

# Start the integration server
npm start
```
The server will start at `http://localhost:3000`.

Open your browser to `http://localhost:3000` to test:
1. **Inline Checkout Widget**: Creates a `link_type: inline` link and mounts Mamo's iframe widget directly on the page without redirect.
2. **Recurring Subscription Flow**: Generates a recurring link (Pro Plan: AED 49/month) and inspects the Mamo subscription object.
3. **Webhook Monitor**: Real-time receiver listening at `/webhooks/mamo` with one-click simulation buttons.

### 2. Run Webhook Simulation (CLI)
In a separate terminal, test the local webhook receiver across all required event types:
```bash
npm run simulate-webhooks
```

---

## 📘 Part 2: Technical Questions (New Teammate Guide)

### Question 1: What happens end-to-end from clicking "Subscribe" to Mamo confirming the first charge?

Here is how the entire flow works from front to back, in plain language:

```
Customer clicks "Subscribe"
       │
       ▼
1. Merchant App calls Mamo API (POST /links)
   - Sends amount (AED 49), currency, title, and subscription rules:
     { "frequency": "monthly", "frequency_interval": 1 }
       │
       ▼
2. Mamo creates Subscription & Payment Link
   - Returns a secure payment URL (example: https://sandbox.dev.business.mamopay.com/pay/...)
   - Customer is directed to Mamo's secure hosted checkout.
       │
       ▼
3. Card Details & 3D Secure Authentication
   - Customer enters card number, CVV, and expiry date.
   - If required (3DS), customer authenticates with an OTP / bank password.
       │
       ▼
4. Payment Processing (Acquiring Network & Card Scheme)
   - Mamo submits the charge to the card network (Visa/Mastercard) and acquiring bank.
   - Bank validates available funds and returns an authorization approval code.
       │
       ▼
5. Subscription Schedule & Customer Profile Created
   - Mamo tokenizes and securely vaults the card details for future automatic billing.
   - The recurring subscription record (MPB-SUB-...) is formally marked active.
   - The first billing cycle is stamped, and next billing date is set to +1 month.
       │
       ▼
6. Confirmation & Webhook Dispatches
   - The customer sees an on-screen success confirmation and receives an email receipt.
   - Mamo's event engine dispatches asynchronous HTTP POST webhooks to the merchant's endpoint:
     • charge.succeeded (confirms initial AED 49 payment collected)
     • subscription.succeeded (confirms the recurring schedule is active)
   - The merchant's backend receives these events, returns 200 OK, and unlocks the subscription in the user's account.
```

---

### Question 2: If a merchant messaged saying *"my customer says they paid but I never got a webhook,"* what would you check first, second, and third?

#### 1st: Check Mamo's Internal Ledger & Webhook Delivery Logs
- **Locate the transaction**: Look up the customer's email, card last-4, or payment link ID in Mamo's dashboard or internal admin tool. Did the payment actually succeed? Often the customer saw a 3DS prompt, closed the tab prematurely, or the transaction was declined, so no successful charge occurred.
- **Inspect Mamo Webhook Dispatch Logs**: If the payment did succeed, check Mamo's event dispatch log for that merchant's webhook URL:
  - Did Mamo attempt to fire the webhook?
  - What was the destination URL?
  - What exact HTTP response code did the merchant's server return (404 Not Found, 500 Server Error, 504 Gateway Timeout, or Connection Refused)?
  - Did Mamo trigger automatic retries?

#### 2nd: Check Merchant Endpoint Reachability, Security & Configuration
- **Endpoint Health & Registration**: Verify that the merchant's webhook URL is active, correctly configured in Mamo with the relevant event checked (charge.succeeded), and not pointing to an old staging URL or localhost.
- **SSL / TLS & Firewalls**: Confirm the endpoint uses a valid, publicly trusted SSL certificate (Mamo requires HTTPS). Check if their firewall (Cloudflare, AWS WAF, Akamai) or IP whitelist is blocking Mamo's outbound webhook IP addresses or user-agent.
- **Immediate Test**: Trigger a test webhook ping from Mamo's dashboard to the merchant's endpoint to see if it receives an immediate 200 OK.

#### 3rd: Check Merchant Application Code & Server Logs
- **HTTP 200 Acknowledgement**: Ensure the merchant's webhook handler responds with an immediate 200 OK before running heavy database queries or background jobs. If their server takes longer than Mamo's timeout threshold, Mamo drops the connection and treats it as a failed delivery.
- **Payload Parsing & CSRF**: Check if their server framework (like Express, Django, Rails) failed to parse the JSON body or rejected the request due to missing CSRF token exemptions or body-parser limits.
- **Server Application Logs**: Ask the merchant to inspect their application error logs at the exact timestamp Mamo dispatched the event to find unhandled exceptions.

---

## 📑 Part 1: Customer Communication Summary

The three customer support replies have been crafted to be concise, human, direct, and conversational, avoiding robotic or over-formal corporate jargon:
- **Ticket A (Payout Delay: Sami)**: Direct and empathetic acknowledgment of cash flow importance. Transparently owns that the issue is in Mamo's processing queue without blaming banks, avoids speculative ETAs, and sets a firm 2-hour update commitment.
- **Ticket B (Live Chat Dispute: GlowTechStore AED 89)**: Natural live-chat tone. Plainly explains Mamo's role as the payment processing technology, clarifies why payment gateways cannot unilaterally pull merchant funds for refunds, escalates to internal Merchant Operations, and provides the cardholder's chargeback rights.
- **Ticket C (Repeated Invoices: Urgent Sunday Deadline)**: Immediate resolution in sentence one (invoices attached), complete personal ownership with zero excuses for internal ticket misrouting, and under 100 words.

Detailed written replies and rationale are available in:
- Markdown format: [PART_1_CUSTOMER_SUPPORT_REPLIES.md](./PART_1_CUSTOMER_SUPPORT_REPLIES.md)
- Submission-ready PDF: [Mamo_Technical_Support_Part_1_Replies.pdf](./Mamo_Technical_Support_Part_1_Replies.pdf)

---

## 🤖 Note on AI Tool Usage

In accordance with the exercise instructions, AI assistance (Claude / Anthropic) was used as a productivity accelerator throughout this challenge in the following ways:
- **Boilerplate & Architecture Scaffolding**: Leveraged AI to quickly generate initial Express server routes, HTML5 tab layout, and modern CSS variables matching Mamo's brand identity.
- **API Documentation Synthesis**: Consulted AI to cross-reference Mamo's Readme API docs and identify specific field constraints (such as valid values for subscription frequency and Mamo's webhook reachability validation).
- **Test Fixtures & Payload Generation**: Used AI to scaffold realistic mock webhook JSON payloads for charge.succeeded, charge.failed, subscription.succeeded, and subscription.failed for the offline simulation script.
- **Personal Review & Direct Testing**: All sandbox API integrations, live HTTP calls against Mamo's sandbox endpoint, iframe embedding, customer response drafting, and technical debugging logic were reviewed, tested, debugged, and validated directly against Mamo's live sandbox environment to ensure 100% correctness and alignment with Mamo's real-world operations.
