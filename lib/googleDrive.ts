import { google } from "googleapis";
import { Readable } from "stream";

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

function getDriveClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
    });

    return google.drive({ version: "v3", auth });
}

export async function uploadVideoToDrive(
    buffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<{ fileId: string; webViewLink: string } | { error: string }> {
    try {
        const drive = getDriveClient();

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [FOLDER_ID],
            },
            media: {
                mimeType,
                body: readable,
            },
            fields: "id,webViewLink",
        });

        const fileId = response.data.id!;
        const webViewLink = response.data.webViewLink!;

        // Make file publicly viewable
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        return { fileId, webViewLink };
    } catch (err: any) {
        console.error("Google Drive upload error:", err?.message ?? err);
        return { error: err?.message ?? "Google Drive upload failed" };
    }
}
