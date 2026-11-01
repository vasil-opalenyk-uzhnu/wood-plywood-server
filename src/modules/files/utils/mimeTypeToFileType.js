import { FilesType } from "../files.type.js"

export const mimeTypeToFileType = (mimeType) => {
    if(mimeType.startsWith('image/')) return FilesType.image;
    if(mimeType.startsWith('video/')) return FilesType.video;

    return FilesType.other;
}