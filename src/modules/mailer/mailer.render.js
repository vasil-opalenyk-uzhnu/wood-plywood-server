import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates');

const read = (file) => fs.readFileSync(path.join(dir, file), 'utf8');

const layout = Handlebars.compile(read('layouts/base.hbs'));

const cache = {};

export function render(name, { title, footer, ...data }) {
    cache[name] ??= Handlebars.compile(read(`${name}.hbs`));

    const body = cache[name](data);
    return layout({ title, footer, body });
}