# FEMA Flood Claims Lookup: NFIP Data by State or County

Search official National Flood Insurance Program claim history by state or
county. Get back location, flood event, flood zone, damage amounts, and
payout totals per claim, straight from FEMA's own claims database.

## Who this is for

- **Real estate professionals** researching a property's or neighborhood's flood claim history before a transaction.
- **Flood insurance underwriters and risk analysts** assessing claim patterns by area.
- **Insurance and disaster-risk researchers** studying flood loss trends by state or county over time.

## Input

| Field | Type | Description |
|---|---|---|
| `state` | string | Two-letter US state code, e.g. `"TX"`. Provide this and/or `countyCode`. |
| `countyCode` | string | 5-digit county FIPS code, e.g. `"48201"` for Harris County, TX. |
| `yearOfLossFrom` | integer | Only include claims with a loss year at or after this. Leave blank for all years. |
| `maxResults` | integer (default `50`) | Cap on claims returned, most recent loss first. |

```json
{
  "state": "TX",
  "yearOfLossFrom": 2020,
  "maxResults": 50
}
```

## Output

One record per claim:

```json
{
  "state": "TX",
  "countyCode": "48201",
  "nfipCommunityName": "HOUSTON, CITY OF",
  "reportedZipCode": "77036",
  "latitude": 29.7,
  "longitude": -95.5,
  "dateOfLoss": "2020-09-18T00:00:00.000Z",
  "yearOfLoss": 2020,
  "floodEvent": "Hurricane Laura",
  "ratedFloodZone": "A",
  "floodZoneCurrent": "A",
  "occupancyType": 1,
  "primaryResidenceIndicator": true,
  "buildingDamageAmount": 45000,
  "amountPaidOnBuildingClaim": 42000,
  "contentsDamageAmount": 12000,
  "amountPaidOnContentsClaim": 11000,
  "totalBuildingInsuranceCoverage": 200000,
  "totalContentsInsuranceCoverage": 50000,
  "causeOfDamage": "4",
  "waterDepth": 2,
  "elevatedBuildingIndicator": false,
  "originalConstructionDate": "1985-01-01T00:00:00.000Z",
  "id": 5448672
}
```

This is FEMA's public redacted claims dataset: individual claims are
included, but personally identifying details (names, exact addresses) are
removed. `reportedZipCode`, `latitude`/`longitude`, and `nfipCommunityName`
place the claim at neighborhood level, not exact address.

## How it works

One direct call to the OpenFEMA NFIP Redacted Claims v3 API
(`fema.gov/api/open/v3/NfipClaims`), no scraping, no key, no proxy. Uses
the newer v3 endpoint since FEMA has deprecated v2 and stopped updating it.

## Related products

- [FEMA Disaster Assistance Tracker](https://github.com/timmKal01/fema-disaster-assistance-tracker): individual disaster assistance registrant activity, a broader signal than flood-specific claims
- [Disaster Declaration Tracker](https://github.com/timmKal01/disaster-declaration-tracker): new FEMA disaster declarations, upstream of the claims this actor searches
- [Coastal Water Level Tracker](https://github.com/timmKal01/coastal-water-level-tracker): real-time NOAA tide data, for current coastal flood risk rather than historical claims
