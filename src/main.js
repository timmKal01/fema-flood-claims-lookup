import { Actor, log } from 'apify';
import { fetchClaims } from './fema.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { countyCode, yearOfLossFrom, maxResults = 50 } = input;
let { state } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const CLAIMS_SEARCH_EVENT = 'claims-search';

// An empty run (first click in the Console, Apify's daily health check) used to
// throw here and got the actor flagged "under maintenance". Fall back to a
// working example instead. Only when both are empty: a default state would
// wrongly narrow a county-only search.
if (!state && !countyCode) {
    state = 'TX';
    log.info('No state or countyCode given; defaulting to state "TX".');
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
