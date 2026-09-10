// Initialize Tab Navigation
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupInlinePayment();
  setupSubscriptionFlow();
  setupWebhookMonitor();
});

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(target);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

/**
 * Tab 1: One-Time Inline Checkout Widget
 */
function setupInlinePayment() {
  const form = document.getElementById('inlinePaymentForm');
  const btn = document.getElementById('btnLoadWidget');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  const placeholder = document.getElementById('widgetPlaceholder');
  const widgetStatus = document.getElementById('widgetStatusBadge');
  const linkDetails = document.getElementById('inlineLinkDetails');
  const paymentUrlLink = document.getElementById('inlinePaymentUrlLink');
  const linkIdCode = document.getElementById('inlineLinkIdCode');
  const checkoutContainer = document.getElementById('mamo-checkout-element');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI Loading State
    btn.disabled = true;
    btnText.textContent = 'Generating Link & Embedding...';
    spinner.style.display = 'inline-block';

    const payload = {
      title: document.getElementById('itemTitle').value.trim(),
      amount: parseFloat(document.getElementById('itemAmount').value),
      currency: document.getElementById('currencySelect').value,
      firstName: document.getElementById('custFirstName').value.trim(),
      lastName: document.getElementById('custLastName').value.trim(),
      email: document.getElementById('custEmail').value.trim()
    };

    try {
      const res = await fetch('/api/create-inline-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || data.error || 'Failed to create inline link');
      }

      console.log('Payment Link Received:', data.paymentUrl);

      // Hide placeholder
      placeholder.style.display = 'none';

      // Reset checkout element container
      checkoutContainer.innerHTML = '';

      // Check if MamoPay SDK is loaded
      if (typeof MamoPay === 'function') {
        const mamoPay = new MamoPay();
        // Embed the widget iframe directly into the element
        mamoPay.addIframeToWebsite('mamo-checkout-element', data.paymentUrl);
        
        widgetStatus.className = 'status-indicator active';
        widgetStatus.textContent = 'Widget Active & Embedded';
      } else {
        // Fallback standard iframe embed if SDK script is blocked or offline
        const iframe = document.createElement('iframe');
        iframe.src = data.paymentUrl;
        iframe.style.width = '100%';
        iframe.style.height = '480px';
        iframe.style.border = 'none';
        iframe.setAttribute('allow', 'payment');
        checkoutContainer.appendChild(iframe);

        widgetStatus.className = 'status-indicator active';
        widgetStatus.textContent = 'Widget Embedded (Direct Iframe)';
      }

      // Display metadata
      linkDetails.style.display = 'flex';
      paymentUrlLink.href = data.paymentUrl;
      paymentUrlLink.textContent = data.paymentUrl;
      linkIdCode.textContent = data.linkId;

    } catch (err) {
      console.error('Error generating inline payment widget:', err);
      alert('Error initializing Mamo widget: ' + err.message);
      widgetStatus.className = 'status-indicator waiting';
      widgetStatus.textContent = 'Error loading';
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Generate & Embed Mamo Widget';
      spinner.style.display = 'none';
    }
  });
}

/**
 * Tab 2: Recurring Subscription Flow
 */
function setupSubscriptionFlow() {
  const form = document.getElementById('subscriptionForm');
  const btn = document.getElementById('btnCreateSubscription');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  const placeholder = document.getElementById('subResultPlaceholder');
  const resultCard = document.getElementById('subResultContent');
  const statusBadge = document.getElementById('subStatusBadge');
  const paymentInput = document.getElementById('subPaymentUrlInput');
  const copyBtn = document.getElementById('btnCopySubUrl');
  const checkoutBtn = document.getElementById('subCheckoutLinkBtn');
  const jsonCode = document.querySelector('#subJsonResponse code');

  copyBtn.addEventListener('click', () => {
    if (!paymentInput.value) return;
    navigator.clipboard.writeText(paymentInput.value).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    btn.disabled = true;
    btnText.textContent = 'Contacting Mamo Sandbox...';
    spinner.style.display = 'inline-block';

    const payload = {
      title: 'Pro Plan',
      amount: 49.0,
      currency: 'AED',
      description: 'Pro Plan — AED 49/month',
      frequency: 'monthly',
      frequencyInterval: 1
    };

    try {
      const res = await fetch('/api/create-subscription-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || JSON.stringify(data.error) || 'Failed to create subscription link');
      }

      placeholder.style.display = 'none';
      resultCard.style.display = 'block';

      statusBadge.className = 'status-indicator active';
      statusBadge.textContent = 'Link Active (Monthly Recurring)';

      paymentInput.value = data.paymentUrl;
      checkoutBtn.href = data.paymentUrl;
      jsonCode.textContent = JSON.stringify(data.raw, null, 2);

    } catch (err) {
      console.error('Error creating subscription flow:', err);
      alert('Error creating subscription: ' + err.message);
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Generate Subscription Payment Link';
      spinner.style.display = 'none';
    }
  });
}

