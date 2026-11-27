import { categories } from './categories.model.js';

import { localizationService } from '../localization/localization.service.js';
import { DEFAULT_LOCALE } from '../localization/localization.config.js';

import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/AppError.js';

const MAX_DEPTH = 3;

const collectDescendantIds = (node, acc = []) => {
    for (const child of node.children) {
        acc.push(String(child._id));
        collectDescendantIds(child, acc);
    }
    return acc;
};

const depthOf = (node, nodes) => {
    const seen = new Set();
    let depth = 1;
    let current = node;

    while (current.parentId && !seen.has(String(current._id))) {
        seen.add(String(current._id));
        current = nodes.get(String(current.parentId));
        if (!current) break;
        depth++;
    }

    return depth;
};

const heightOf = (node) => 1 + Math.max(0, ...node.children.map(heightOf));

class CategoriesService {
    findById(id) {
        return categories.findById(id);
    }

    findByIds(ids) {
        return categories.find({ _id: { $in: ids } });
    }

    findBySlug(slug) {
        return categories.findOne({ slug });
    }

    findByParentId(parentId = null) {
        return categories.find({ parentId });
    }

    findAll() {
        return categories.find();
    }

    hasChildren(id) {
        return categories.exists({ parentId: id });
    }

    async buildTree(locale = DEFAULT_LOCALE) {
        const list = await categories.find().lean();

        const nodes = new Map(list.map(category => [String(category._id), { ...category, children: [] }]));
        const roots = [];

        for (const node of nodes.values()) {
            const parent = node.parentId ? nodes.get(String(node.parentId)) : null;
            (parent ? parent.children : roots).push(node);
        }

        const byTitle = (a, b) => (localizationService.pick(a.title, locale) ?? '')
            .localeCompare(localizationService.pick(b.title, locale) ?? '', locale);

        roots.sort(byTitle);
        for (const node of nodes.values()) node.children.sort(byTitle);

        return { roots, nodes };
    }

    async getById(id) {
        const category = await categories.findById(id);
        if (!category) throw new NotFoundError('categoryNotExist');
        return category;
    }

    async getTree(locale) {
        const { roots } = await this.buildTree(locale);
        return roots;
    }

    async getSubtree(id, locale) {
        const { nodes } = await this.buildTree(locale);
        
        const node = nodes.get(String(id));
        if (!node) throw new NotFoundError('categoryNotExist');
        
        return node;
    }

    async getSubtreeBySlug(slug, locale) {
        const { nodes } = await this.buildTree(locale);
        
        const node = [...nodes.values()].find((n) => n.slug === slug);
        if(!node) throw new NotFoundError('categoryNotExist');

        return node;
    }

    async getDescendantIds(id) {
        const { nodes } = await this.buildTree();

        const node = nodes.get(String(id));
        if(!node) throw new NotFoundError('categoryNotExist');

        return collectDescendantIds(node);
    }

    async assertParentValid(parentId, selfId = null) {
        if(!parentId) return;

        const { nodes } = await this.buildTree();

        const parent = nodes.get(String(parentId));
        if(!parent) throw new NotFoundError('parentNotExist');

        let subtreeHeight = 1;

        if(selfId) {
            if (String(parentId) === String(selfId)) {
                throw new BadRequestError('categoryCannotBeOwnParent');
            }

            const self = nodes.get(String(selfId));
            if(self) {
                if (collectDescendantIds(self).includes(String(parentId))) {
                    throw new BadRequestError('categoryCannotMoveIntoDescendant');
                }
                subtreeHeight = heightOf(self);
            }
        }

        if(depthOf(parent, nodes) + subtreeHeight > MAX_DEPTH) {
            throw new BadRequestError('categoryTooDeep');
        }
    }

    async create(createCategoryDto) {
        if(await categories.exists({ slug: createCategoryDto.slug })) {
            throw new ConflictError('slugAlreadyExists');
        }

        await this.assertParentValid(createCategoryDto.parentId);

        return categories.create({
            title: createCategoryDto.title,
            slug: createCategoryDto.slug,
            parentId: createCategoryDto.parentId ?? null,
        });
    }

    async update(id, updateCategoryDto) {
        const category = await categories.findById(id);
        if (!category) throw new NotFoundError('categoryNotExist');
    
        if(updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
            if(await categories.exists({ slug: updateCategoryDto.slug, _id: { $ne: id } })) {
                throw new ConflictError('slugAlreadyExists');
            }
            category.slug = updateCategoryDto.slug;
        }

        if(updateCategoryDto.parentId !== undefined) {
            const changed = String(updateCategoryDto.parentId ?? '') !== String(category.parentId ?? '');

            if(changed) {
                await this.assertParentValid(updateCategoryDto.parentId, id);
                category.parentId = updateCategoryDto.parentId;
            }
        }

        if (updateCategoryDto.title && Object.values(updateCategoryDto.title).some(value => value !== undefined)) {
            category.title = updateCategoryDto.title;
        }

        return category.save();
    }

    async delete(id) {
        const category = await categories.findById(id);
        if(!category) throw new NotFoundError('categoryNotExist');

        if(await this.hasChildren(id)) {
            throw new ConflictError('categoryHasChildren');
        }

        await category.deleteOne();
    }
}

export const categoriesService = new CategoriesService();