
import useSEO from "../hooks/useSEO";
import {ArrowRight} from "lucide-react";
import {Link} from "react-router-dom";

const termsSections = [
  {
    title: "1. Introduction",
    paragraphs: [
      "Welcome to Troski. These Terms of Service govern your access to and use of the Troski website, mobile applications and related services.",
      "Troski is a technology platform that connects passengers seeking transportation with drivers who offer transportation services. References to Troski, we, our or us mean the legal entity operating the Troski platform.",
      "By creating an account, accessing our platform or using our services, you agree to these Terms. If you do not agree, you must not use the platform."
    ],
  },
  {
    title: "2. Eligibility and Account Registration",
    paragraphs: [
      "You must provide accurate, complete and current information when creating a Troski account. You are responsible for ensuring that the information associated with your account remains accurate.",
      "You must use your own phone number and other required account details. You must not impersonate another person, create fraudulent accounts or provide false information.",
      "You are responsible for maintaining the confidentiality of your PIN and account credentials. You must notify Troski promptly if you suspect that your account has been accessed without your permission.",
      "Troski reserves the right to verify information provided during registration and to restrict accounts where information is inaccurate, incomplete or reasonably suspected to be fraudulent."
    ],
  },
  {
    title: "3. Description of Services",
    paragraphs: [
      "Troski provides a digital platform through which passengers can request transportation services from available drivers.",
      "The platform may provide features including account registration, driver verification, pickup and destination selection, ride matching, trip information, communication between passengers and drivers, digital payment facilities and customer support.",
      "Troski facilitates connections between passengers and drivers. Unless expressly stated otherwise in a separate agreement, the transportation service itself is provided by the driver and not directly by Troski.",
      "We may introduce, modify, suspend or discontinue features of the platform where reasonably necessary for operational, security, legal or business reasons."
    ],
  },
  {
    title: "4. Passenger Responsibilities",
    paragraphs: [
      "Passengers agree to use Troski responsibly and provide accurate pickup and destination information when requesting a ride.",
      "Passengers must:",
    ],
    bullets: [
      "Provide accurate information when requesting a ride.",
      "Treat drivers with courtesy and respect.",
      "Be available at the agreed pickup location.",
      "Pay applicable fares and charges for completed trips.",
      "Avoid abusive, threatening, discriminatory or unlawful behaviour.",
      "Not use the platform for illegal activities or purposes that could endanger others.",
      "Report safety concerns, misconduct or suspicious activity to Troski."
    ],
    ending: "Passengers are responsible for their personal belongings. Troski is not responsible for items left in vehicles, although we may assist in coordinating communication with drivers where reasonably possible."
  },
  {
    title: "5. Driver Responsibilities",
    paragraphs: [
      "Drivers who wish to provide transportation services through Troski must complete the applicable registration and verification process.",
      "Drivers are responsible for maintaining all licences, permits, insurance, vehicle registrations and other authorisations required under applicable Ghanaian laws.",
      "Drivers agree to:",
    ],
    bullets: [
      "Provide accurate personal and vehicle information.",
      "Maintain a valid driving licence and all legally required documents.",
      "Ensure that their vehicles are roadworthy, properly insured and suitable for passenger transportation.",
      "Treat passengers professionally and respectfully.",
      "Follow applicable road traffic and road safety requirements.",
      "Accept or decline ride requests honestly and without unlawful discrimination.",
      "Protect passenger information and use it only for legitimate trip-related purposes.",
      "Report accidents, safety incidents and relevant changes to their registration information.",
      "Never misuse passenger contact details or location information."
    ],
    ending: "Drivers must not allow another person to use their account or operate under their identity. Failure to comply with these requirements may result in suspension or removal from the platform."
  },
  {
    title: "6. Driver Verification",
    paragraphs: [
      "Troski may request and review identity documents, driving licences, vehicle documents and other information necessary to assess driver eligibility.",
      "Verification is intended to improve trust and safety on the platform. However, verification does not constitute a guarantee of a driver's future conduct, driving ability or the safety of every journey.",
      "Drivers are responsible for ensuring that their submitted documents remain valid and up to date. Troski may request additional documentation or conduct further checks where reasonably necessary."
    ],
  },
  {
    title: "7. Ride Requests and Cancellations",
    paragraphs: [
      "Submitting a ride request does not guarantee that a driver will be available or accept the request.",
      "A ride is subject to driver availability, acceptance and confirmation through the platform.",
      "Passengers and drivers should communicate promptly if there are changes to pickup arrangements or if either party needs to cancel a trip.",
      "Cancellation fees, waiting charges or other applicable charges will be communicated through the platform before they are applied. Any such charges must comply with applicable law.",
      "Troski reserves the right to cancel or restrict a ride where there are reasonable safety, security, operational or legal concerns."
    ],
  },
  {
    title: "8. Fares and Payments",
    paragraphs: [
      "Applicable fares and charges will be displayed or communicated through the platform before a passenger confirms a ride, where the relevant feature supports this.",
      "Passengers agree to pay the fare and any clearly disclosed applicable charges associated with their trip.",
      "Payments may be processed through third-party payment providers or other payment methods made available by Troski.",
      "Where a third-party payment provider is used, the processing of payment information may also be subject to that provider's terms and privacy policy.",
      "Troski does not guarantee the availability of every payment method at all times. Payment failures, processing delays and reversals may be subject to the relevant provider's procedures.",
      "Where a passenger believes that a fare or payment is incorrect, they should contact Troski through the official support channels with relevant trip and transaction details."
    ],
  },
  {
    title: "9. Refunds and Payment Disputes",
    paragraphs: [
      "Requests for refunds or payment corrections will be reviewed based on the circumstances of the transaction, applicable platform policies and relevant consumer protection laws.",
      "A refund is not automatic merely because a passenger is dissatisfied with a completed trip. However, passengers may request a review where a duplicate payment, incorrect charge, failed trip or other legitimate payment issue has occurred.",
      "Approved refunds will be processed through the original payment method where reasonably possible. The time required for the funds to appear may depend on the relevant financial institution or payment provider.",
      "Nothing in these Terms limits any consumer rights that cannot lawfully be excluded."
    ],
  },
  {
    title: "10. Safety and Prohibited Conduct",
    paragraphs: [
      "The safety of passengers and drivers is important to Troski. All users are expected to act responsibly and comply with applicable laws.",
      "The following activities are prohibited:",
    ],
    bullets: [
      "Harassment, threats, violence or intimidation.",
      "Fraud, impersonation or identity misuse.",
      "Sharing or selling account access.",
      "Discrimination or abusive treatment of other users.",
      "Using the platform to arrange unlawful activities.",
      "Tampering with ride information or payment records.",
      "Misusing personal information obtained through the platform.",
      "Operating a vehicle without the legally required documentation.",
      "Any conduct that creates a serious safety or security risk."
    ],
    ending: "Users should contact the appropriate emergency services immediately where there is an immediate threat to life or safety. Troski support is not a substitute for emergency services."
  },
  {
    title: "11. Account Suspension and Termination",
    paragraphs: [
      "Troski may investigate reports of misconduct, suspicious activity, fraud, safety concerns or breaches of these Terms.",
      "We may temporarily suspend or permanently restrict an account where reasonably necessary to protect users, prevent fraud, comply with legal obligations or enforce these Terms.",
      "Where reasonably practicable and legally permitted, affected users will be informed of the reason for a suspension and any available review process.",
      "You may request account closure through the official Troski support channels. Account closure does not necessarily require the immediate deletion of records that we are legally required or otherwise permitted to retain."
    ],
  },
  {
    title: "12. Intellectual Property",
    paragraphs: [
      "All intellectual property rights in the Troski name, logo, branding, website, software, design, content and platform materials belong to Troski or its respective licensors.",
      "You may use the platform only for its intended purposes. You must not copy, reproduce, distribute, modify, reverse engineer or commercially exploit any part of the platform without prior written permission, except where permitted by applicable law."
    ],
  },
  {
    title: "13. Platform Availability",
    paragraphs: [
      "We aim to maintain a reliable service but do not guarantee that the platform will always be available, uninterrupted, secure or free from errors.",
      "Access may occasionally be affected by maintenance, technical problems, network interruptions, third-party service failures or circumstances beyond our reasonable control.",
      "Troski may temporarily suspend parts of the platform to carry out maintenance, security updates or necessary operational changes."
    ],
  },
  {
    title: "14. Limitation of Liability",
    paragraphs: [
      "To the extent permitted by applicable law, Troski will not be liable for indirect, incidental or consequential losses arising from the use of, or inability to use, the platform.",
      "Troski does not guarantee the conduct of individual passengers or drivers, the condition of a vehicle, uninterrupted transportation services or the actions of third-party service providers.",
      "Nothing in these Terms excludes or limits liability for fraud, wilful misconduct, death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded or limited under Ghanaian law.",
      "Nothing in these Terms removes any rights or remedies available to users under applicable consumer protection or other laws."
    ],
  },
  {
    title: "15. Indemnification",
    paragraphs: [
      "To the extent permitted by law, users may be responsible for losses, claims or reasonable costs arising directly from their unlawful conduct, fraud, misuse of the platform or material breach of these Terms.",
      "This provision does not apply to the extent that a loss results from Troski's own negligence, unlawful conduct or other liability that cannot legally be transferred to a user."
    ],
  },
  {
    title: "16. Changes to These Terms",
    paragraphs: [
      "Troski may update these Terms from time to time to reflect changes in our services, business operations, technology or legal obligations.",
      "Where a change is material, we will take reasonable steps to notify affected users through the website, application or another appropriate communication channel.",
      "The updated Terms will indicate their effective date. Continued use of the platform after the effective date will constitute acceptance where permitted by law. If you do not agree with the changes, you should stop using the platform."
    ],
  },
  {
    title: "17. Governing Law and Disputes",
    paragraphs: [
      "These Terms are governed by the laws of the Republic of Ghana.",
      "We encourage users to contact Troski first so that complaints and disputes can be reviewed and resolved where possible.",
      "Nothing in this section prevents a user from exercising a statutory right, making a complaint to a competent regulatory authority or pursuing a claim before a court with appropriate jurisdiction in Ghana."
    ],
  },
  {
    title: "18. Contact Information",
    paragraphs: [
      "If you have questions about these Terms, need assistance or wish to report a breach, please contact Troski through the official contact details published on our website.",
      "Before publishing this page, insert the full registered legal name, physical business address, official telephone number and support email address of the company operating Troski."
    ],
  },
];

