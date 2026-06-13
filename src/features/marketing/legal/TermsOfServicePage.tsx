import { LegalPageShell } from "@/features/marketing/legal/LegalPageShell";
import LegalSection from "@/features/marketing/legal/LegalSection";

export default function TermsOfServicePage() {
    return (
        <LegalPageShell
            eyebrow="Legal"
            title="Terms of Service"
            summary="These Terms govern your access to and use of Align by Alignflow’s website, application flows, content, and AI space wellness analysis services."
            effectiveDate="April 15, 2026"
            lastUpdated="April 15, 2026"
            currentPageLabel="Terms"
            pageDescription="Terms defines the rules for using Align by Alignflow, including account access, acceptable use, disclaimers, and service limitations."
        >
            <LegalSection id="intro" title="Align by Alignflow Terms of Service">
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern your access to and use of the websites, applications,
                    content, and services made available by Align by Alignflow (&quot;Align,&quot; &quot;Alignflow,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
                </p>
                <p>By accessing or using the Services, you agree to these Terms. If you do not agree, do not use the Services.</p>
            </LegalSection>

            <LegalSection id="eligibility" title="1. Eligibility">
                <p>
                    You must be at least 18 years old, or the age of majority in your jurisdiction, to use the
                    Services. If you are under the age of majority but legally permitted to use the Services, you may
                    do so only with the consent and supervision of a parent or legal guardian.
                </p>
                <p>The Services are not directed to children under 13.</p>
            </LegalSection>

            <LegalSection id="services" title="2. The Services">
                <p>
                    Align provides tools that allow users to upload images and related information about indoor or home
                    spaces and receive AI-generated analysis, readings, recommendations, scores, reports, visual
                    outputs, and related content.
                </p>
                <p>
                    The Services are provided for informational, lifestyle, and general wellness-oriented purposes only.
                </p>
            </LegalSection>

            <LegalSection id="third-party-tech" title="3. Third-Party Models and Technology">
                <p>
                    To operate the Services, Align may rely on third-party service providers, including cloud
                    providers, payment providers, analytics providers, storage providers, and third-party AI model or
                    inference providers.
                </p>
                <p>
                    You acknowledge and agree that your submitted content, prompts, and related data may be processed
                    through such providers as reasonably necessary to provide the Services.
                </p>
            </LegalSection>

            <LegalSection id="professional-advice" title="4. No Professional Advice; Reports Are for Informational Use Only">
                <p>
                    Align is not a substitute for professional advice or services. The Services, including any reports,
                    scores, recommendations, assessments, visualizations, or other outputs, are provided for
                    informational purposes only.
                </p>
                <p>The Services do not provide:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>architectural or engineering advice;</li>
                    <li>licensed interior design services where such licensing is required;</li>
                    <li>building code compliance advice;</li>
                    <li>construction, electrical, plumbing, or structural advice;</li>
                    <li>health, mental health, medical, therapeutic, legal, tax, or financial advice;</li>
                    <li>emergency, safety-critical, or compliance advice.</li>
                </ul>
                <p>
                    You are solely responsible for evaluating whether any output is appropriate for your space and
                    circumstances. Always consult qualified professionals before making structural, electrical,
                    safety-related, legal, health-related, or other material decisions.
                </p>
                <p>
                    Align does not assume responsibility or liability for decisions you make, actions you take,
                    purchases you make, changes you implement, or losses or damages resulting from reliance on any
                    report or output.
                </p>
            </LegalSection>

            <LegalSection id="accounts" title="5. Account Registration">
                <p>
                    Some features may be available without creating an account. Other features may require an account.
                    If you create an account, you agree to provide accurate, current, and complete information and to
                    keep it updated.
                </p>
                <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all
                    activities that occur under your account.
                </p>
            </LegalSection>

            <LegalSection id="acceptable-use" title="6. Acceptable Use">
                <p>You agree not to use the Services to:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>violate any law or regulation;</li>
                    <li>infringe, misappropriate, or violate any third-party rights;</li>
                    <li>upload content you do not have the right to use;</li>
                    <li>upload content containing another person’s personal information without appropriate authority;</li>
                    <li>upload images of children, IDs, financial statements, medical records, or other highly sensitive information unless strictly necessary and lawfully provided;</li>
                    <li>submit content intended for facial recognition, identity verification, biometric identification, or surveillance;</li>
                    <li>upload malicious code, spam, misleading content, or harmful material;</li>
                    <li>interfere with or disrupt the Services or security features;</li>
                    <li>scrape, copy, reverse engineer, decompile, or use automated means to extract data or outputs except as expressly permitted by us;</li>
                    <li>use the Services to develop competing models or benchmark our Services without written permission;</li>
                    <li>use the Services in any manner that could create risk of harm, discrimination, unlawful profiling, or unsafe decisions.</li>
                </ul>
                <p>We may suspend or terminate access for violations of these Terms.</p>
            </LegalSection>

            <LegalSection id="user-content" title="7. User Content">
                <p className="font-medium text-foreground">Ownership</p>
                <p>
                    You retain ownership of the content you submit, upload, or post to the Services (&quot;User Content&quot;),
                    subject to the rights you grant below.
                </p>
                <p className="font-medium text-foreground">License to Align</p>
                <p>
                    You grant Align a non-exclusive, worldwide, royalty-free license to host, store, reproduce,
                    process, adapt, transmit, and display User Content solely as reasonably necessary to operate and
                    provide the Services, generate outputs requested by you, transmit content to subprocessors and
                    providers involved in delivering the Services, maintain security, comply with law, and enforce these Terms.
                </p>
                <p>We do not claim ownership of your User Content.</p>
                <p className="font-medium text-foreground">Your Responsibility</p>
                <p>You represent and warrant that:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>you own or control all rights necessary to provide the User Content;</li>
                    <li>your User Content and use of the Services do not violate applicable law or third-party rights;</li>
                    <li>you have all necessary permissions from any person whose personal information may appear in User Content.</li>
                </ul>
            </LegalSection>

            <LegalSection id="outputs" title="8. Outputs">
                <p>
                    The Services may generate suggestions, assessments, text, reports, scores, visual outputs, or
                    other materials (&quot;Outputs&quot;).
                </p>
                <p>
                    Subject to your compliance with these Terms and any applicable payment obligations, Align grants
                    you a limited, non-exclusive, non-transferable right to use Outputs for your personal or internal
                    business use.
                </p>
                <p>Because AI systems may generate similar or identical outputs for different users, Outputs may not be unique.</p>
                <p>You are solely responsible for reviewing, interpreting, and deciding whether to rely on any Output.</p>
            </LegalSection>

            <LegalSection id="feedback" title="9. Feedback">
                <p>
                    If you provide feedback, suggestions, or ideas regarding the Services, you grant us a non-exclusive,
                    worldwide, perpetual, irrevocable, royalty-free license to use and exploit that feedback without
                    restriction or compensation.
                </p>
            </LegalSection>

            <LegalSection id="payments" title="10. Fees, Subscriptions, Trials, and Credits">
                <p>Some features may require payment. If you purchase paid services, you agree to pay all applicable fees and taxes.</p>
                <p>Unless otherwise stated:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>fees are quoted in U.S. dollars;</li>
                    <li>subscriptions renew automatically until canceled;</li>
                    <li>you authorize us and our payment processors to charge your selected payment method;</li>
                    <li>trial access, promotional credits, usage credits, and discounts may be limited, modified, or discontinued at any time;</li>
                    <li>unused trial benefits or promotional credits have no cash value unless required by law;</li>
                    <li>paid fees are non-refundable except as required by law or expressly stated by us.</li>
                </ul>
                <p>
                    If your subscription renews automatically, you may cancel before the next billing cycle to avoid
                    future charges. Cancellation does not retroactively refund prior charges unless required by law.
                </p>
            </LegalSection>

            <LegalSection id="ip" title="11. Intellectual Property">
                <p>
                    The Services, including our software, branding, design, interfaces, text, graphics, features, and
                    underlying technology, are owned by Align or its licensors and are protected by intellectual
                    property laws.
                </p>
                <p>Except for the limited rights expressly granted in these Terms, no rights are transferred to you.</p>
            </LegalSection>

            <LegalSection id="privacy" title="12. Privacy">
                <p>Your use of the Services is also subject to our Privacy Policy, which is incorporated into these Terms by reference.</p>
            </LegalSection>

            <LegalSection id="beta" title="13. Beta Features">
                <p>
                    We may offer beta, preview, alpha, or experimental features. These may be modified, interrupted,
                    or discontinued at any time and may be subject to additional terms.
                </p>
            </LegalSection>

            <LegalSection id="disclaimers" title="14. Disclaimers">
                <p className="font-medium uppercase tracking-wide text-foreground">
                    The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis.
                </p>
                <p>
                    To the maximum extent permitted by law, Align disclaims all warranties, whether express, implied,
                    statutory, or otherwise, including implied warranties of merchantability, fitness for a particular
                    purpose, title, non-infringement, quiet enjoyment, accuracy, reliability, or that the Services
                    will be uninterrupted, error-free, or secure.
                </p>
                <p>Without limiting the foregoing, we do not warrant that:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>outputs will be accurate, complete, or appropriate;</li>
                    <li>the Services will meet your expectations or requirements;</li>
                    <li>the Services will identify all design, safety, health, structural, legal, or other issues in a space;</li>
                    <li>any recommendation, report, or output will produce a particular result.</li>
                </ul>
            </LegalSection>

            <LegalSection id="liability" title="15. Limitation of Liability">
                <p className="font-medium uppercase tracking-wide text-foreground">
                    To the maximum extent permitted by law, Align and its affiliates, officers, directors, employees,
                    contractors, agents, licensors, and service providers will not be liable for indirect, incidental,
                    special, consequential, exemplary, or punitive damages.
                </p>
                <p>
                    This limitation applies even if a report, recommendation, or other output is inaccurate,
                    incomplete, misleading, delayed, unavailable, or unsuitable for your circumstances.
                </p>
                <p>
                    To the maximum extent permitted by law, Align’s total liability for all claims arising out of or
                    relating to the Services or these Terms will not exceed the greater of: (a) the amount you paid to
                    Align for the Services in the 12 months before the event giving rise to the claim; or (b) U.S. $100.
                </p>
            </LegalSection>

            <LegalSection id="indemnification" title="16. Indemnification">
                <p>
                    You agree to defend, indemnify, and hold harmless Align and its affiliates, officers, directors,
                    employees, contractors, agents, licensors, and service providers from and against any claims,
                    liabilities, damages, judgments, losses, costs, and expenses, including reasonable attorneys’ fees,
                    arising out of or related to your use of the Services, your User Content, your violation of these
                    Terms, or your violation of any law or third-party rights.
                </p>
            </LegalSection>

            <LegalSection id="termination" title="17. Suspension and Termination">
                <p>
                    We may suspend or terminate your access to the Services at any time, with or without notice, if you
                    violate these Terms, we reasonably believe your use creates risk, harm, or legal exposure, we are
                    required by law to do so, or we discontinue the Services.
                </p>
                <p>
                    You may stop using the Services at any time. Sections that by their nature should survive
                    termination will survive, including ownership, disclaimers, limitations of liability,
                    indemnification, payment obligations, and dispute provisions.
                </p>
            </LegalSection>

            <LegalSection id="changes" title="18. Changes to the Services or Terms">
                <p>
                    We may modify the Services or these Terms from time to time. If we make material changes, we will
                    post the updated Terms and update the Last Updated date. Your continued use of the Services after
                    the effective date of updated Terms constitutes acceptance of the updated Terms.
                </p>
            </LegalSection>

            <LegalSection id="governing-law" title="19. Governing Law">
                <p>
                    These Terms are governed by the laws of the jurisdiction in which Align is organized, without
                    regard to conflict of laws principles.
                </p>
            </LegalSection>

            <LegalSection id="disputes" title="20. Dispute Resolution">
                <p>
                    Any dispute, claim, or controversy arising out of or relating to these Terms or the Services will
                    be resolved in the state or federal courts located in the jurisdiction where Align is headquartered,
                    and you and Align consent to personal jurisdiction and venue there.
                </p>
                <p>
                    If Align later adopts arbitration, class action waiver, or region-specific consumer dispute terms,
                    those provisions may be added after legal review.
                </p>
            </LegalSection>

            <LegalSection id="export" title="21. Export and Sanctions Compliance">
                <p>
                    You may not use the Services if you are located in, or subject to, a country or person embargoed
                    or restricted under applicable export control or sanctions laws, or if your use would violate such laws.
                </p>
            </LegalSection>

            <LegalSection id="misc" title="22. Miscellaneous">
                <ul className="list-disc space-y-2 pl-5">
                    <li>If any provision of these Terms is found unenforceable, the remaining provisions remain in full force and effect.</li>
                    <li>Our failure to enforce any provision is not a waiver.</li>
                    <li>You may not assign these Terms without our prior written consent.</li>
                    <li>We may assign these Terms in connection with a merger, acquisition, reorganization, or sale of assets.</li>
                    <li>These Terms, together with the Privacy Policy and any additional terms incorporated by reference, constitute the entire agreement between you and Align regarding the Services.</li>
                </ul>
            </LegalSection>

            <LegalSection id="contact" title="23. Contact Us">
                <p>If you have questions about these Terms, contact us at:</p>
                <p className="border-t border-[#efe7de] pt-4">
                    Align
                    <br />
                    Address available upon request
                    <br />
                    Email:{" "}
                    <a className="underline underline-offset-4" href="mailto:support@alignflow.xyz">
                        support@alignflow.xyz
                    </a>
                </p>
            </LegalSection>
        </LegalPageShell>
    );
}
