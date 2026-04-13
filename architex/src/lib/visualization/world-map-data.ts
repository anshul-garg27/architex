// -----------------------------------------------------------------
// Architex -- World Map Data & Data Center Locations
// -----------------------------------------------------------------
//
// Simplified SVG world map paths (Mercator projection) for
// continent outlines, plus 24 data center locations across
// AWS, GCP, and Azure.
//
// Coordinate system: viewBox 0 0 1000 500
// Projection: equirectangular (plate carree) scaled to viewBox
// -----------------------------------------------------------------

// -- Cloud Providers ------------------------------------------------

export type CloudProvider = 'aws' | 'gcp' | 'azure';

export const PROVIDER_COLORS: Record<CloudProvider, string> = {
  aws: '#FF9900',   // AWS orange
  gcp: '#4285F4',   // Google blue
  azure: '#00BCF2',  // Azure cyan
};

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  aws: 'Amazon Web Services',
  gcp: 'Google Cloud Platform',
  azure: 'Microsoft Azure',
};

// -- Data Center Location -------------------------------------------

export interface DataCenterLocation {
  id: string;
  provider: CloudProvider;
  region: string;
  city: string;
  lat: number;
  lng: number;
  /** Projected X in 0..1000 viewBox */
  x: number;
  /** Projected Y in 0..500 viewBox */
  y: number;
}

// -- Projection Utilities -------------------------------------------

