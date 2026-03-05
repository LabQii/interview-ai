import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadVideoToCloudinary(
    buffer: Buffer,
    publicId: string
): Promise<{ url: string } | { error: string }> {
    return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "video",
                folder: "interview-videos",
                public_id: publicId,
                overwrite: true,
            },
            (error, result) => {
                if (error || !result) {
                    console.error("Cloudinary upload error:", error);
                    resolve({ error: error?.message ?? "Upload failed" });
                } else {
                    resolve({ url: result.secure_url });
                }
            }
        );

        uploadStream.end(buffer);
    });
}
