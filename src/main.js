import { Actor, log } from 'apify';
import { fetchClaims } from './fema.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { state, countyCode, yearOfLossFrom, maxResults = 50 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const CLAIMS_SEARCH_EVENT = 'claims-search';

if (!state && !countyCode) {
    throw new Error('Provide at least "state" (two-letter code) or "countyCode" to scope the search.');
}

const claims = await fetchClaims({
    state,
    countyCode,
    yearOfLossFrom,
    maxResults: Math.min(maxResults, 500),
});

for (const c of claims) {
    await Actor.pushData(c);
}

await Actor.charge({ eventName: CLAIMS_SEARCH_EVENT });

log.info(`Pushed ${claims.length} claim(s)`);

await Actor.exit();
