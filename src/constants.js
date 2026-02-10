export const ORCID_ID = '0000-0001-9537-2461'
export const API_BASE = `https://pub.orcid.org/v3.0/${ORCID_ID}`
export const HEADERS = { Accept: 'application/json' }

export const LINKEDIN = {
  headline: "PhD Geneticist",
  location: "Santa Barbara, CA",
  experience: [
    { title: "Founding Scientist", org: "Stealth Startup", start: "Feb 2026", end: null, current: true },
    { title: "Senior Scientist", org: "Temporal Agriculture", start: "Jan 2025", end: "Jan 2026", location: "Santa Barbara, CA" },
    { title: "Postdoctoral Researcher", org: "University of Wisconsin\u2013Madison", start: "Dec 2024", end: "Jan 2025" },
    { title: "PhD Researcher", org: "University of Wisconsin\u2013Madison", start: "Sep 2019", end: "Dec 2024" },
    { title: "Bioinformatics Intern", org: "Temporal Agriculture", start: "May 2024", end: "Jul 2024", location: "Santa Barbara, CA" },
    { title: "Emergency Department Scribe", org: "MountainView Regional Medical Center", start: "Mar 2017", end: "Aug 2019", location: "Las Cruces, NM" },
    { title: "Policy Analyst", org: "New Mexico Department of Agriculture", start: "Nov 2012", end: "Jan 2017", location: "Las Cruces, NM" },
    { title: "Intelligence Analyst", org: "POSIT", start: "May 2009", end: "May 2012", location: "Las Cruces, NM" },
  ],
  skills: [
    "CRISPRi & Functional Genomics",
    "Bacterial Genetics",
    "Chemical Genomics",
    "Antibiotic Mechanisms",
    "Metagenomics",
    "Computational Biology",
    "Synthetic Biology",
    "Agricultural Biotechnology",
  ],
  links: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/ryanw-346889253" },
    { name: "Stack Overflow", url: "https://stackoverflow.com/users/714178" },
  ],
}
