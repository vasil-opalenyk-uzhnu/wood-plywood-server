import { FilesType } from "../files.type.js"

export const filesTypeToCloudinaryResourceType = (type) => {
    if(type === FilesType.image) return 'image';
    if(type === FilesType.video) return 'video';
    
    return 'raw';
}