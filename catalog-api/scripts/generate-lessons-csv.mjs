import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

const [file = 'samples/lessons-large.csv', total = '200000', courses = '3'] = process.argv.slice(2);
const out = createWriteStream(file);
out.write('courseId,title,order,contentUrl\n');
const perCourse = Math.ceil(Number(total) / Number(courses));
let written = 0;
for (let course = 1; course <= Number(courses); course++) {
  for (let order = 1; order <= perCourse && written < Number(total); order++, written++) {
    const line = `${course},Aula ${order} do curso ${course},${order},https://cdn.example.com/c${course}/${order}.mp4\n`;
    if (!out.write(line)) await once(out, 'drain');
  }
}
out.end();
await once(out, 'finish');
console.log(`${written} linhas em ${file}`);
