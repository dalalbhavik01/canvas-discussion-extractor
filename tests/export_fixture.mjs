import fs from 'node:fs/promises';
import { fixture } from './discussion.test.mjs';

const data = fixture();
const first = data.sections[0];
first.students[0].name = '=Literal author name';
first.entries[0].text = '=SUM(1,2)\n\u00c9lodie \u2014 \ud83d\ude00\n_x0041_';
first.entries[0].source_text = first.entries[0].text;
first.entries[1].text = "'A literal apostrophe starts this post.";
first.entries[1].source_text = first.entries[1].text;
first.students[2].name = '00123';
const second = structuredClone(first);
second.key = 'cohort-B'; second.label = 'Synthetic Cohort B';
data.sections.push(second);
await fs.writeFile(process.argv[2], JSON.stringify(data, null, 2), { flag: 'wx' });
