import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | TravQuest Travel & Tourism",
  description:
    "Read the Terms and Conditions governing travel bookings and services provided by TravQuest Travel and Tourism L.L.C-FZ.",
};

type ContentItem = { body: string; subtitle?: string };
type Section = { id: string; title: string; content: ContentItem[] };

const sections: Section[] = [
  {
    id: "service-access",
    title: "1. Service Access & Termination",
    content: [
      {
        body: "The TravQuest Travel & Tourism LLC reserves the right, in its sole discretion, to terminate the access to any or all The TravQuest Travel & Tourism LLC websites or its other sales channels and the related services or any portion thereof at any time, without notice, for general maintenance or any reason whatsoever.",
      },
    ],
  },
  {
    id: "accuracy-of-information",
    title: "2. Accuracy of Information",
    content: [
      {
        body: "The Travel Agency Partner expressly undertakes to provide to The TravQuest Travel & Tourism LLC only correct and valid information while requesting for any services under this agreement, and not to make any misrepresentation of facts at all.",
      },
    ],
  },
  {
    id: "default-booking-validity",
    title: "3. Default & Booking Validity",
    content: [
      {
        body: "Any default on the part of the Travel Agency Partner would vitiate the bookings and shall disentitle the Travel Agency Partner or its Guest & Customers from availing the services from The TravQuest Travel & Tourism LLC.",
      },
    ],
  },
  {
    id: "unauthorized-requests",
    title: "4. Unauthorized or Misrepresented Requests",
    content: [
      {
        body: "In case, The TravQuest Travel & Tourism LLC discovers or has reasons to believe at any time during or after receiving a request for services from the Travel Agency Partner that the request for services is either unauthorized or the information provided by the Travel Agency Partner or its Customers & Guests is not correct or that any fact has been misrepresented by him or them, The TravQuest Travel & Tourism LLC in its sole discretion shall have the unrestricted right to take any steps against the Travel Agency Partner(s), including cancellation of the bookings, etc. without any prior intimation to the Travel Agency Partner. In such an event, The TravQuest Travel & Tourism LLC shall not be responsible or liable for any loss or damage that may be caused to the Travel Agency Partner or any of them as a consequence of such cancellation of booking or services.",
      },
    ],
  },
  {
    id: "indemnification",
    title: "5. Indemnification",
    content: [
      {
        body: "The Travel Agency Partner unequivocally indemnifies The TravQuest Travel & Tourism LLC of any such claim or liability and shall not hold The TravQuest Travel & Tourism LLC responsible for any loss or damage arising out of measures taken by The TravQuest Travel & Tourism LLC to safeguard its interest and that of its genuine customers. This would also include The TravQuest Travel & Tourism LLC denying/ cancelling any bookings on account of suspected fraudulent transactions.",
      },
    ],
  },
  {
    id: "pricing-vat",
    title: "6. Pricing, VAT & Additional Charges",
    content: [
      {
        body: "All prices displayed are the final payable amount to us Including VAT however if government authorities, local governing bodies or service providers apply any additional tax, fees, service charges, resort fees or any other indirect charge without prior notification; these additional charge(s) will be levied by us on to the reservation and it will not be part of the reservation amount booked or paid. We will not be liable to pay this additional VAT/charges/taxes/resort fees as we have limited control over such additional charges.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: [
      {
        body: "Each of The TravQuest Travel & Tourism LLCs content, covering images, product details and description, pricing information, and logo, is proprietary to The TravQuest Travel & Tourism LLC. You may view or print any or all part of the website, though cannot be utilized for any commercial, non-personal or illegal causes.",
      },
    ],
  },
  {
    id: "policy-updates",
    title: "8. Policy Updates",
    content: [
      {
        body: "The Website's policies and Terms & Conditions may be changed or updated occasionally to meet the requirements and standards. Therefore, the travel agency partners are encouraged to frequently visit these sections to be updated about the changes on the website. Modifications will be effective on the day they are posted.",
      },
    ],
  },
  {
    id: "governing-law",
    title: "9. Governing Law & Disputes",
    content: [
      {
        body: "Any dispute or claim arising out of or in connection with this website shall be governed and construed by the laws of UAE (the United Arab Emirates is our country of domicile). If the Travel Agency Partner does not agree with any part of such terms, conditions and notices, the Travel Agency Partner must not avail of The TravQuest Travel & Tourism LLC Services.",
      },
    ],
  },
  {
    id: "payments",
    title: "10. Payments & Card Security",
    content: [
      {
        body: "If you make a payment for our products or services on our website, the details you are asked to submit will be provided directly to our payment provider via a secured connection. The cardholder must retain a copy of transaction records and Merchant policies and rules. We accept payments online using Visa and MasterCard credit/debit cards in USD (or any other agreed currencies).",
      },
    ],
  },
  {
    id: "terms-updates",
    title: "11. Terms of Service Updates",
    content: [
      {
        body: "The above Terms of Services may changed or updated without prior notice according to the United Arab Emirates Tourism Policies.",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <section className="relative bg-gray-950 overflow-hidden pt-36 pb-20">
        <div className="absolute inset-0 bg-linear-to-br from-black via-[#00B5A3]/10 to-[#f2836f]/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00B5A3]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-12 text-center">
          <span className="inline-block text-[#00B5A3] text-[10px] font-semibold uppercase tracking-[0.25em] mb-4 px-4 py-1.5 rounded-full border border-[#00B5A3]/30 bg-[#00B5A3]/8">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 cursive leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Please read these terms carefully before making a booking or using
            our services. They set out the basis on which we provide travel
            arrangements to you.
          </p>
          <p className="text-gray-600 text-xs mt-6">
            Effective date: 1 January 2025 &nbsp;·&nbsp; Last updated: June 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-gradient-to-b from-[#F7F4F1] to-white py-16 px-6 sm:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Intro */}
          <div className="mb-12 p-6 rounded-2xl border border-[#00B5A3]/20 bg-[#00B5A3]/5">
            <p className="text-gray-700 text-sm leading-relaxed">
              These Terms and Conditions constitute a legally binding agreement
              between you (&ldquo;the Customer&rdquo;) and{" "}
              <strong className="text-gray-900">
                The TravQuest Travel &amp; Tourism LLC
              </strong>
              , a company registered in the United Arab Emirates with a licensed
              office at Business Center 1, M Floor, The Meydan Hotel, Nad Al
              Sheba, Dubai, U.A.E. By engaging our services, you agree to these
              terms in full.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-12 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contents
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[13px] text-[#00B5A3] hover:underline leading-relaxed"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                  {section.title}
                </h2>
                <div className="flex flex-col gap-4">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      {item.subtitle ? (
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">
                          {item.subtitle}
                        </h3>
                      ) : null}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-16 p-8 rounded-2xl bg-gray-950 text-center">
            <p className="text-white text-sm font-medium mb-1">
              Questions about our Terms?
            </p>
            <p className="text-gray-400 text-xs mb-5">
              Our team is always happy to help clarify any part of this agreement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="btn-primary-sm">
                Contact Us
              </Link>
              <Link href="/privacy" className="btn-dark-sm">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
