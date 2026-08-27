import {
  CATEGORIES,
  COUNTRIES,
  FESTIVALS,
  YEARS,
  allOccurrences,
  fromISODate,
  toISODate,
} from "./data.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const countryCodes = new Set(COUNTRIES.map((country) => country.code));
const categoryIds = new Set(CATEGORIES.map((category) => category.id));
const errors = [];

function fail(message) {
  errors.push(message);
}

const ids = new Set();
for (const festival of FESTIVALS) {
  if (!festival.id) fail("Festival missing id");
  if (ids.has(festival.id)) fail(`Duplicate id: ${festival.id}`);
  ids.add(festival.id);
  if (!festival.name) fail(`${festival.id} missing name`);
  if (!categoryIds.has(festival.category)) {
    fail(`${festival.id} bad category ${festival.category}`);
  }
  if (!Array.isArray(festival.countries) || !festival.countries.length) {
    fail(`${festival.id} has no countries`);
  }
  for (const code of festival.countries) {
    if (!countryCodes.has(code)) fail(`${festival.id} unknown country ${code}`);
  }
  for (const code of festival.publicHolidayIn || []) {
    if (!countryCodes.has(code)) fail(`${festival.id} unknown PH country ${code}`);
  }
  if (!festival.summary || !festival.whyItMatters) {
    fail(`${festival.id} missing copy`);
  }
  if (!festival.contentHooks?.length) fail(`${festival.id} missing hooks`);
  if (!Number.isFinite(festival.leadDays)) fail(`${festival.id} missing leadDays`);

  const rule = festival.date;
  if (rule.kind === "map") {
    for (const year of YEARS) {
      const value = rule.byYear[year];
      if (!value || !ISO.test(value)) fail(`${festival.id} bad map date ${year}: ${value}`);
    }
  }
  if (rule.kind === "span-map") {
    for (const year of YEARS) {
      const span = rule.byYear[year];
      if (!span || !ISO.test(span.start) || !span.days) {
        fail(`${festival.id} bad span ${year}`);
      }
    }
  }
}

for (const year of YEARS) {
  const occs = allOccurrences(year);
  if (!occs.length) fail(`No occurrences in ${year}`);
  for (const occ of occs) {
    if (!ISO.test(occ.startISO) || !ISO.test(occ.endISO)) {
      fail(`Bad ISO for ${occ.festival.id} ${year}`);
    }
    if (fromISODate(occ.startISO).getFullYear() !== year) {
      fail(`${occ.festival.id} ${year} resolved to ${occ.startISO}`);
    }
    if (toISODate(fromISODate(occ.startISO)) !== occ.startISO) {
      fail(`Round-trip failed ${occ.startISO}`);
    }
  }
}

const sg2026 = allOccurrences(2026).filter((occ) =>
  occ.festival.countries.includes("SG"),
);
const needed = {
  "mid-autumn": "2026-09-25",
  "chinese-new-year": "2026-02-17",
  "hari-raya-puasa": "2026-03-21",
  deepavali: "2026-11-08",
  "national-day-sg": "2026-08-09",
  "hungry-ghost-festival": "2026-08-27",
};
for (const [id, iso] of Object.entries(needed)) {
  const match = sg2026.find((occ) => occ.festival.id === id);
  if (!match) fail(`Missing SG 2026 festival ${id}`);
  else if (match.startISO !== iso) fail(`${id} expected ${iso} got ${match.startISO}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `ok: ${FESTIVALS.length} festivals, ${allOccurrences(2026).length} occurrences in 2026, ${sg2026.length} with Singapore`,
);
