"use client";

import Footer from "../components/Footer";

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col min-h-screen text-black bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Terms and Conditions
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 pb-24">
        <div className="space-y-12">
          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">INTRODUCTION</h2>
            <p className="text-gray-700 leading-relaxed">
              Tipu Burger and Broast welcomes you to one of the largest online shopping portals in Pakistan. These terms and conditions (“Terms and Conditions”) apply not only to the Site, but also to all subsidiaries, divisions, and affiliate-operated websites referencing these Terms and Conditions. Your access to the Site is subject to your understanding and acceptance of these Terms and Conditions. Please discontinue use if you do not accept them. The Site reserves the right to add, remove, change, or modify any clause at any time without prior notice. Changes become effective upon posting. Users are advised to check these Terms and Conditions regularly. Continuing to use the Site after changes constitutes acceptance of the revised Terms and Conditions.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">USE OF THE SITE</h2>
            <p className="text-gray-700 leading-relaxed">
              By using this Site, you confirm that you are either at least 18 years old or accessing it under the supervision of an adult. The Site grants you a non-revocable license to use it, subject to these Terms and Conditions. Use for commercial purposes or on behalf of any third party is prohibited unless you have obtained express permission. Violation of any provision may result in immediate revocation of your license without prior notice. Product representations are provided by vendors and may differ slightly due to product photography. Some services require registration; when registering, you agree to provide correct and up-to-date information and to notify us of any changes. You are responsible for maintaining your account details and any activity originating from your account. Unauthorized access should be reported immediately. By registering, you also consent to receive emails about promotions and offers, with an option to unsubscribe.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">USER SUBMISSIONS</h2>
            <p className="text-gray-700 leading-relaxed">
              All information you provide or submit on the Site (including reviews, comments, suggestions, and questions) becomes our exclusive property. All submissions are non-returnable and cannot be claimed back. While we reserve the right to edit or delete submissions, you must provide accurate details and are not permitted to mislead us with false information.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">ORDER ACCEPTANCE AND PRICING</h2>
            <p className="text-gray-700 leading-relaxed">
              The Site reserves the right to cancel or refuse any order for any reason. Order acceptance may require verification of personal and credit card details, and you may be asked to provide additional identity verification. If you fail to provide the required information within two days of notification, your order will be cancelled. In cases of suspected credit or debit card fraud, orders may be cancelled immediately. While we strive for pricing accuracy, errors may occur; if a product price is displayed inaccurately, the order may be cancelled or you may be contacted for further instructions.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">PAYMENTS PROCEDURE</h2>
            <p className="text-gray-70-relaxed">
              You can choose Pay on Delivery for orders below Rs. 50,000. For orders above Rs. 50,000, the full amount must be paid online via credit card.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">TRADEMARKS AND COPYRIGHTS</h2>
            <p className="text-gray-700 leading-relaxed">
              All intellectual property on this Site (registered or unregistered) remains our property and is protected under Pakistan’s copyright laws and international conventions. This includes, but is not limited to, graphics, software, source code, designs, layouts, logos, videos, photos, content, music, audios, and software compilations.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">LIMITATION OF LIABILITY</h2>
            <p className="text-gray-700 leading-relaxed">
              The Site provides products, content, and services on an “as is” and “as available” basis. We do not make any warranty or representation, whether implied or express, regarding any product, content, or service. By continuing to use the Site, you agree that you do so at your own risk.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">ELECTRONIC COMMUNICATIONS</h2>
            <p className="text-gray-700 leading-relaxed">
              Electronic communications include emails, texts, and any other form of digital communication. By contacting us or submitting a form, you agree to communicate electronically, and acknowledge that such communications satisfy all legal requirements for written agreements, notices, and disclosures.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">APPLICABLE LAW AND JURISDICTION</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms and Conditions are governed by the laws of Pakistan. By using this Site, you agree to submit to the jurisdiction of Pakistan’s courts, waiving any objections to venue.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">TERMINATION</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to terminate these Terms and Conditions immediately, in addition to any other legal or equitable remedies. In such cases, your access to the Site will be revoked and all account details may be deleted. Termination does not affect obligations incurred prior to termination. If you disagree with any part of these Terms and Conditions, you must cease using the Site immediately.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
