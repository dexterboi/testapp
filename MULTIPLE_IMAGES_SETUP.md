# Multiple Images Support for Complexes and Pitches

## ✅ What's Been Updated

Your app now supports **multiple images** for both complexes and pitches!

### Changes Made:

1. **SQL Migration Created** (`add_pitch_multiple_images.sql`)
   - Adds `images` array field to pitches table
   - Migrates existing single `image` to `images` array
   - Keeps old `image` field for backward compatibility

2. **ImageUpload Component Updated**
   - Now supports `images` field for pitches
   - Handles both single `image` and multiple `images` fields
   - Works for both complexes and pitches

3. **UI Components Updated**
   - **PitchDetailsPage**: Shows gallery of all pitch images
   - **ComplexDetailPage**: Pitch cards show first image from array
   - **Owner Dashboard**: Pitch settings modal supports multiple images
   - **Image Viewer**: Works with multiple images for pitches

## 🚀 What You Need to Do

### Step 1: Run the SQL Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `add_pitch_multiple_images.sql`
3. Paste and run it
4. This will:
   - Add `images` column to pitches table
   - Migrate existing `image` values to `images` array
   - Keep `image` column (for backward compatibility)

### Step 2: Test the Feature

1. **As Owner:**
   - Go to Owner Dashboard → Complex & Pitch Settings
   - Click on a pitch to edit
   - Upload multiple images (up to 10)
   - Images will be saved to `images` array

2. **As User:**
   - View a pitch detail page
   - See the main image in the header
   - See a gallery of all images below (if more than 1)
   - Click any image to view full-size in ImageViewer

## 📸 How It Works

### For Complexes:
- Already supported multiple images ✅
- Field: `images` (TEXT[])
- Max: 10 images
- Upload via: Owner Dashboard → Complex & Pitch Settings → Images tab

### For Pitches:
- Now supports multiple images ✅
- Field: `images` (TEXT[])
- Max: 10 images
- Upload via: Owner Dashboard → Complex & Pitch Settings → Pitches tab → Edit pitch

## 🔄 Backward Compatibility

The code handles both:
- Old format: `pitch.image` (single image)
- New format: `pitch.images` (array of images)

If a pitch has both, it will use `images` array first, then fall back to `image`.

## 📝 Database Schema

**Before:**
```sql
pitches.image TEXT  -- Single image
```

**After:**
```sql
pitches.image TEXT      -- Kept for compatibility
pitches.images TEXT[]   -- Multiple images (new)
```

## 🎯 Features

- ✅ Upload multiple images per pitch (up to 10)
- ✅ Upload multiple images per complex (up to 10)
- ✅ Gallery view on detail pages
- ✅ Image viewer modal for full-size viewing
- ✅ Remove individual images
- ✅ First image used as main/hero image
- ✅ Backward compatible with single image field

## 🐛 Troubleshooting

**Images not showing?**
- Make sure you ran the SQL migration
- Check that images are uploaded to Supabase Storage
- Verify RLS policies allow viewing images

**Can't upload images?**
- Check that you're logged in as owner
- Verify storage bucket permissions
- Check browser console for errors

**Old images not migrated?**
- Run the migration again (it's idempotent)
- Or manually update: `UPDATE pitches SET images = ARRAY[image] WHERE image IS NOT NULL;`