const privacySections = [
  {
    title: "1. Introduction",
    paragraphs: [
      "Troski respects your privacy and is committed to protecting your personal information.",
      "This Privacy Policy explains how we collect, use, store, disclose and protect personal information when you visit our website, register for an account or use the Troski passenger and driver applications.",
      "This policy applies to passengers, drivers, website visitors and other individuals who interact with our services.",
      "We process personal information in accordance with applicable Ghanaian data protection laws, including the Data Protection Act, 2012 (Act 843)."
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: [
      "The information we collect depends on how you interact with Troski and which services you use."
    ],
    subsections: [
      {
        title: "A. Personal and Account Information",
        items: [
          "Full name.",
          "Email address.",
          "Phone number.",
          "Account credentials and authentication information, including securely handled PIN-related information.",
          "Profile photograph, where provided."
        ]
      },
      {
        title: "B. Driver and Vehicle Information",
        items: [
          "Driving licence and identification information.",
          "Ghana Card or other identity verification details, where required.",
          "Vehicle registration and ownership or authorisation documents.",
          "Vehicle details and relevant insurance information.",
          "Driver verification and approval records."
        ]
      },
      {
        title: "C. Location and Trip Information",
        items: [
          "Pickup and destination addresses.",
          "Trip requests, trip history and ride status.",
          "Location information necessary to provide ride-related services, where location features are enabled.",
          "Information about interactions between passengers and drivers through the platform."
        ]
      },
      {
        title: "D. Payment Information",
        items: [
          "Payment transaction references.",
          "Payment amounts and transaction status.",
          "Payment method information necessary to facilitate or verify transactions."
        ]
      },
      {
        title: "E. Technical and Usage Information",
        items: [
          "Device type and operating system.",
          "Application version and technical identifiers.",
          "IP address and connection information, where collected.",
          "Application activity, error logs and diagnostic information."
        ]
      },
      {
        title: "F. Communication Information",
        items: [
          "Messages and enquiries sent to our support team.",
          "Complaints, feedback and reports.",
          "Information provided during investigations or dispute resolution."
        ]
      }
    ],
  },
  {
    title: "3. How We Collect Information",
    paragraphs: [
      "We collect personal information directly from you when you register, update your profile, request a ride, apply to become a driver, make a payment or contact our support team.",
      "We may also receive information from payment providers, identity or document verification providers, service providers and other authorised third parties where necessary to provide our services or comply with legal obligations.",
      "Some technical information may be collected automatically when you use our website or applications."
    ],
  },
  {
    title: "4. How We Use Your Information",
    paragraphs: [
      "Troski uses personal information for legitimate and clearly defined purposes, including:"
    ],
    bullets: [
      "Creating and managing passenger and driver accounts.",
      "Verifying identities and assessing driver eligibility.",
      "Matching passengers with available drivers.",
      "Facilitating pickup, destination and trip coordination.",
      "Processing and confirming payments.",
      "Providing customer support and resolving complaints.",
      "Monitoring platform performance and improving our services.",
      "Detecting fraud, unauthorised access and suspicious activity.",
      "Maintaining platform security and preventing misuse.",
      "Communicating important service updates.",
      "Complying with legal and regulatory obligations."
    ],
    ending: "We will not use personal information for purposes that are incompatible with the purpose for which it was collected unless permitted by applicable law or supported by an appropriate lawful basis."
  },
  {
    title: "5. Legal Basis for Processing",
    paragraphs: [
      "We process personal information on an appropriate legal basis under applicable law. Depending on the circumstances, this may include your consent, the need to perform a contract or take steps at your request before entering into a contract, compliance with a legal obligation, or another lawful justification recognised under Ghanaian law.",
      "Where we rely on consent, you may withdraw that consent subject to legal requirements. Withdrawal does not affect processing that took place lawfully before consent was withdrawn."
    ],
  },
  {
    title: "6. How Information Is Shared",
    paragraphs: [
      "Troski does not sell personal information to third parties.",
      "We may share relevant information with the following categories of recipients where necessary and lawful:"
    ],
    subsections: [
      {
        title: "Passengers and Drivers",
        items: [
          "A driver may receive relevant passenger information, such as the passenger's name, pickup location and trip details, to complete an accepted ride.",
          "A passenger may receive relevant driver information, such as the driver's name, profile photograph, vehicle details and other verification information made available through the platform."
        ]
      },
      {
        title: "Service Providers",
        items: [
          "Cloud hosting and infrastructure providers.",
          "Payment processing providers.",
          "Identity and document verification providers.",
          "Communication and notification providers.",
          "Technical support, analytics and security providers."
        ]
      },
      {
        title: "Authorities and Legal Requirements",
        items: [
          "Government agencies, law enforcement authorities, courts or regulators where disclosure is required or legally permitted."
        ]
      }
    ],
    ending: "We take reasonable steps to ensure that third parties receiving personal information are subject to appropriate confidentiality and data protection obligations."
  },
  {
    title: "7. Location Information",
    paragraphs: [
      "Location information may be used to support ride requests, identify pickup and destination points, coordinate trips and improve the operation of the platform.",
      "Where location permissions are requested, you can manage those permissions through your device settings. Disabling location access may affect features that depend on location information.",
      "Troski will only process location information to the extent necessary for the purposes explained in this policy and permitted by applicable law."
    ],
  },
  {
    title: "8. Data Storage and Retention",
    paragraphs: [
      "We retain personal information only for as long as reasonably necessary to fulfil the purposes for which it was collected, provide our services, resolve disputes, maintain appropriate business records and comply with legal obligations.",
      "The retention period may vary depending on the type of information and the circumstances in which it was collected.",
      "When personal information is no longer required, we will take reasonable steps to securely delete, destroy or anonymise it, subject to applicable legal requirements."
    ],
  },
  {
    title: "9. Data Security",
    paragraphs: [
      "Troski takes reasonable technical and organisational measures to protect personal information against unauthorised access, disclosure, alteration, loss, misuse or destruction.",
      "These measures may include access controls, authentication safeguards, secure storage, encryption where appropriate, monitoring and restricted access to personal information.",
      "However, no internet transmission or electronic storage system can be guaranteed to be completely secure. We cannot promise absolute security, but we will take reasonable steps to protect the information entrusted to us.",
      "If a personal data breach occurs, we will take appropriate steps in accordance with applicable legal requirements."
    ],
  },
  {
    title: "10. Your Privacy Rights",
    paragraphs: [
      "Subject to applicable law, you may have the right to:"
    ],
    bullets: [
      "Request information about whether we process your personal information.",
      "Request access to personal information we hold about you.",
      "Request correction of inaccurate, incomplete or outdated information.",
      "Object to certain forms of processing.",
      "Request that processing be stopped where legally justified.",
      "Withdraw consent where processing is based on consent.",
      "Request deletion of personal information where applicable law provides that right.",
      "Make a complaint to the Data Protection Commission of Ghana."
    ],
    ending: "To exercise these rights, contact Troski using the official privacy contact details published on our website. We may need to verify your identity before responding. Your rights are subject to applicable legal conditions and exceptions."
  },
  {
    title: "11. Cookies and Website Technologies",
    paragraphs: [
      "Our website may use cookies or similar technologies to support essential website functionality, remember preferences, understand website usage and improve performance.",
      "Where required, we will request your consent before using non-essential cookies or similar tracking technologies.",
      "You can manage or disable cookies through your browser settings. Disabling certain cookies may affect how parts of the website function."
    ],
  },
  {
    title: "12. Third-Party Services and Links",
    paragraphs: [
      "Our website and applications may contain links to third-party websites or services. These services operate independently and may have their own privacy policies and terms.",
      "Troski is not responsible for the privacy practices of third-party websites or services that we do not control. We encourage users to review their policies before providing personal information."
    ],
  },
  {
    title: "13. International Data Transfers",
    paragraphs: [
      "Some of our service providers may process or store personal information outside Ghana.",
      "Where personal information is transferred internationally, Troski will take appropriate steps to ensure that the transfer and subsequent processing comply with applicable Ghanaian data protection requirements."
    ],
  },
  {
    title: "14. Children's Privacy",
    paragraphs: [
      "Troski's platform is not designed to knowingly collect personal information from children without appropriate authorisation or safeguards where required by law.",
      "Where a parent or guardian believes that a child has provided personal information to Troski inappropriately, they should contact us so that the matter can be reviewed."
    ],
  },
  {
    title: "15. Changes to This Privacy Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, technology, business practices or legal requirements.",
      "Where material changes are made, we will take reasonable steps to notify affected users through the website, application or another appropriate communication channel.",
      "The latest version will be published on this page together with its updated effective date."
    ],
  },
  {
    title: "16. Contact and Privacy Complaints",
    paragraphs: [
      "For questions, requests or complaints concerning your personal information, contact Troski using the official privacy contact details published on our website.",
      "You may also contact the Data Protection Commission of Ghana if you believe your personal information has been processed in violation of applicable data protection laws.",
      "Before publishing this policy, insert your organisation's registered legal name, physical address, official privacy email address and applicable Data Protection Commission registration details."
    ],
  },
];

