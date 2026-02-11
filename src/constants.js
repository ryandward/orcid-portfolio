export const ORCID_ID = '0000-0001-9537-2461'
export const API_BASE = `https://pub.orcid.org/v3.0/${ORCID_ID}`
export const HEADERS = { Accept: 'application/json' }

export const SE_USER_ID = 714178
export const SE_API = 'https://api.stackexchange.com/2.3'
export const SE_KEY = 'rl_wccxWRWHzAJvKRriRy1tCvccy'
export const SE_FILTER = '!FuhdYD2u)f5mDp8hdYF).fIFse' // includes up/down_vote_count + is_accepted

export const FALLBACK_BIO = "Geneticist and computational biologist who builds tools for people who don't know what GitHub is. CRISPRi pipelines for a lab that needed them yesterday. A fair loot system for 479 EverQuest players who just want their dragon drops. Zero GitHub stars. Lots of users."

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
    { title: "Intelligence Analyst", org: "PREDICT Open Source Intelligence Team", start: "May 2009", end: "May 2012", location: "Las Cruces, NM" },
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
    { name: "Discord: sambal.oelek", url: "https://discord.com/users/sambal.oelek" },
    { name: "GitHub", url: "https://github.com/ryandward" },
    { name: "Stack Overflow", url: "https://stackoverflow.com/users/714178" },
  ],
}
