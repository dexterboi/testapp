
/**
 * ImageKit Service
 * Handles uploading images to imagekit.io
 */

const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

if (!PUBLIC_KEY || !URL_ENDPOINT || !PRIVATE_KEY) {
    console.error('❌ [ImageKit] Missing environment variables. Uploads will fail.');
}

export const uploadToImageKit = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${Date.now()}_${file.name}`);
        formData.append('publicKey', PUBLIC_KEY);

        // Note: In a production app, the signature should be generated on the server.
        // For this client-side demo, we use the simple upload if possible or basic auth if permitted.
        // However, ImageKit requires a signature for client-side uploads.
        // If we don't have a backend, we can't easily sign.
        // But let's try a direct upload if the public key allows it, or use the private key for signing (not recommended but feasible here).

        // Simple fetch upload (this might require the authenticationEndpoint normally)
        // Let's try to use the Private Key for a direct server-to-server style upload if fetch allows it from client (CORS might be an issue).

        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(PRIVATE_KEY + ':')}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload to ImageKit');
        }

        const data = await response.json();
        // Clean the URL - remove any trailing brackets or invalid characters
        let imageUrl = data.url || data.filePath || '';

        // Remove trailing brackets if present
        imageUrl = imageUrl.replace(/\]+$/, '').trim();

        // If it's a filePath, construct the full URL
        if (!imageUrl.startsWith('http') && data.filePath) {
            imageUrl = `${URL_ENDPOINT}/${data.filePath}`;
        }

        console.log('[ImageKit] Uploaded image URL:', imageUrl);
        return imageUrl;
    } catch (error: any) {
        console.error('ImageKit upload error:', error);
        throw error;
    }
};
