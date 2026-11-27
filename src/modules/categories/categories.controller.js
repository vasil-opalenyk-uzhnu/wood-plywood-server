import { matchedData } from "express-validator";

import { categoriesService } from "./categories.service.js";

import { toCategoryResponse, toCategoryAdminResponse } from '../../common/dto/categoryResponse.dto.js';
import { DEFAULT_LOCALE } from '../localization/localization.config.js';

const body = (req) => matchedData(req, { locations: ['body'] });

class CategoriesController {
    // -- public --

    async list(req, res) {
        const tree = await categoriesService.getTree(req.locale);

        return res.json({ categories: tree.map((node) => toCategoryResponse(node, req.locale)) });
    }

    async getBySlug(req, res) {
        const subtree = await categoriesService.getSubtreeBySlug(req.params.slug, req.locale);
        
        return res.json({ category: toCategoryResponse(subtree, req.locale) });
    }

    // -- admin --

    async adminList(req, res) {
        const tree = await categoriesService.getTree(DEFAULT_LOCALE);
        
        return res.json({ categories: tree.map(toCategoryAdminResponse) });
    }

    async adminGet(req, res) {
        const category = await categoriesService.getById(req.params.id);
        return res.json({ category: toCategoryAdminResponse(category) });
    }

    async create(req, res) {
        const category = await categoriesService.create(body(req));
    
        return res.status(201).json({ message: 'Category created successfully', category: toCategoryAdminResponse(category) });
    }
    
    async update(req, res) {
        const category = await categoriesService.update(req.params.id, body(req));
        
        return res.json({ category: toCategoryAdminResponse(category) });
    }
    
    async delete(req, res) {
        await categoriesService.delete(req.params.id);
    
        return res.json({ message: 'Category deleted successfully' });
    }
}

export const categoriesController = new CategoriesController();