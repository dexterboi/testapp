// Helper to ensure we have an array of image strings
export const ensureArray = (images: any, fallback?: string): string[] => {
    // If it's already an array, clean and return it
    if (Array.isArray(images)) {
        return images
            .map(img => {
                if (typeof img === 'string') {
                    // Clean URLs - remove trailing brackets and trim
                    return img.replace(/\]+$/, '').trim();
                }
                return img;
            })
            .filter((img): img is string =>
                typeof img === 'string' && img.length > 0
            );
    }

    // If it's a JSON string, parse it
    if (typeof images === 'string' && images.trim()) {
        // Try to parse as JSON first (in case database stored it as JSON string)
        try {
            const parsed = JSON.parse(images);
            if (Array.isArray(parsed)) {
                return parsed
                    .map(img => typeof img === 'string' ? img.replace(/\]+$/, '').trim() : img)
                    .filter((img): img is string => typeof img === 'string' && img.length > 0);
            }
        } catch (e) {
            // Not JSON, continue with string parsing
        }

        // Handle string that might contain URLs
        const cleanStr = images.replace(/[{}"']/g, '').trim();
        if (cleanStr.includes('http')) {
            const links = cleanStr.split(/[\s,]+/)
                .filter(l => l.startsWith('http'))
                .map(l => l.replace(/\]+$/, '').trim());
            if (links.length) return links;
        }
        const cleaned = cleanStr.replace(/\]+$/, '').trim();
        return cleaned ? [cleaned] : (fallback ? [fallback] : []);
    }

    return fallback ? [fallback] : [];
};

// Helper to get image URL (handles both full URLs and filenames)
export const getImageUrl = (image: string | null | undefined, bucket: string, recordId: string, getFileUrl: (bucket: string, path: string) => string): string => {
    if (!image) return '';

    if (image.startsWith('http')) {
        let url = image;
        // Fast Google Drive Fix
        if (url.includes('drive.google.com')) {
            const match = url.match(/\/d\/(.+?)\//);
            if (match) url = `https://drive.google.com/uc?id=${match[1]}&export=download`;
        }
        // Performance: Use smaller thumbnails for Unsplash
        if (url.includes('unsplash.com')) {
            url = url.split('&')[0].split('?')[0] + '?auto=format&fit=crop&q=60&w=400';
        }
        return url;
    }

    return getFileUrl(bucket, `${recordId}/${image}`);
};

/**
 * Helper to get avatar URL with ImageKit support and fallbacks
 * @param avatar - Global URL, relative path, or null
 * @param name - Display name for fallback avatar
 * @param userId - User ID for deterministic fallback avatar
 */
export const getAvatarUrl = (avatar: string | null | undefined, name?: string, userId?: string): string => {
    // If we have a full URL (ImageKit, Cloudinary, Google, etc.), return it
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
        return avatar;
    }

    // If we have a filename but not a full URL, use ImageKit base
    // Note: The endpoint should match what's in your .env or the hardcoded one used in UserProfile
    const IMAGEKIT_BASE = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/kanze88sec';

    if (avatar && avatar.trim()) {
        const cleanPath = avatar.trim().startsWith('/') ? avatar.trim() : `/${avatar.trim()}`;
        return `${IMAGEKIT_BASE}${cleanPath}`;
    }

    // Fallback 1: UI Avatars (clean, professional)
    if (name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C1F45F&color=000&size=256&bold=true`;
    }

    // Fallback 2: Dicebear (playful, for anonymous users)
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'default'}`;
};

// Helper to safely access Supabase relations (handles both arrays and objects)
export const getRelation = (data: any, relationName: string): any => {
    if (!data || !data[relationName]) return null;
    // Supabase returns relations as arrays, so get first element
    return Array.isArray(data[relationName]) ? data[relationName][0] : data[relationName];
};
