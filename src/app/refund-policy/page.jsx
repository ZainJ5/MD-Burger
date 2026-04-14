"use client";

import Footer from "../components/Footer";

export default function ReturnsRefundsPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen text-black bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Returns & Refunds Policy</h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 pb-24">
        <div className="space-y-12">
          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">INTRODUCTION</h2>
            <p className="text-gray-700 leading-relaxed">
              Please read through our Return Policy on this page to understand our return procedures and make sure your item is eligible for return. You will have 7 days after an item is delivered to you to notify us that you want to return the item. This means if your item was delivered e.g. on the 5th of the month, you have till the 12th to initiate a return. If the item you wish to return meets the criteria mentioned below, your return can be initiated by calling our helpline at <strong>+923463332682 or +923332245706</strong> which is available 24/7.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">How to Request a Return?</h2>
            <p className="text-gray-700 leading-relaxed">
              You can request to initiate a return by contacting our helpline at <strong>+923463332682 or +923332245706</strong> to confirm that your product is eligible for return. We will explain to you the return procedure and confirm the nearest service provider location where you can drop off the product. Please be prepared to give the following pieces of information: <em>Your order number</em> and <em>The reason for the return</em>, along with the method of refund you prefer and the necessary associated information (bank account number, etc.).
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">
              Can I Request a Replacement Rather Than a Refund?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you prefer to replace your product, just let our Customer Service executive know your choice and we will call you as soon as your initial product has been received and we have checked the availability of the replacement product. If you choose a refund voucher, you can use it to buy a similar or different product using the amount originally paid for the returned item.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">
              If My Returned Product is Not Validated for Return, How Am I Informed?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If your return does not meet the Quality Check criteria, we will call you to explain the issue and send the item(s) back to you. We will arrange the delivery of the item.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">
              If My Refund Gets Validated, How and When Will I Get Reimbursed?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              As a refund, you can either claim a store credit Refund Voucher for the amount you paid for your returned item, or request a complete cash refund. For a store credit voucher, you can use it for a new purchase on the website by deducting the voucher amount from the new total. For a cash refund, the amount will be reimbursed via an online bank transfer or by a cheque mailed to your address. In case of credit card payments, the refund can be processed as a store credit Refund Voucher or via transaction reversal.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">What is a Refund Voucher?</h2>
            <p className="text-gray-700 leading-relaxed">
              A Refund Voucher is a return mechanism equal in value to the amount paid for the returned item. You can use the Refund Voucher at checkout to discount the voucher amount from your next purchase. This voucher can be used on multiple purchases (if the purchase value is less than the voucher amount) until your refund voucher balance reaches Rs. 0. A Refund Voucher is valid for 180 days, after which it will expire and cannot be used.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">How Do I Use My Refund Voucher?</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have been issued a Refund Voucher, you will receive a discount voucher code via email. Please enter this code in the discount code box and click "Apply Code" during checkout at the payment step. A corresponding deduction will then be applied to your total amount.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">
              I Have Bought an Item on Promotion or with a Discount Code. What Amount Will You Refund Me?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For items purchased on sale, if a refund is allowed, the amount refunded will be the exact amount you paid, not the item's original value. For example, if you purchased an item on sale for Rs. 500 (with an original value of Rs. 1000), we will refund you Rs. 500 only. If you purchased an item using a Refund Voucher, we will refund you the sum of the amount paid (including the amount of the Refund Voucher used).
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
