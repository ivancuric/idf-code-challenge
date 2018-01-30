/**
 * Preload an image
 * @param {URL} url - The image URL
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image at ' + url));
  });
}

/**
 * Generic 'run once'
 * @param {Node} element - Element
 * @param {Event} event - Event to listen
 */

export function listenOnce(element, ...events) {
  return new Promise(resolve => {
    const onEvent = event => {
      // prevent event bubbling
      event.stopPropagation();
      events.forEach(event => {
        element.removeEventListener(event, onEvent);
      });
      resolve(event);
    };
    events.forEach(event => {
      element.addEventListener(event, onEvent);
    });
  });
}

/**
 * Remove element
 * @param {HTMLElement} el
 */
export function removeElement(el) {
  el.parentNode.removeChild(el);
}

/**
 * Create HTML Fragment from a html string
 * @param {String} html - A snippet of HTML
 * @returns {DocumentFragment}
 */
export function createFragment(html) {
  return document.createRange().createContextualFragment(html);
}

/**
 * A Promise wrapper for requestAnimationFrame
 */
export function rafPromise() {
  return new Promise(requestAnimationFrame);
}
