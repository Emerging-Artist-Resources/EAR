export const LEGAL_DOCUMENT_KEYS = [
  "account_terms",
  "privacy_policy",
  "community_calendar_terms",
] as const

export type LegalDocumentKey = (typeof LEGAL_DOCUMENT_KEYS)[number]

export type LegalProse = {
  heading?: string
  paragraphs?: readonly string[]
  items?: readonly string[]
  closingParagraphs?: readonly string[]
}

export type LegalSection = LegalProse & {
  blocks?: readonly LegalProse[]
}

export type LegalDocument = {
  key: LegalDocumentKey
  version: string
  title: string
  description: string
  path: `/legal/${string}`
  /** Public date line, such as "November 23, 2026". */
  updatedLabel?: string
  sections: readonly LegalSection[]
}

/** Registration checkbox copy. Not shown on the public terms page. */
export const ACCOUNT_TERMS_CHECKBOX_LABEL =
  "I agree to EAR's Terms & Conditions and acknowledge that I have read EAR's Privacy Policy."

/** Listing submission checkbox copy. Not shown on the public terms page. */
export const COMMUNITY_CALENDAR_TERMS_CHECKBOX_LABEL =
  "I have read and agree to the Community Calendar Terms & Conditions. I certify that my submission is accurate to the best of my knowledge and grant EAR permission to publish my listing and use submitted media as described in these terms."

/**
 * Published legal copy. Versions here are the strings later acceptance
 * records store. Section text is the supplied document, not generated copy.
 */
export const accountTermsDocument = {
  key: "account_terms",
  version: "2026-11-23",
  title: "Account Terms & Conditions",
  description: "Account Terms and Conditions for Emerging Artist Resources.",
  path: "/legal/account-terms",
  updatedLabel: "November 23, 2026",
  sections: [
    {
      paragraphs: [
        'By creating an account with Emerging Artist Resources ("EAR"), you agree to the following:',
      ],
    },
    {
      heading: "1. Accurate Registration Information",
      paragraphs: [
        "You agree to provide accurate, complete, and current information when creating your account and to keep your account information up to date.",
      ],
    },
    {
      heading: "2. Account Security",
      paragraphs: [
        "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify EAR immediately of any unauthorized use of your account.",
      ],
    },
    {
      heading: "3. Appropriate Use",
      paragraphs: [
        "You agree to use your account only for lawful purposes and in accordance with these Terms. You may not:",
      ],
      items: [
        "impersonate another individual or organization;",
        "submit false or misleading information;",
        "interfere with the operation or security of the website;",
        "upload malicious software or harmful content;",
        "use the website in violation of any applicable laws.",
      ],
    },
    {
      heading: "4. User Content",
      paragraphs: [
        "You retain ownership of any content you upload through your account. By submitting content to EAR, you grant EAR a non-exclusive, royalty-free license to display, reproduce, and distribute that content as necessary to provide its services and promote your listings, programs, and participation.",
      ],
    },
    {
      heading: "5. Privacy",
      paragraphs: [
        "Your use of the website is also governed by EAR's [Privacy Policy](/legal/privacy-policy). By creating an account, you acknowledge that you have read the Privacy Policy.",
      ],
    },
    {
      heading: "6. Account Suspension or Termination",
      paragraphs: [
        "EAR reserves the right to suspend or terminate accounts that violate these Terms or that are used in a manner that may harm EAR, its users, or the public.",
      ],
    },
    {
      heading: "7. Intellectual Property",
      paragraphs: [
        "All website content, branding, graphics, logos, and materials created by EAR remain the property of EAR unless otherwise stated. Users may not reproduce or distribute EAR's content without written permission.",
      ],
    },
    {
      heading: "8. Disclaimer",
      paragraphs: [
        "EAR provides information and resources for educational and informational purposes. EAR does not guarantee the accuracy, availability, or outcomes of opportunities listed on the website.",
      ],
    },
    {
      heading: "9. Limitation of Liability",
      paragraphs: [
        "To the fullest extent permitted by law, EAR shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of the website or services.",
      ],
    },
    {
      heading: "10. Changes to These Terms",
      paragraphs: [
        "EAR may update these Terms and Conditions from time to time. Continued use of the website after changes are posted constitutes acceptance of the revised Terms.",
      ],
    },
  ],
} as const satisfies LegalDocument

