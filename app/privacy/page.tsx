import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | TravQuest Travel & Tourism",
  description:
    "Learn how TravQuest Travel and Tourism collects, uses, and protects your personal information when you use our services.",
};

type ContentItem =
  | { body: string; bullets?: never; subtitle?: string }
  | { bullets: string[]; body?: never; subtitle?: never };

const sections: {
  id: string;
  title: string;
  content: ContentItem[];
}[] = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: [
      {
        body: "The TravQuest Travel & Tourism can collect and use Travel Agency Partner's or its Guests' & Customers' personal details especially when they get in touch with us to enquire about our services or at the time of booking a tour package.",
      },
      {
        body: "We collect the following personal information from you.",
      },
      {
        bullets: [
          "Contact Information such as name, gender, DOB, passport number, Email address",
          "Billing Information such as credit card number and billing address",
          "Usage activity about how you interact with us such as booking history",
        ],
      },
      {
        body: "As is true of most Web sites, we automatically gather information about your computer such as your IP address, browser type, referring/exit pages, and operating system. By submitting such details, you allow us to utilize your personal data for further relevant purpose. The Travel Agency Partner's or it Guests' & Customers' personal information collected via the website, Email or other sources is primarily used to confirm booking, authenticate credit card information, and process the payment.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: [
      {
        body: "Apart from utilizing it for activities intended to improve the website's performance, this information can also be submitted to airline or accommodation service provider, depending on their preferred service package. All credit/debit cards details and personally identifiable information will NOT be stored, sold, shared, rented or leased to any third parties. The Website Policies and Terms & Conditions may be changed or updated occasionally to meet the requirements and standards. Therefore, the customers are encouraged to frequently visit these sections in order to be updated about the changes on the website. Modifications will be effective on the day they are posted.",
      },
    ],
  },
  {
    id: "third-party-advertising",
    title: "3. Third-Party Advertising",
    content: [
      {
        body: "Some of the advertisements you see on the Site are selected and delivered by third parties, such as ad networks, advertising agencies, advertisers, and audience segment providers. These third parties may collect information about you and your online activities, either on the Site or on other websites, through cookies, web beacons, and other technologies in an effort to understand your interests and deliver to your advertisements that are tailored to your interests. Please remember that we do not have access to, or control over, the information these third parties may collect. The information practices of these third parties are not covered by this privacy policy.",
      },
    ],
  },
  {
    id: "policy-changes",
    title: "4. Changes to This Privacy Policy",
    content: [
      {
        body: "We may update this privacy statement to reflect changes to our information practices. If we make any material changes, we will notify you by email (sent to the email address specified in your account) or by means of a notice on this Site prior to the change becoming effective. We encourage you to periodically review this page for the latest information on our privacy practices.",
      },
    ],
  },
  {
    id: "cancellation-refund",
    title: "5. Cancellation/Refund Policy",
    content: [
      {
        body: "In order to cancel the Booking, The Travel Agency Partner is requested to send notification in writing to The TravQuest Travel & Tourism. Once we receive your cancellation request, we will acknowledge the same via Email stating the cancellation fee you may be required to pay. Each hotel/service provider has its own refund and cancellation policy, as a result of which The TravQuest Travel & Tourism is adhered to the same. Also, refunds will be done only through the Original Mode of Payment.",
      },
      {
        body: "The Booking requests which are applicable for refund as per the cancellation policy specified in each booking will be entitled for refund (if applicable) and will be refunded within 15 to 30 working days from the date of cancellation request after the deduction of payment gateway processing charges or wire transfer charges, wherever applicable.",
      },
      {
        body: "If Travel Agency Partner or Its Customer & Its Guest do not avail of a paid Booking Service partly or fully, The TravQuest Travel & Tourism will not make any refund in all the circumstances. Refunds will be done only through the Original Mode of Payment.",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <section className="relative bg-gray-950 overflow-hidden pt-36 pb-20">
        <div className="absolute inset-0 bg-linear-to-br from-black via-[#00B5A3]/10 to-[#f2836f]/25" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#f2836f]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-12 text-center">
          <span className="inline-block text-[#f2836f] text-[10px] font-semibold uppercase tracking-[0.25em] mb-4 px-4 py-1.5 rounded-full border border-[#f2836f]/30 bg-[#f2836f]/8">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 cursive leading-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Your privacy matters to us. This policy explains how TravQuest
            Travel and Tourism collects, uses, and safeguards your personal
            information.
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
          <div className="mb-12 p-6 rounded-2xl border border-[#f2836f]/20 bg-[#f2836f]/5">
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong className="text-gray-900">
                The TravQuest Travel &amp; Tourism LLC
              </strong>{" "}
              (&ldquo;TravQuest,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) is committed to protecting your personal
              information and your right to privacy. This Privacy Policy
              describes the types of information we gather from visitors to{" "}
              <strong>travquesttravel.com</strong> and customers who use our
              travel services, how we use that information, and the safeguards
              we have in place to protect it.
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
                    className="text-[13px] text-[#f2836f] hover:underline leading-relaxed"
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
                <div className="flex flex-col gap-3">
                  {section.content.map((item, i) =>
                    item.bullets ? (
                      <ul key={i} className="flex flex-col gap-2 pl-2">
                        {item.bullets.map((bullet, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-gray-600 text-sm leading-relaxed"
                          >
                            <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#f2836f]" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={i}
                        className="text-gray-600 text-sm leading-relaxed"
                      >
                        {item.body}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-16 p-8 rounded-2xl bg-gray-950 text-center">
            <p className="text-white text-sm font-medium mb-1">
              Have questions about our Privacy Policy?
            </p>
            <p className="text-gray-400 text-xs mb-5">
              Our team is happy to clarify anything.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="btn-primary-sm">
                Contact Us
              </Link>
              <Link href="/terms" className="btn-dark-sm">
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
