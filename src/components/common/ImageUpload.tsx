import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { uploadToImageKit } from '@/services/imageKitService';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';

interface ImageUploadProps {
  collection: string;
  recordId: string;
  fieldName: string;
  currentImages?: string[];
  maxFiles?: number;
  onUploadComplete?: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  collection,
  recordId,
  fieldName,
  currentImages = [],
  maxFiles = 10,
  onUploadComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(() => {
    // Filter out empty/null/undefined values
    return (currentImages || []).filter((img): img is string => 
      typeof img === 'string' && img.trim().length > 0
    );
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  // Update images when currentImages prop changes
  useEffect(() => {
    // Filter out empty/null/undefined values
    const filtered = (currentImages || []).filter((img): img is string => 
      typeof img === 'string' && img.trim().length > 0
    );
    setImages(filtered);
  }, [currentImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, maxFiles - images.length);
    if (filesToUpload.length === 0) {
      setErrorModal({ isOpen: true, message: `Maximum ${maxFiles} images allowed` });
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [...images];

      // Upload each file to ImageKit
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          setErrorModal({ isOpen: true, message: `${file.name} is not an image file. Skipping...` });
          continue;
        }

        try {
          const imageUrl = await uploadToImageKit(file);
          // Clean the URL - remove any trailing brackets or invalid characters
          const cleanUrl = imageUrl.replace(/\]+$/, '').trim();
          if (cleanUrl && cleanUrl.startsWith('http')) {
            uploadedUrls.push(cleanUrl);
            console.log(`[ImageUpload] Successfully uploaded: ${file.name} -> ${cleanUrl}`);
          } else {
            throw new Error(`Invalid image URL returned: ${imageUrl}`);
          }
        } catch (error: any) {
          console.error(`[ImageUpload] Failed to upload ${file.name}:`, error);
          setErrorModal({ isOpen: true, message: `Failed to upload ${file.name}: ${error.message || 'Unknown error'}` });
        }
      }

      // Filter out any empty/null values and clean URLs before saving
      const validUrls = uploadedUrls
        .map(url => {
          // Clean URL - remove trailing brackets and trim
          if (typeof url === 'string') {
            return url.replace(/\]+$/, '').trim();
          }
          return null;
        })
        .filter((url): url is string => 
          url !== null && url.length > 0 && url.startsWith('http')
        );

      if (validUrls.length === 0) {
        throw new Error('No valid images to save');
      }

      console.log(`[ImageUpload] Cleaned URLs to save:`, validUrls);

      // Update Supabase with new image URLs
      // Use 'images' array field for complexes and pitches, 'image' single field for others
      // Ensure we're sending a proper PostgreSQL array, not a JSON string
      const updateField = (fieldName === 'images' || collection === 'complexes' || collection === 'pitches')
        ? { images: validUrls }  // Supabase will handle TEXT[] conversion
        : { image: validUrls[validUrls.length - 1] || null };

      console.log(`[ImageUpload] Updating ${collection} ${recordId} with ${validUrls.length} images:`, validUrls);
      console.log(`[ImageUpload] Update field:`, updateField);

      // Validate recordId
      if (!recordId || recordId.trim() === '') {
        throw new Error('Invalid record ID. Cannot save images.');
      }

      // Check if record exists first (for debugging)
      const { data: existingRecord, error: checkError } = await supabase
        .from(collection)
        .select('id, images')
        .eq('id', recordId)
        .single();

      if (checkError) {
        console.error('[ImageUpload] Error checking record:', checkError);
        throw new Error(`Record not found: ${checkError.message}`);
      }

      console.log('[ImageUpload] Existing record:', existingRecord);

      const { error: updateError, data } = await supabase
        .from(collection)
        .update(updateField)
        .eq('id', recordId)
        .select();

