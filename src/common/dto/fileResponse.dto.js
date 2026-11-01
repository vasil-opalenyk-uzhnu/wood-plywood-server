export const toFileResponse = (file) => {
    if (!file) return null;

    return {
        id: String(file._id ?? file.id),
        url: file.path,
        type: file.type,
        status: file.status,
    };
};
