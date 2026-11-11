import { boot } from './film.js';

const canvas = document.getElementById('c');
boot(canvas).catch((err) => {
  console.error(err);
  throw err;
});
