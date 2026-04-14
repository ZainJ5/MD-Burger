export default `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Pre-Bill</title>
  <style>
    @page {
      size: 72mm auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 4px;
      width: 72mm; /* Standard thermal receipt width */
      font-size: 10px;
      line-height: 1.1;
      color: #000;
      font-weight: bold;
    }

    @media print {
      body {
        width: 72mm;
        margin: 0 !important;
        padding: 8px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      * {
        font-weight: bold !important;
      }
    }

    .receipt-container {
      padding: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      background-color: white;
      width: 100%;
      overflow: hidden;
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 2px dashed #000;
    }

    .restaurant-name {
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .restaurant-info {
      font-size: 9px;
      color: #000;
      font-weight: bold;
    }

    .title-container {
      margin: 10px 0;
      text-align: center;
    }

    .receipt-title {
      font-size: 14px;
      font-weight: 900;
      color: white;
      background-color: #000;
      padding: 6px 0;
      letter-spacing: 1px;
      border-radius: 3px;
      text-transform: uppercase;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .order-details {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 6px 0;
      border-bottom: 1px solid #000;
      font-size: 10px;
    }

    .order-details div {
      margin: 2px 0;
    }

    .section-title {
      font-weight: 900;
      font-size: 11px;
      margin-top: 8px;
      margin-bottom: 4px;
      color: #000;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 10px;
    }

    th {
      font-weight: 900;
      text-align: left;
      padding: 4px 2px;
      border-bottom: 1px solid #000;
      text-transform: uppercase;
      font-size: 9px;
      color: #000;
    }

    td {
      padding: 3px 2px;
      border-bottom: 2px dotted #000;
      font-size: 11px;
    }
    
    .item-modifiers {
      font-size: 9px;
      font-style: italic;
      color: #000;
      padding-left: 4px;
      font-weight: bold;
    }

    .item-count {
      margin: 6px 0;
      font-weight: 900;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }

    .summary {
      margin-top: 8px;
      text-align: right;
      padding: 6px;
      border-radius: 3px;
      font-size: 10px;
      border: 1px solid #000;
    }

    .summary div {
      margin: 3px 0;
    }

    .bill-amount {
      background-color: #000;
      color: #fff;
      padding: 6px;
      margin-top: 5px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 900;
    }

    .customer-info {
      margin-top: 10px;
      padding: 8px;
      border: 1px solid #000;
      border-radius: 3px;
      font-size: 10px;
    }

    .customer-info div {
      margin-bottom: 3px;
    }

    .bold {
      font-weight: 900;
      color: #000;
    }

    .text-right {
      text-align: right;
    }

    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: 9px;
      font-weight: bold;
      color: #000;
      padding-top: 6px;
      border-top: 2px dashed #000;
    }

    .print-info {
      font-size: 9px;
      color: #000;
      text-align: center;
      margin-top: 8px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="restaurant-name">Tipu Burger & Broast</div>
    </div>

    <div class="title-container">
      <div class="receipt-title">DELIVERY PRE-BILL</div>
    </div>

    <div class="order-details">
      <div>
        <div><span class="bold">ORDER #: </span>{{orderNumber}}</div>
        <div><span class="bold">TYPE: </span>{{orderType}}</div>
        <div><span class="bold">Customer: </span>{{customerName}}</div>
      </div>
      <div>
        <div><span class="bold">Date: </span>{{currentDate}}</div>
        <div><span class="bold">Time: </span>{{currentTime}}</div>
      </div>
    </div>

    <div class="section-title">ORDER DETAILS</div>
    <table>
      <thead>
        <tr>
          <th>Sr.#</th>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        {{itemRows}}
      </tbody>
    </table>

    <div class="item-count">
      <div><span class="bold">Item(s): </span>{{itemCount}}</div>
      <div><span class="bold">Gross Amount: </span>{{subtotal}}</div>
    </div>

    <div class="summary">
      <div><span class="bold">Sales Tax: </span>{{tax}}</div>
      <div><span class="bold">Delivery Charges: </span>{{deliveryFee}}</div>
      <div><span class="bold">Discount: </span>{{discount}}</div>
      <div class="bill-amount">
        <span class="bold">BILL AMOUNT: </span>{{total}}
      </div>
    </div>

    <div class="customer-info">
      <div><span class="bold">Customer Name: </span>{{customerName}}</div>
      <div><span class="bold">Contact: </span>{{mobileNumber}}</div>
      <div><span class="bold">Alternative: </span>{{alternateMobile}}</div>
      <div><span class="bold">Complete Address: </span>{{deliveryAddress}}</div>
      <div><span class="bold">Nearest Landmark: </span>{{nearestLandmark}}</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 500);
    }
  </script>
</body>
</html>`;