// app/terms/page.tsx
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-6 text-center">
        FitCheck Terms of Service
      </h1>
      <p className="text-sm text-gray-500 text-center mb-10">
        Last updated: November 2, 2025
      </p>

      <section className="space-y-4">
        <p>
          Welcome to FitCheck (“we,” “us,” or “our”). By accessing or using the
          FitCheck app, website, or any related services (collectively, the
          “Services”), you agree to be bound by these Terms of Service
          (“Terms”). If you do not agree, please do not use FitCheck.
        </p>

        <h2 className="text-2xl font-semibold mt-8">1. Eligibility</h2>
        <p>
          You must be at least 13 years old (or the minimum age required in your
          country) to use FitCheck. By using the app, you confirm that you meet
          this requirement and that you can form a binding agreement.
        </p>

        <h2 className="text-2xl font-semibold mt-8">2. Use of the Service</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            FitCheck allows you to upload images and receive AI-powered outfit
            suggestions and styling recommendations.
          </li>
          <li>
            You agree not to upload illegal, harmful, or infringing content.
          </li>
          <li>
            You are responsible for maintaining the confidentiality of your
            account and activity.
          </li>
          <li>
            We may modify or discontinue the Service at any time, without
            notice.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">3. User Content</h2>
        <p>
          You retain ownership of photos and content you upload. By submitting
          content, you grant FitCheck a limited, non-exclusive, worldwide
          license to store, process, and display it for the purpose of operating
          the Service.
        </p>
        <p>
          We may automatically delete inactive or old photos after a reasonable
          period, in line with our
          <a href="/privacy" className="text-blue-600 underline">
            {" "}
            Privacy Policy
          </a>
          .
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          4. Intellectual Property
        </h2>
        <p>
          FitCheck and its logo, design elements, and related marks are the
          property of FitCheck. You may not copy, modify, distribute, or use
          them without written permission.
        </p>

        <h2 className="text-2xl font-semibold mt-8">5. Prohibited Conduct</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Don’t misuse the app (e.g., uploading offensive, pornographic, or
            infringing content).
          </li>
          <li>
            Don’t reverse-engineer or exploit the app’s software or AI outputs.
          </li>
          <li>Don’t interfere with other users or our servers.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">
          6. Disclaimer of Warranties
        </h2>
        <p>
          FitCheck is provided “as is” without warranties of any kind. We don’t
          guarantee that recommendations will be accurate, flawless, or meet
          your expectations. Use the app at your own risk.
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          7. Limitation of Liability
        </h2>
        <p>
          To the fullest extent permitted by law, FitCheck and its affiliates
          shall not be liable for any damages (direct, indirect, incidental, or
          consequential) arising from your use of the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8">8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to FitCheck
          if you violate these Terms or use the Service in a way that could harm
          others or our systems.
        </p>

        <h2 className="text-2xl font-semibold mt-8">9. Changes to Terms</h2>
        <p>
          We may update these Terms periodically. The date at the top of this
          page reflects the latest version. Continued use of FitCheck after
          updates means you accept the new Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8">10. Governing Law</h2>
        <p>
          These Terms are governed by the laws of [Your State/Country], without
          regard to conflict of law principles. Any disputes will be handled in
          the courts located in [Your Jurisdiction].
        </p>

        <h2 className="text-2xl font-semibold mt-8">11. Contact</h2>
        <p>
          For questions or concerns about these Terms, contact us at:
          <br />
          <strong>FitCheck Legal Team</strong>
          <br />
          Email:{" "}
          <a
            href="mailto:legal@fitcheck.app"
            className="text-blue-600 underline"
          >
            legal@fitcheck.app
          </a>
        </p>
      </section>
    </div>
  );
}
