import { preloadImage, rafPromise } from 'utils';

class Gallery {
  constructor() {
    this.imgSet = document.querySelector('.img-set');
    this.imgItems = [...document.querySelectorAll('.img-item')];
    this.images = [...document.querySelectorAll('.img')];

    this.preload().then(_ => this.init());
  }


  // Wait for all images to load before running the app
  async preload() {
    const imgPromises = this.images.map(img =>
      preloadImage(img.getAttribute('src')),
    );
    return Promise.all(imgPromises);
  }

  // "Boots" up the gallery
  init() {
    // wait for a fresh frame to do the work
    rafPromise().then(_ => {
      this.dimensions = this.images.map(img => this.getRect(img));
      this.imgSet.classList.add('loaded');
      console.log(this.dimensions);
    });
  }

  /**
   * Get original non-rotated element dimensions
   * @param {HTMLElement} el
   */
  getRect(el) {
    el.style.transform = 'rotate(0deg)';
    const rectObj = el.getBoundingClientRect();
    el.style.removeProperty('transform');
    return rectObj;
  }
}

new Gallery();
