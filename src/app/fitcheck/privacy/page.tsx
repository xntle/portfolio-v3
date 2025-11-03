// app/privacy/page.tsx  (Next.js 13+ structure)
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-6 text-center">
        FitCheck Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 text-center mb-10">
        Last updated: November 2, 2025
      </p>

      <section className="space-y-4">
        <p>
          FitCheck (“we,” “us,” or “our”) operates this web and mobile
          application (the “App”). This Privacy Policy explains how we collect,
          use, and protect your information when you use FitCheck’s try-on and
          style recommendation features.
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          1. Information We Collect
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Photos you upload</strong> for virtual try-on and
            personalization.
          </li>
          <li>
            <strong>Basic app usage data</strong> such as device type, browser,
            and feature interactions.
          </li>
          <li>
            <strong>Optional account data</strong> (e.g., email or profile info)
            if you create an account or sign in via Shopify.
          </li>
          <li>
            <strong>Locally stored data</strong> such as cached photo URLs or
            preferences in your device storage.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">2. How We Use Your Data</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Enable FitCheck’s try-on and style recommendation features.</li>
          <li>
            Store your uploaded photos securely and associate them with your
            unique user or device ID.
          </li>
          <li>Improve product recommendations and overall app performance.</li>
          <li>Communicate with you for support or feature updates.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">
          3. Photo Storage & Retention
        </h2>
        <p>
          Uploaded photos are stored securely on our partner servers (e.g., FAL
          storage) and linked to your FitCheck ID so they persist across
          sessions or devices. You can delete your photos at any time from
          within the app or by emailing us at
          <strong> support@fitcheck.app</strong>.
        </p>

        <h2 className="text-2xl font-semibold mt-8">4. Information Sharing</h2>
        <p>
          We do <strong>not sell</strong> your data. We only share limited
          information with service providers that host images, analytics, or
          infrastructure needed to operate FitCheck. These partners are bound by
          confidentiality and security obligations.
        </p>

        <h2 className="text-2xl font-semibold mt-8">5. Cookies & Analytics</h2>
        <p>
          FitCheck may use cookies or analytics tools to understand usage trends
          and improve performance. These tools do not collect or store your
          personal photos.
        </p>

        <h2 className="text-2xl font-semibold mt-8">6. Your Rights</h2>
        <p>
          You may access, update, or request deletion of your personal data at
          any time. Contact us at <strong>privacy@fitcheck.app</strong> for
          assistance. We will respond within the timeframe required by
          applicable laws.
        </p>

        <h2 className="text-2xl font-semibold mt-8">7. Security</h2>
        <p>
          FitCheck uses HTTPS encryption, secure storage, and limited access
          policies to protect your data. While we take reasonable measures, no
          system is perfectly secure.
        </p>

        <h2 className="text-2xl font-semibold mt-8">8. Children’s Privacy</h2>
        <p>
          FitCheck is not intended for children under 13 (or the minimum age in
          your region). We do not knowingly collect personal data from minors.
        </p>

        <h2 className="text-2xl font-semibold mt-8">9. Updates</h2>
        <p>
          We may update this policy periodically. Changes will appear on this
          page with a new “Last updated” date.
        </p>

        <h2 className="text-2xl font-semibold mt-8">10. Contact</h2>
        <p>
          For any privacy-related questions, reach out to:
          <br />
          <strong>FitCheck Privacy Team</strong>
          <br />
          Email:{" "}
          <a
            href="mailto:privacy@fitcheck.app"
            className="text-blue-600 underline"
          >
            thaianle.work@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
