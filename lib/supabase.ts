import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key - never expose to client)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function uploadVideoToSupabase(
    file: Blob,
    userId: string,
    attempt: number
): Promise<{ url: string | null; error: string | null }> {
    const ext = file.type.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `interviews/${userId}/attempt-${attempt}-${Date.now()}.${ext}`;

    const uploadOptions = {
        contentType: file.type || "video/webm",
        upsert: true,
    };

    let result = await supabaseAdmin.storage
        .from("interview-videos")
        .upload(fileName, file, uploadOptions);

    if (result.error && result.error.message.includes('Bucket not found')) {
        // Create bucket if it doesn't exist
        await supabaseAdmin.storage.createBucket('interview-videos', { public: true });
        // Retry upload
        result = await supabaseAdmin.storage
            .from("interview-videos")
            .upload(fileName, file, uploadOptions);
    }

    if (result.error) {
        console.error("Supabase upload error:", result.error);
        return { url: null, error: result.error.message };
    }

    const {
        data: { publicUrl },
    } = supabaseAdmin.storage.from("interview-videos").getPublicUrl(result.data!.path);

    return { url: publicUrl, error: null };
}