      if (updateError) {
        console.error('[ImageUpload] Supabase update error:', updateError);
        console.error('[ImageUpload] Update field:', updateField);
        console.error('[ImageUpload] Record ID:', recordId);
        console.error('[ImageUpload] Collection:', collection);
        
        // Provide more helpful error message
        if (updateError.code === 'PGRST116') {
          throw new Error('Record not found. Please save the pitch first before uploading images.');
        } else if (updateError.message?.includes('column') && updateError.message?.includes('does not exist')) {
          throw new Error('Images column not found in database. Please run the SQL migration to add it.');
        } else {
          throw new Error(updateError.message || 'Failed to save images to database.');
        }
      }

      console.log('[ImageUpload] Successfully updated:', data);

      setImages(validUrls);
      if (onUploadComplete) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          onUploadComplete();
        }, 100);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      setErrorModal({ isOpen: true, message: `Failed to save images: ${errorMessage}` });
      // Keep the images that were successfully uploaded before the error
      setImages(uploadedUrls.filter((url): url is string => 
        typeof url === 'string' && url.trim().length > 0
      ));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = async (imageToRemove: string) => {
    setUploading(true);
    try {
      // Filter out the image to remove and any empty/null values
      const updatedImages = images
        .filter(img => img !== imageToRemove)
        .filter((img): img is string => typeof img === 'string' && img.trim().length > 0);

      // Use 'images' array field for complexes and pitches, 'image' single field for others
      const updateField = (fieldName === 'images' || collection === 'complexes' || collection === 'pitches')
        ? { images: updatedImages }
        : { image: updatedImages[0] || null };

      const { error: updateError } = await supabase
        .from(collection)
        .update(updateField)
        .eq('id', recordId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      setImages(updatedImages);
      if (onUploadComplete) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          onUploadComplete();
        }, 100);
      }
    } catch (error: any) {
      console.error('Remove error:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      setErrorModal({ isOpen: true, message: `Failed to remove image: ${errorMessage}` });
      // Revert to previous state on error
      setImages(images);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Upload Button */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxFiles}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxFiles}
          className="w-full bg-slate-900/60 border border-app-border overflow-hidden relative group text-white h-16 rounded-2xl font-black text-[11px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg uppercase tracking-widest"
        >
          {uploading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-primary">Uploading...</span>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/20">
                <span className="material-symbols-rounded text-xl">add_photo_alternate</span>
              </div>
              <span className="relative z-10">Add Images <span className="text-slate-400 font-bold ml-1 text-[9px]">({images.length}/{maxFiles})</span></span>
            </>
          )}
        </button>

        <p className="text-[9px] text-slate-400 mt-3 text-center font-bold uppercase tracking-widest leading-relaxed">
          PNG, JPG, WEBP • Max 5MB
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => {
            // Skip invalid images
            if (!image || typeof image !== 'string' || image.trim().length === 0) {
              return null;
            }
            return (
            <div key={`${image}-${index}`} className="relative aspect-square group">
              <div className="absolute inset-0 rounded-2xl border border-app-border overflow-hidden shadow-lg group-hover:border-primary/30 transition-colors bg-slate-800">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    console.error('Failed to load image:', image);
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EFailed%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <button
                onClick={() => handleRemoveImage(image)}
                disabled={uploading}
                className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-lg shadow-lg border border-app-border opacity-0 group-hover:opacity-100 transition-all active:scale-90 flex items-center justify-center z-10"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>
            );
          })}
          {images.length < maxFiles && !uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl bg-slate-900/60 border-2 border-dashed border-app-border flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all group"
            >
              <span className="material-symbols-rounded text-2xl group-hover:scale-110 transition-transform">add_circle</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-app-border rounded-3xl p-12 text-center group cursor-pointer hover:bg-slate-900/40 transition-colors"
        >
          <div className="w-16 h-16 bg-slate-800 rounded-2xl shadow-lg border border-app-border flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform">
            <span className="material-symbols-rounded text-3xl text-primary">landscape</span>
          </div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">No Images</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Click to upload images</p>
        </div>
      )}

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={errorModal.isOpen}
        title="Error"
        message={errorModal.message}
        confirmText="OK"
        cancelText=""
        type="danger"
        onConfirm={() => setErrorModal({ isOpen: false, message: '' })}
        onCancel={() => setErrorModal({ isOpen: false, message: '' })}
      />
    </div>
  );
};