/** Convert lat/lng to viewBox coordinates (equirectangular). */
export function projectToViewBox(
  lat: number,
  lng: number,
): { x: number; y: number } {
  // viewBox: 0 0 1000 500
  // lng -180..180 -> x 0..1000
  // lat  90..-90  -> y 0..500
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// -- Data Center Locations (24 regions) ----------------------------

function dc(
  id: string,
  provider: CloudProvider,
  region: string,
  city: string,
  lat: number,
  lng: number,
): DataCenterLocation {
  const { x, y } = projectToViewBox(lat, lng);
  return { id, provider, region, city, lat, lng, x, y };
}

export const DATA_CENTERS: DataCenterLocation[] = [
  // AWS (10 regions)
  dc('aws-use1', 'aws', 'us-east-1', 'Virginia', 38.95, -77.45),
  dc('aws-use2', 'aws', 'us-east-2', 'Ohio', 39.96, -82.99),
  dc('aws-usw1', 'aws', 'us-west-1', 'N. California', 37.35, -121.96),
  dc('aws-usw2', 'aws', 'us-west-2', 'Oregon', 45.52, -122.68),
  dc('aws-euw1', 'aws', 'eu-west-1', 'Ireland', 53.35, -6.26),
  dc('aws-euw2', 'aws', 'eu-west-2', 'London', 51.51, -0.13),
  dc('aws-euc1', 'aws', 'eu-central-1', 'Frankfurt', 50.11, 8.68),
  dc('aws-apse1', 'aws', 'ap-southeast-1', 'Singapore', 1.35, 103.82),
  dc('aws-apne1', 'aws', 'ap-northeast-1', 'Tokyo', 35.68, 139.69),
  dc('aws-sae1', 'aws', 'sa-east-1', 'Sao Paulo', -23.55, -46.63),

  // GCP (8 regions)
  dc('gcp-usc1', 'gcp', 'us-central1', 'Iowa', 41.88, -93.10),
  dc('gcp-use1', 'gcp', 'us-east1', 'S. Carolina', 33.84, -81.16),
  dc('gcp-usw1', 'gcp', 'us-west1', 'Oregon', 45.59, -122.60),
  dc('gcp-euw1', 'gcp', 'europe-west1', 'Belgium', 50.45, 3.72),
  dc('gcp-euw3', 'gcp', 'europe-west3', 'Frankfurt', 50.11, 8.68),
  dc('gcp-ase1', 'gcp', 'asia-east1', 'Taiwan', 25.03, 121.57),
  dc('gcp-asne1', 'gcp', 'asia-northeast1', 'Tokyo', 35.68, 139.78),
  dc('gcp-asse1', 'gcp', 'asia-southeast1', 'Singapore', 1.29, 103.85),

  // Azure (6 regions)
  dc('az-eastus', 'azure', 'eastus', 'Virginia', 37.43, -79.43),
  dc('az-westus', 'azure', 'westus', 'California', 37.78, -122.42),
  dc('az-westeu', 'azure', 'westeurope', 'Netherlands', 52.37, 4.90),
  dc('az-seasia', 'azure', 'southeastasia', 'Singapore', 1.35, 103.99),
  dc('az-japan', 'azure', 'japaneast', 'Tokyo', 35.69, 139.75),
  dc('az-brazil', 'azure', 'brazilsouth', 'Sao Paulo', -23.55, -46.64),
];

/** Lookup a data center by ID. */
export function getDataCenter(id: string): DataCenterLocation | undefined {
  return DATA_CENTERS.find((dc) => dc.id === id);
}

/** Get all data centers for a provider. */
export function getDataCentersByProvider(
  provider: CloudProvider,
): DataCenterLocation[] {
  return DATA_CENTERS.filter((dc) => dc.provider === provider);
}

// -- Simplified World Map SVG Paths ---------------------------------
//
// Approximate continent outlines as SVG path data. The paths are
// drawn in the 0 0 1000 500 viewBox using equirectangular
// projection. Each path is a simplified polygon (~8-15 vertices
// per continent).

export interface ContinentPath {
  id: string;
  name: string;
  d: string;
}

export const CONTINENT_PATHS: ContinentPath[] = [
  {
    id: 'north-america',
    name: 'North America',
    d: 'M 80 60 L 130 55 L 165 70 L 190 95 L 210 100 L 225 110 L 240 135 L 250 155 L 255 180 L 260 200 L 265 215 L 255 230 L 240 235 L 220 230 L 195 225 L 175 220 L 155 215 L 140 195 L 125 180 L 110 175 L 95 165 L 85 145 L 80 120 L 75 95 Z',
  },
  {
    id: 'central-america',
    name: 'Central America',
    d: 'M 155 215 L 175 220 L 185 230 L 195 245 L 190 255 L 175 258 L 165 250 L 155 240 L 150 230 Z',
  },
  {
    id: 'south-america',
    name: 'South America',
    d: 'M 195 255 L 215 260 L 230 270 L 240 285 L 248 305 L 250 330 L 245 355 L 235 380 L 218 395 L 200 385 L 190 360 L 183 335 L 180 310 L 178 290 L 182 270 Z',
  },
  {
    id: 'europe',
    name: 'Europe',
    d: 'M 440 65 L 460 60 L 490 65 L 510 75 L 530 80 L 540 95 L 535 115 L 520 125 L 510 135 L 500 140 L 485 145 L 470 140 L 460 135 L 448 130 L 440 120 L 435 105 L 435 85 Z',
  },
  {
    id: 'africa',
    name: 'Africa',
    d: 'M 440 175 L 460 170 L 485 175 L 510 180 L 530 190 L 540 210 L 545 235 L 543 265 L 535 295 L 520 320 L 505 340 L 490 345 L 475 335 L 465 310 L 455 280 L 448 255 L 440 225 L 438 200 Z',
  },
  {
    id: 'asia-west',
    name: 'Western Asia',
    d: 'M 540 95 L 560 90 L 580 100 L 590 115 L 585 135 L 575 150 L 555 165 L 540 170 L 530 160 L 520 145 L 520 125 L 530 110 Z',
  },
  {
    id: 'asia-central',
    name: 'Central & East Asia',
    d: 'M 590 60 L 630 55 L 670 58 L 710 65 L 740 72 L 770 80 L 790 95 L 785 110 L 775 130 L 760 145 L 740 155 L 715 160 L 690 158 L 665 155 L 640 150 L 620 140 L 600 125 L 590 105 L 588 80 Z',
  },
  {
    id: 'asia-south',
    name: 'South Asia',
    d: 'M 620 140 L 640 150 L 660 160 L 670 175 L 665 195 L 650 210 L 635 215 L 620 205 L 610 190 L 605 170 L 610 155 Z',
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia',
    d: 'M 690 160 L 715 165 L 735 175 L 750 185 L 760 200 L 755 215 L 740 225 L 720 230 L 700 220 L 685 205 L 680 185 L 685 170 Z',
  },
  {
    id: 'japan',
    name: 'Japan',
    d: 'M 795 100 L 800 105 L 800 125 L 798 140 L 793 145 L 790 135 L 790 115 L 792 105 Z',
  },
  {
    id: 'australia',
    name: 'Australia',
    d: 'M 730 290 L 760 280 L 790 285 L 810 295 L 820 315 L 815 340 L 800 355 L 775 360 L 750 350 L 735 335 L 728 315 L 725 300 Z',
  },
  {
    id: 'new-zealand',
    name: 'New Zealand',
    d: 'M 840 350 L 845 345 L 850 350 L 850 365 L 845 370 L 840 365 Z',
  },
  {
    id: 'greenland',
    name: 'Greenland',
    d: 'M 270 30 L 295 25 L 315 30 L 325 45 L 320 60 L 305 68 L 285 65 L 272 55 L 268 42 Z',
  },
  {
    id: 'iceland',
    name: 'Iceland',
    d: 'M 385 50 L 395 48 L 405 50 L 405 56 L 395 58 L 385 55 Z',
  },
];

// -- Map Dimensions -------------------------------------------------

export const MAP_VIEWBOX = {
  width: 1000,
  height: 500,
} as const;
