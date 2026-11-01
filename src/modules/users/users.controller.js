import { matchedData } from "express-validator";

import { usersService } from "./users.service.js";
import { toUserResponse } from '../../common/dto/userResponse.dto.js';

const body = (req) => matchedData(req, { locations: ['body'] });

class UsersController {
    async updateProfile(req, res) {
        const data = body(req);
        const userId = req.user.id;

        const user = await usersService.update(userId, data);

        return res.json({ user: toUserResponse(user) });
    }
}

export const usersController = new UsersController();