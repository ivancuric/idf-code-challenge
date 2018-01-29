/* polyfills */
import 'babel-polyfill';
import 'whatwg-fetch';

import { createFragment } from 'utils';
import webfontloader from 'webfontloader';

webfontloader.load({
  google: {
    families: ['Roboto:400,700:latin', 'Roboto Condensed:400:latin'],
  },
});

const area = document.querySelector('.idf-widget-area');
const url = area.dataset.url;

(async () => {
  const content = await fetch(url).then(response => response.json());
  area.appendChild(createFragment(content.body));
})();
