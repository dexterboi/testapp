export const REAL_FOOTBALL_IMAGES = {
    STADIUMS: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1556056504-517cf0154970?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1000',
    ],
    PITCHES: [
        'https://images.unsplash.com/photo-1529900245061-5ef6f24d2091?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1518091043644-c1d445ebb752?auto=format&fit=crop&q=80&w=1000',
    ],
    INDOR: [
        'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=1000',
    ]
};

/**
 * Returns a consistent real football-related image based on an ID
 */
export const getRealPlaceholderImage = (id: string, type: 'complex' | 'pitch' | 'indoor' = 'pitch') => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    let pool = REAL_FOOTBALL_IMAGES.PITCHES;
    if (type === 'complex') pool = REAL_FOOTBALL_IMAGES.STADIUMS;
    if (type === 'indoor') pool = REAL_FOOTBALL_IMAGES.INDOR;

    return pool[hash % pool.length];
};