/**
 * Tab 3: Webhook Monitor & Logger
 */
function setupWebhookMonitor() {
  const feedEmpty = document.getElementById('webhookFeedEmpty');
  const feedList = document.getElementById('webhookFeedList');
  const badgeCounter = document.getElementById('webhookCountBadge');
  const btnClear = document.getElementById('btnClearLogs');
  const simButtons = document.querySelectorAll('[data-sim]');

  // Trigger test events locally
  simButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const eventType = button.getAttribute('data-sim');
      try {
        await fetch('/api/test-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType })
        });
        fetchWebhookLogs();
      } catch (err) {
        console.error('Failed to trigger simulated webhook:', err);
      }
    });
  });

  // Clear logs button
  btnClear.addEventListener('click', async () => {
    await fetch('/api/clear-webhook-logs', { method: 'POST' });
    fetchWebhookLogs();
  });

  // Poll webhook logs
  async function fetchWebhookLogs() {
    try {
      const res = await fetch('/api/webhook-logs');
      const data = await res.json();
      
      badgeCounter.textContent = data.count || 0;

      if (!data.events || data.events.length === 0) {
        feedEmpty.style.display = 'flex';
        feedList.style.display = 'none';
        feedList.innerHTML = '';
        return;
      }

      feedEmpty.style.display = 'none';
      feedList.style.display = 'flex';
      feedList.innerHTML = '';

      data.events.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'feed-item';

        const eventType = item.eventType || 'event';
        let badgeClass = 'badge-charge-succeeded';
        if (eventType.includes('failed')) badgeClass = 'badge-charge-failed';
        else if (eventType.startsWith('subscription')) badgeClass = 'badge-subscription-succeeded';

        const payloadObj = item.payload || {};
        const pData = payloadObj.data || {};
        const amountStr = pData.amount ? `${pData.amount} ${pData.amount_currency || pData.currency || 'AED'}` : '';
        const idStr = pData.id ? `ID: ${pData.id}` : '';
        const custStr = pData.customer ? (pData.customer.email || '') : '';

        itemEl.innerHTML = `
          <div class="feed-item-header">
            <span class="event-type-badge ${badgeClass}">${escapeHtml(eventType)}</span>
            <span class="feed-item-time">${new Date(item.receivedAt).toLocaleTimeString()} &bull; ${new Date(item.receivedAt).toLocaleDateString()}</span>
          </div>
          <div class="feed-item-body">
            ${amountStr ? `<span><strong>Amount:</strong> ${escapeHtml(amountStr)}</span>` : ''}
            ${idStr ? `<span><strong>Reference:</strong> <code>${escapeHtml(idStr)}</code></span>` : ''}
            ${custStr ? `<span><strong>Customer:</strong> ${escapeHtml(custStr)}</span>` : ''}
          </div>
          <pre class="feed-item-payload"><code>${escapeHtml(JSON.stringify(payloadObj, null, 2))}</code></pre>
        `;
        feedList.appendChild(itemEl);
      });

    } catch (err) {
      console.error('Error fetching webhook logs:', err);
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial fetch and 2.5s polling loop
  fetchWebhookLogs();
  setInterval(fetchWebhookLogs, 2500);
}
