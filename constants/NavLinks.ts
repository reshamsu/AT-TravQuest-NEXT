export const Nav_Links = [
  // { href: "/", key: "home", label: "Home" },
  {
    key: "explore-uae",
    label: "Explore UAE",
    submenu: [
      {
        href: "/destinations/uae/abu-dhabi",
        label: "Abu Dhabi",
      },
      {
        href: "/destinations/uae/dubai",
        label: "Dubai",
      },
      { href: "/destinations/uae/fujairah", label: "Fujairah" },
      { href: "/destinations/uae/ras-al-khaimah", label: "Ras Al Khaimah" },
    ],
  },
  {
    key: "destinations",
    label: "Destinations",
    submenu: [
      { href: "/destinations/sri-lanka/", label: "Sri Lanka" },
      { href: "/destinations/maldives/", label: "Maldives" },
      { href: "/destinations/thailand/", label: "Thailand" },
      // { href: "/destinations/singapore/", label: "Singapore" },   
      // { href: "/destinations/malaysia/", label: "Malaysia" },
      { href: "/destinations/georgia/", label: "Georgia" },
    ],
  },
  {
    key: "more",
    label: "More",
    submenu: [
      {
        href: "/more/meeting-conferences",
        label: "Meeting, Incentives & Conferences",
      },
      {
        href: "/more/apartment-for-monthly-stays",
        label: "Apartments for Monthly Stays",
      },
      { href: "/more/visa-assistance", label: "Visa Assistance" },
      { href: "/more/airport-transfers", label: "Airport Transfers" },
      { href: "/more/corporate-travels", label: "Corporate Travels" },
    ],
  },
  { href: "/about", key: "about", label: "About" },
  { href: "/contact", key: "contact", label: "Contact" },
];
