import { LegalPageShell } from "@/features/marketing/legal/LegalPageShell";
import LegalSection from "@/features/marketing/legal/LegalSection";

export default function PrivacyPolicyPage() {
    return (
        <LegalPageShell
            eyebrow="Legal"
            title="Privacy Policy"
            summary="This Privacy Policy explains how Align collects, uses, shares, and protects information when you use our AI space wellness analysis product and related services."
            effectiveDate="April 15, 2026"
            lastUpdated="April 15, 2026"
            currentPageLabel="Privacy"
            pageDescription="Privacy explains what data Align by Alignflow collects, how it is used, and how people can contact the team with rights or requests."
        >
            <LegalSection id="intro" title="Align by Alignflow Privacy Policy">
                <p>
                    Align by Alignflow (&quot;Align,&quot; &quot;Alignflow,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy explains how we collect,
                    use, disclose, and protect information when you use our website, applications, and related
                    services (collectively, the &quot;Services&quot;).
                </p>
                <p>
                    Align is built to help people upload a room photo and receive AI-generated analysis, readings,
                    recommendations, and related content about sleep, focus, calm, comfort, and the emotional feel of
                    home spaces.
                </p>
                <p>
                    By using the Services, you acknowledge that you have read and understood this Privacy Policy.
                </p>
            </LegalSection>

            <LegalSection id="scope" title="1. Scope">
                <p>This Privacy Policy applies to information we collect through:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>our website at alignflow.xyz and other product pages that link to this Privacy Policy;</li>
                    <li>any web application, mobile application, or product page that links to this Privacy Policy;</li>
                    <li>communications with us, including support requests and account-related messages.</li>
                </ul>
                <p>This Privacy Policy does not apply to third-party websites, services, or tools linked from our Services.</p>
            </LegalSection>

            <LegalSection id="collect" title="2. Information We Collect">
                <p>We may collect the following categories of information.</p>
                <p className="font-medium text-foreground">A. Information You Provide Directly</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>your name;</li>
                    <li>email address;</li>
                    <li>login credentials or authentication details, where account features are offered;</li>
                    <li>payment and billing information handled through our payment processors;</li>
                    <li>information you include in forms, questionnaires, support requests, or messages;</li>
                    <li>images, photos, or other content you upload to the Services, including room and interior photos.</li>
                </ul>
                <p className="font-medium text-foreground">B. Information Collected Automatically</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>IP address;</li>
                    <li>device type, browser type, operating system, and language settings;</li>
                    <li>referring URLs and pages viewed;</li>
                    <li>dates and times of access;</li>
                    <li>interaction data, feature usage, session information, crash logs, and performance diagnostics;</li>
                    <li>cookies and similar technologies data.</li>
                </ul>
                <p className="font-medium text-foreground">C. Information Derived from User Content</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>room type or space category;</li>
                    <li>visible furniture, decor, color palette, layout, lighting, clutter level, or spatial characteristics;</li>
                    <li>general AI-generated environmental assessments or recommendations.</li>
                </ul>
                <p>
                    We do not intentionally provide the Services for facial recognition, identity verification, or
                    biometric identification.
                </p>
            </LegalSection>

            <LegalSection id="uploads" title="3. Important Notice About Uploaded Images">
                <p>
                    Because Align analyzes real-world space images, uploaded photos may incidentally contain personal or
                    sensitive details, such as people, faces, children, documents, labels, addresses, screens,
                    health-related items, or religious and personal objects.
                </p>
                <p>
                    Please do not upload photos containing people, children, government IDs, financial documents,
                    medical records, or other sensitive personal information unless strictly necessary. The Services are
                    intended for analysis of spaces, not people.
                </p>
            </LegalSection>

            <LegalSection id="use" title="4. How We Use Information">
                <ul className="list-disc space-y-2 pl-5">
                    <li>to provide, operate, maintain, and improve the Services;</li>
                    <li>to process image uploads and generate AI analysis, reports, and related outputs;</li>
                    <li>to create and manage accounts or temporary session access, where applicable;</li>
                    <li>to process transactions and send transactional notices;</li>
                    <li>to respond to questions, requests, or support inquiries;</li>
                    <li>to monitor performance, troubleshoot issues, and protect security and integrity;</li>
                    <li>to detect, prevent, or investigate fraud, abuse, security incidents, or Terms violations;</li>
                    <li>to comply with legal obligations and enforce agreements;</li>
                    <li>to send service-related communications and marketing communications where permitted by law.</li>
                </ul>
            </LegalSection>

            <LegalSection id="ai" title="5. AI Processing and Third-Party AI Providers">
                <p>
                    We use automated systems, including artificial intelligence and machine learning tools, to analyze
                    uploaded space images and generate outputs.
                </p>
                <p>
                    To provide the Services, we may use third-party model providers, cloud providers, hosting
                    providers, storage providers, and related AI infrastructure or API partners. Your uploads and
                    related prompts, instructions, or metadata may be transmitted to such providers only as reasonably
                    necessary to operate the Services.
                </p>
                <p className="font-medium text-foreground">Default rule</p>
                <p>
                    Unless we specifically state otherwise in the product experience, we do not use your uploaded
                    images for model training or model improvement by default.
                </p>
                <p>
                    If we ever offer an option to allow your content to be used for product improvement, research, or
                    model training, we will present that separately and clearly in the product or another applicable notice.
                </p>
                <p className="font-medium text-foreground">AI limitations</p>
                <p>
                    AI-generated outputs may be inaccurate, incomplete, subjective, or unsuitable for your
                    circumstances. Align provides informational and lifestyle-oriented suggestions only and does not
                    provide professional architectural, engineering, medical, mental health, safety, legal, or
                    financial advice.
                </p>
            </LegalSection>

            <LegalSection id="legal-basis" title="6. Legal Bases for Processing (Where Applicable)">
                <p>
                    If you are located in the European Economic Area, United Kingdom, or another jurisdiction requiring
                    a legal basis, we process personal data on one or more of the following grounds:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>performance of a contract, including providing the Services you request;</li>
                    <li>legitimate interests, such as improving the Services, preventing fraud, and securing systems;</li>
                    <li>compliance with legal obligations;</li>
                    <li>consent, where required by law.</li>
                </ul>
            </LegalSection>

            <LegalSection id="cookies" title="7. Cookies and Similar Technologies">
                <p>
                    We and our service providers may use cookies, pixels, local storage, and similar technologies to
                    keep you signed in, remember preferences, understand usage patterns, maintain security, measure
                    performance and analytics, and support marketing or advertising where permitted.
                </p>
                <p>
                    You can manage cookies through your browser settings. Some parts of the Services may not function
                    properly if cookies are disabled.
                </p>
            </LegalSection>

            <LegalSection id="sharing" title="8. How We Share Information">
                <p>We may share information in the following circumstances:</p>
                <p className="font-medium text-foreground">A. Service Providers and AI Infrastructure Providers</p>
                <p>
                    We share information with vendors and processors that help us operate the Services, such as hosting
                    providers, analytics providers, payment processors, authentication providers, customer support
                    tools, storage providers, security vendors, and AI model or inference providers.
                </p>
                <p className="font-medium text-foreground">B. Business Transfers</p>
                <p>
                    We may disclose information in connection with an actual or proposed merger, acquisition,
                    financing, sale of company assets, bankruptcy, or similar corporate transaction.
                </p>
                <p className="font-medium text-foreground">C. Legal Compliance and Protection</p>
                <p>
                    We may disclose information if we believe doing so is necessary to comply with applicable law,
                    regulation, legal process, or governmental request; enforce our agreements; protect the rights,
                    safety, and security of Align, our users, or others; or detect and prevent fraud, abuse, or
                    security issues.
                </p>
                <p className="font-medium text-foreground">D. With Your Direction or Consent</p>
                <p>We may share information when you direct us to do so or otherwise consent.</p>
                <p>We do not sell your uploaded room photos in exchange for money.</p>
            </LegalSection>

            <LegalSection id="retention" title="9. Data Retention">
                <p>
                    We retain personal information for as long as reasonably necessary for the purposes described in
                    this Privacy Policy, including to provide the Services, comply with legal obligations, resolve
                    disputes, and enforce agreements.
                </p>
                <p>
                    Where practical, we aim to minimize retention of raw uploaded images. Unless otherwise stated in
                    the product interface or required for account functionality, backup integrity, legal obligations,
                    or security purposes, we may delete uploaded images after processing or after a limited retention period.
                </p>
                <p>
                    Derived outputs, logs, and account records may be retained for longer where reasonably necessary
                    for product operation, security, billing, compliance, or abuse prevention.
                </p>
            </LegalSection>

            <LegalSection id="security" title="10. Data Security">
                <p>
                    We use reasonable administrative, technical, and organizational measures designed to protect
                    personal information. However, no system is completely secure, and we cannot guarantee absolute security.
                </p>
                <p>
                    You are responsible for maintaining the confidentiality of your account credentials, if applicable,
                    and for using the Services in a way that avoids unnecessary disclosure of sensitive information.
                </p>
            </LegalSection>

            <LegalSection id="rights" title="11. Your Privacy Rights">
                <p>
                    Depending on where you live, you may have rights regarding your personal information, including the
                    right to know, access, delete, correct, restrict certain processing, withdraw consent where
                    applicable, request portability, and opt out of certain marketing communications.
                </p>
                <p>
                    To exercise your rights, contact us at <a className="underline underline-offset-4" href="mailto:support@alignflow.xyz">support@alignflow.xyz</a>.
                </p>
                <p>
                    We may need to verify your identity before fulfilling a request. We will not discriminate against
                    you for exercising applicable privacy rights.
                </p>
            </LegalSection>

            <LegalSection id="us-rights" title="12. U.S. State Privacy Disclosures">
                <p>
                    If you reside in a U.S. state with an applicable privacy law, you may have additional rights,
                    subject to eligibility and legal exceptions. These may include rights to know, access, delete,
                    correct, or obtain a copy of personal information, as well as rights to opt out of certain types
                    of data sharing, targeted advertising, or profiling.
                </p>
                <p>You may submit requests using the contact information in the Contact Us section below.</p>
            </LegalSection>

            <LegalSection id="california" title="13. California Notice">
                <p>
                    If California law applies to our processing of your personal information, you may have rights under
                    the California Consumer Privacy Act, as amended, including rights to know, delete, correct, and
                    access information about the categories of personal information we collect and the purposes for
                    which it is used.
                </p>
                <p>
                    At or before the point of collection, we provide notice about the categories of personal
                    information collected and the purposes of collection and use. We do not knowingly sell personal
                    information for monetary consideration.
                </p>
            </LegalSection>

            <LegalSection id="children" title="14. Children’s Privacy">
                <p>
                    The Services are not directed to children under 13. We do not knowingly collect personal
                    information from children under 13 without legally required parental consent.
                </p>
                <p>
                    Do not upload photos of children or permit a child under 13 to use the Services. If you believe a
                    child has provided personal information to us, contact us at{" "}
                    <a className="underline underline-offset-4" href="mailto:support@alignflow.xyz">support@alignflow.xyz</a>.
                </p>
            </LegalSection>

            <LegalSection id="international" title="15. International Data Transfers">
                <p>
                    We may process and store information in countries other than the country where you live, including
                    the United States and other jurisdictions where our service providers operate.
                </p>
                <p>
                    Where required by law, we use appropriate safeguards for cross-border transfers of personal data.
                </p>
            </LegalSection>

            <LegalSection id="third-party" title="16. Third-Party Services">
                <p>
                    Our Services may integrate with or link to third-party services. We are not responsible for the
                    privacy, security, or content practices of third parties. Please review their privacy policies separately.
                </p>
            </LegalSection>

            <LegalSection id="changes" title="17. Changes to This Privacy Policy">
                <p>
                    We may update this Privacy Policy from time to time. If we make material changes, we will post the
                    updated version and revise the Last Updated date. Where required by law, we will provide additional notice.
                </p>
            </LegalSection>

            <LegalSection id="contact" title="18. Contact Us">
                <p>If you have questions or requests relating to this Privacy Policy or our privacy practices, contact us at:</p>
                <div className="rounded-[1.5rem] border border-border/70 bg-secondary/20 p-5 text-foreground">
                    <p className="font-medium">Align</p>
                    <p>Address available upon request</p>
                    <p>
                        Email:{" "}
                        <a className="underline underline-offset-4" href="mailto:support@alignflow.xyz">
                            support@alignflow.xyz
                        </a>
                    </p>
                </div>
            </LegalSection>
        </LegalPageShell>
    );
}
