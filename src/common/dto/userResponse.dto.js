export const toUserResponse = (user) => {
    if (!user) return null;

    return {
        id: String(user._id ?? user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture ? String(user.profilePicture._id ?? user.profilePicture) : null,
        role: user.role,
        status: user.status,
        provider: user.provider,
    };
};