export const privacyPolicyDocument = {
  key: "privacy_policy",
  version: "2026-11-23",
  title: "Privacy Policy",
  description: "Privacy Policy for Emerging Artist Resources.",
  path: "/legal/privacy-policy",
  updatedLabel: "November 23, 2026",
  sections: [
    {
      paragraphs: [
        'Emerging Artist Resources ("EAR," "we," "our," or "us") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and the choices you have regarding your information.',
      ],
    },
    {
      heading: "1. Information We Collect",
      paragraphs: [
        "We may collect the following information when you use our website or services:",
      ],
      blocks: [
        {
          heading: "Information You Provide",
          items: [
            "Name and email address",
            "Pronouns and general location",
            "Organization or project name",
            "Account and profile information, including profile type and emerging artist status",
            "Professional and organizational information, including operating budget ranges, nonprofit status, institutional affiliations, venue ownership, and independent teaching activities",
            "Website and social media links",
            "Event, opportunity, or listing information",
            "Photos, logos, graphics, and other uploaded images",
            "Account registration and authentication information",
            "Fiscal sponsorship inquiry information, including legal entity status, budget information, and previous sponsorship arrangements",
            "Donation information, including donor contact information, donation amounts, transaction records, and optional messages",
            "Information about how you heard about EAR",
            "Any additional information you voluntarily submit through forms or correspondence",
          ],
        },
        {
          heading: "Information Collected Automatically",
          paragraphs: [
            "When you visit our website, we may automatically collect certain technical information, including:",
          ],
          items: [
            "IP address",
            "Browser type",
            "Device information",
            "Pages visited",
            "Date and time of access",
            "General website usage analytics",
          ],
          closingParagraphs: [
            "This information helps us improve the functionality and performance of our website.",
          ],
        },
        {
          heading: "Website Analytics",
          paragraphs: [
            "EAR uses third-party analytics services, including Vercel Analytics and PostHog, to understand how visitors interact with our website and to improve its functionality, accessibility, and user experience.",
            "These services may process technical information such as pages visited, referral sources, browser type, device information, and general website usage patterns.",
            "PostHog is configured to operate in cookieless mode. It temporarily processes IP addresses and browser information to generate daily visitor identifiers. IP addresses are discarded after this process and are not used by PostHog to determine geographic location. PostHog does not store persistent analytics identifiers in your browser.",
            "EAR does not use these analytics services for targeted advertising or intentionally collect account credentials, payment details, or private form submissions through these services.",
          ],
        },
        {
          heading: "Cookies and Browser Storage",
          paragraphs: [
            "EAR uses essential cookies and browser storage technologies to support website functionality, maintain authenticated sessions, and help protect account security.",
            "These technologies allow users to sign in and remain authenticated while using EAR's services. EAR's current website analytics are configured to operate without persistent analytics cookies.",
          ],
        },
        {
          heading: "Payment Processing",
          paragraphs: [
            "EAR uses Stripe, a third-party payment processor, to process payments and donations. Payment card information is processed directly by Stripe and is not stored by EAR. EAR may retain transaction information necessary to administer donations, issue receipts, maintain financial records, and comply with legal obligations.",
          ],
        },
      ],
    },
    {
      heading: "2. How We Use Your Information",
      paragraphs: ["We use your information to:"],
      items: [
        "Operate and maintain the EAR website",
        "Publish Community Calendar listings",
        "Provide fiscal sponsorship and other services",
        "Respond to inquiries",
        "Create and manage your account",
        "Send newsletters and service updates (when you have subscribed)",
        "Promote submitted events and opportunities",
        "Improve our website and programs",
        "Comply with legal obligations",
      ],
    },
    {
      heading: "3. Community Calendar Submissions",
      paragraphs: [
        "Information you submit to the Community Calendar is intended for public display.",
        "By submitting a listing, you understand that information such as your organization name, event details, website, social media links, images, and promotional materials may be publicly visible on the EAR website, newsletters, and social media channels.",
        "Please do not submit confidential or sensitive personal information through the Community Calendar.",
      ],
    },
    {
      heading: "4. Media",
      paragraphs: [
        "If you upload photographs, logos, graphics, or other images, you grant EAR permission to use those materials in accordance with EAR's [Account Terms & Conditions](/legal/account-terms).",
        "You represent that you have the necessary rights and permissions to upload such materials.",
      ],
    },
    {
      heading: "5. Email Communications",
      paragraphs: [
        "If you create an account or use EAR's services, we may send you transactional and service-related communications, including account notifications, listing updates, and important service announcements.",
        "If you subscribe to our newsletter, we may also send you updates regarding EAR resources, events, workshops, and organizational news.",
        "You may unsubscribe from marketing emails at any time using the unsubscribe link included in those communications.",
      ],
    },
    {
      heading: "6. Sharing Information",
      paragraphs: [
        "EAR does not sell or rent your personal information.",
        "We may share information:",
      ],
      items: [
        "With third-party service providers who help us operate, maintain, and improve our website and services",
        "When required by law",
        "To protect the rights, safety, or property of EAR or others",
        "With your permission",
      ],
      blocks: [
        {
          paragraphs: ["Our third-party service providers include:"],
          items: [
            "Supabase: Account authentication, database management, and file storage.",
            "Vercel: Website hosting and website analytics.",
            "Stripe: Payment and donation processing.",
            "Postmark: Transactional and service-related email communications.",
            "Mailchimp: Newsletter and marketing communications for users who subscribe.",
            "Google Maps Places: Address suggestions and location search functionality. Location information entered into address fields may be transmitted to Google to provide these services.",
            "Sentry: Error monitoring, diagnostics, and website performance monitoring.",
            "Upstash: Rate limiting, abuse prevention, and website security, which may involve temporary processing of IP addresses.",
            "PostHog: Website usage analytics and product improvement.",
          ],
          closingParagraphs: [
            "These providers may process information as necessary to perform their respective services. Their handling of information is also subject to applicable agreements and their own privacy practices.",
          ],
        },
      ],
    },
    {
      heading: "7. Data Security",
      paragraphs: [
        "We take reasonable administrative, technical, and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.",
        "However, no method of internet transmission or electronic storage is completely secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      heading: "8. Data Retention",
      paragraphs: [
        "EAR retains personal information for as long as reasonably necessary to provide our services, maintain organizational records, comply with legal and financial obligations, resolve disputes, and fulfill the purposes described in this Privacy Policy.",
        "Retention periods may vary depending on the type of information collected and the purpose for which it is used.",
      ],
    },
    {
      heading: "9. Your Rights",
      paragraphs: ["Depending on your location, you may have the right to:"],
      items: [
        "Request access to your personal information",
        "Request correction of inaccurate information",
        "Request deletion of your personal information",
        "Withdraw consent where applicable",
        "Request information about how your data is used",
      ],
      closingParagraphs: [
        "To make a request, please contact us using the information below.",
      ],
    },
    {
      heading: "10. Children's Privacy",
      paragraphs: [
        "Our website and services are not directed toward children under the age of 13, and we do not knowingly collect personal information from children.",
      ],
    },
    {
      heading: "11. Third-Party Links",
      paragraphs: [
        "Our website may contain links to third-party websites, opportunities, or organizations.",
        "EAR is not responsible for the privacy practices or content of third-party websites. We encourage users to review the privacy policies of any external sites they visit.",
      ],
    },
    {
      heading: "12. Changes to This Privacy Policy",
      paragraphs: [
        "EAR may update this Privacy Policy from time to time. The revised version will become effective when posted on our website with the updated effective date.",
      ],
    },
    {
      heading: "13. Contact Us",
      paragraphs: [
        "If you have questions about this Privacy Policy or how your information is handled, please contact [info@eararts.org](mailto:info@eararts.org)",
      ],
    },
  ],
} as const satisfies LegalDocument

export const communityCalendarTermsDocument = {
  key: "community_calendar_terms",
  version: "2026-11-23",
  title: "Community Calendar Terms & Conditions",
  description: "Community Calendar Terms and Conditions for Emerging Artist Resources.",
  path: "/legal/community-calendar-terms",
  updatedLabel: "November 23, 2026",
  sections: [
    {
      paragraphs: [
        'By submitting an event or opportunity to the Emerging Artist Resources ("EAR") Community Calendar, you agree to the following:',
      ],
    },
    {
      heading: "1. Accuracy of Information",
      paragraphs: [
        "You certify that, to the best of your knowledge, all information submitted is accurate, complete, and current at the time of submission. You agree to update your listing directly through the portal if any information changes after submission.",
      ],
    },
    {
      heading: "2. Permission to Publish",
      paragraphs: [
        "You grant EAR permission to publish the information you provide on the EAR website, newsletters, social media platforms, and other promotional materials.",
      ],
    },
    {
      heading: "3. Photo & Media License",
      paragraphs: [
        'By uploading photographs, graphics, logos, or other media ("Media"), you represent that you own the rights to the Media or have obtained all necessary permissions to authorize its use.',
        "You grant EAR a non-exclusive, royalty-free, worldwide license to use, reproduce, crop, resize, modify for formatting purposes, publish, and distribute the submitted Media in connection with promoting your listing, the Community Calendar, and EAR's programs across its website, email communications, social media channels, and other marketing materials.",
        "You retain ownership of your submitted Media.",
      ],
    },
    {
      heading: "4. Content Standards",
      paragraphs: ["You agree not to submit content that:"],
      items: [
        "infringes upon another person's copyright, trademark, or intellectual property rights;",
        "contains false, misleading, or fraudulent information;",
        "is defamatory, discriminatory, obscene, or otherwise unlawful;",
        "promotes hate speech, violence, or illegal activities.",
      ],
      closingParagraphs: [
        "EAR reserves the right to edit, reject, or remove any submission at its sole discretion.",
      ],
    },
    {
      heading: "5. No Guarantee of Publication",
      paragraphs: [
        "Submission does not guarantee publication. EAR reserves the right to determine which listings appear on the Community Calendar and may remove listings at any time.",
      ],
    },
    {
      heading: "6. Third-Party Listings",
      paragraphs: [
        "EAR serves as a platform for sharing information about events, opportunities, classes, auditions, grants, residencies, jobs, and other resources submitted by third parties.",
        "Although EAR may review submissions before publication, approval does not constitute independent verification, endorsement, or a guarantee of the accuracy, legitimacy, quality, safety, availability, legality, compensation, or fulfillment of any listing or opportunity.",
        "Users are responsible for conducting their own due diligence before participating in, applying to, or relying on any opportunity listed.",
        "EAR is not responsible for cancellations, schedule changes, disputes, financial transactions, employment decisions, audition outcomes, or losses or damages arising from participation in any listed event or opportunity, to the extent permitted by applicable law.",
      ],
    },
    {
      heading: "7. Limitation of Liability",
      paragraphs: [
        "EAR is not responsible for any errors, omissions, cancellations, or changes made by event organizers after publication. Users are encouraged to verify event details directly with the organizer.",
      ],
    },
    {
      heading: "8. Privacy",
      paragraphs: [
        "Information collected through Community Calendar submissions is handled in accordance with EAR's [Privacy Policy](/legal/privacy-policy).",
      ],
    },
  ],
} as const satisfies LegalDocument

export const LEGAL_DOCUMENTS = [
  accountTermsDocument,
  privacyPolicyDocument,
  communityCalendarTermsDocument,
] as const
