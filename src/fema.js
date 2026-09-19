const UA = 'FemaFloodClaimsLookup/0.1 (+contact: fema-flood-claims-admin@example.com)';
const API_URL = 'https://www.fema.gov/api/open/v3/NfipClaims';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 20_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`OpenFEMA request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`OpenFEMA request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

function odataString(s) {
    return `'${String(s).replace(/'/g, "''")}'`;
}

function buildFilter({ state, countyCode, yearOfLossFrom }) {
    const parts = [];
    if (state) parts.push(`state eq ${odataString(state.toUpperCase())}`);
    if (countyCode) parts.push(`countyCode eq ${odataString(countyCode)}`);
    if (yearOfLossFrom) parts.push(`yearOfLoss ge ${yearOfLossFrom}`);
    return parts.join(' and ');
}

export async function fetchClaims({ state, countyCode, yearOfLossFrom, maxResults }) {
    const filter = buildFilter({ state, countyCode, yearOfLossFrom });

    const url = new URL(API_URL);
    if (filter) url.searchParams.set('$filter', filter);
    url.searchParams.set('$orderby', 'dateOfLoss desc');
    url.searchParams.set('$top', String(Math.min(maxResults, 500)));

    const res = await fetchWithRetry(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    const data = await res.json();
    const rows = data.NfipClaims ?? [];

    return rows.map((c) => ({
        state: c.state,
        countyCode: c.countyCode,
        nfipCommunityName: c.nfipCommunityName,
        reportedZipCode: c.reportedZipCode,
        latitude: c.latitude,
        longitude: c.longitude,
        dateOfLoss: c.dateOfLoss,
        yearOfLoss: c.yearOfLoss,
        floodEvent: c.floodEvent,
        ratedFloodZone: c.ratedFloodZone,
        floodZoneCurrent: c.floodZoneCurrent,
        occupancyType: c.occupancyType,
        primaryResidenceIndicator: c.primaryResidenceIndicator,
        buildingDamageAmount: c.buildingDamageAmount,
        amountPaidOnBuildingClaim: c.amountPaidOnBuildingClaim,
        contentsDamageAmount: c.contentsDamageAmount,
        amountPaidOnContentsClaim: c.amountPaidOnContentsClaim,
        totalBuildingInsuranceCoverage: c.totalBuildingInsuranceCoverage,
        totalContentsInsuranceCoverage: c.totalContentsInsuranceCoverage,
        causeOfDamage: c.causeOfDamage,
        waterDepth: c.waterDepth,
        elevatedBuildingIndicator: c.elevatedBuildingIndicator,
        originalConstructionDate: c.originalConstructionDate,
        id: c.id,
    }));
}
