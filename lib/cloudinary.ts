import { v2 as cloudinary } from 'cloudinary';

let configured = false;

if (process.env.CLOUDINARY_URL) {
  // The SDK reads CLOUDINARY_URL automatically; set secure urls
  cloudinary.config({ secure: true });
  configured = true;
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure: true,
  });
  configured = true;
}

export async function uploadImageBuffer(buffer: Buffer, folder = 'wea/profiles', filename?: string): Promise<string> {
  if (!configured) {
    throw new Error('Cloudinary not configured');
  }

  return new Promise((resolve, reject) => {
    const publicId = filename ? filename.replace(/\.[^.]+$/, '') : undefined;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('No result from Cloudinary'));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}
