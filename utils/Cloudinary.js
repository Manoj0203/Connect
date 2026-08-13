export const optimizeCloudinaryUrl = (url, width) => {
    if (!url || typeof url !== 'string') return url;

    // Check if it's a standard Cloudinary URL
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        // Find the index where we need to insert the transformation parameters
        const uploadIndex = url.indexOf('/upload/') + 8;
        
        // Define transformation parameters
        const transformation = `q_auto,f_auto${width ? `,w_${width}` : ''}/`;
        
        // Return the modified URL
        return url.slice(0, uploadIndex) + transformation + url.slice(uploadIndex);
    }
    
    return url;
};