const Section = ({ section }) => (
    <section id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="scroll-mt-28 flex flex-col gap-4">
      <h3 className="text-lg font-bold text-black md:text-xl">
        {section.title}
      </h3>

      {section.paragraphs?.map((paragraph, index) => (
          <p key={index} className="text-sm leading-7 text-black/75 md:text-base">
            {paragraph}
          </p>
      ))}

      {section.bullets && (
          <ul className="ml-5 flex list-disc flex-col gap-3 text-sm leading-7 text-black/65 md:text-base">
            {section.bullets.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
          </ul>
      )}

      {section.subsections?.map((subsection, index) => (
          <div key={index} className="flex flex-col gap-3">
            <h4 className="font-semibold text-black">
              {subsection.title}
            </h4>

            <ul className="ml-5 flex list-disc flex-col gap-2 text-sm leading-7 text-black/65 md:text-base">
              {subsection.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
      ))}

      {section.ending && (
          <p className="text-sm leading-7 text-black/65 md:text-base">
            {section.ending}
          </p>
      )}
    </section>
);

const Terms = () => {
  useSEO({
    title: "Terms of Service & Privacy Policy | Troski",
    description:
        "Read Troski's Terms of Service and Privacy Policy to understand the rules governing our ride-hailing platform and how we protect your personal information.",
  });

  return (
      <div className="flex flex-col gap-12 pb-24 md:gap-16">

        {/* Hero Section */}
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-12 text-center md:px-8">
          <h1 className="text-4xl font-bold md:text-5xl">
            Terms & Privacy
          </h1>

          <p className="text-base text-black/70 md:text-lg">
            Transparency matters. Learn about the terms that govern your use
            of Troski and how we handle your personal information.
          </p>

          <span className="mt-2 text-xs text-black/55">
          Effective date: 17 November 2026
        </span>
        </section>

        {/* Legal Content */}
        <section className="flex w-full justify-center">
          <div className="flex w-[90%] max-w-4xl flex-col gap-12">

            {/* Table of Contents */}
            <div className="p-6 md:p-8">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                    href="#terms-of-service"
                    className="font-semibold text-sm text-black transition hover:text-yellow-700"
                >
                  01. Terms of Service
                </a>

                <a
                    href="#privacy-policy"
                    className="font-semibold text-sm text-black transition hover:text-yellow-700"
                >
                  02. Privacy Policy
                </a>
              </div>
            </div>

            {/* Terms of Service */}
            <div id="terms-of-service" className="scroll-mt-28 flex flex-col gap-8">
              <div className="flex flex-col gap-3 border-b border-black/10 pb-6">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#c99b00]">
                Section 01
              </span>

                <h2 className="text-2xl font-bold text-black md:text-3xl">
                  Terms of Service
                </h2>

                <p className="text-sm leading-7 text-black/65 md:text-base">
                  These terms explain the rights and responsibilities of
                  passengers, drivers and anyone using the Troski platform.
                </p>
              </div>

              {termsSections.map((section) => (
                  <Section key={section.title} section={section} />
              ))}
            </div>

            {/* Privacy Policy */}
            <div id="privacy-policy" className="scroll-mt-28 flex flex-col gap-8 border-t border-black/10 pt-12">
              <div className="flex flex-col gap-3 border-b border-black/10 pb-6">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#c99b00]">
                Section 02
              </span>

                <h2 className="text-2xl font-bold text-black md:text-3xl">
                  Privacy Policy
                </h2>

                <p className="text-sm leading-7 text-black/65 md:text-base">
                  This policy explains what personal information we collect,
                  why we collect it, how we use it and the steps we take to
                  protect it.
                </p>
              </div>

              {privacySections.map((section) => (
                  <Section key={section.title} section={section} />
              ))}
            </div>

            {/* Closing Note */}
            <div className="rounded-lgl bg-brand p-6 md:p-8">
              <h3 className="mb-3 text-lg font-bold text-black">
                Questions about our policies?
              </h3>

              <p className="text-sm leading-7 text-black md:text-base">
                If you have questions about these Terms of Service or our
                Privacy Policy, please reach out to the Troski team through
                our official contact channels.
              </p>

              <Link
                  to="/contact"
                  className="mt-10 inline-flex bg-black px-3 py-2 rounded-lg text-brand items-center gap-2 font-semibold transition-opacity hover:opacity-60"
              >
                Contact channels
                <ArrowRight size={18} />
              </Link>
            </div>

          </div>
        </section>
      </div>
  );
};

export default Terms;
