import { preloadImage, rafPromise, listenOnce } from 'utils';

// I like the class approach. Less semicolons.
class ImageSet {
  constructor() {
    this.imgSet = document.querySelector('.img-set');
    this.imgItems = [...document.querySelectorAll('.img-item')];
    this.images = [...document.querySelectorAll('.img')];

    this.preload().then(_ => this.init());
  }

  // Wait for all images to load before showing them and running the app
  preload() {
    const imgPromises = this.images.map(img =>
      preloadImage(img.getAttribute('src')),
    );
    return Promise.all(imgPromises);
  }

  // "Boots" up the image set
  async init() {
    await rafPromise(); // wait for a fresh frame to do the work
    this.imgSet.classList.remove('animatable'); // in case of reinitialization
    this.imgSet.classList.add('expanded'); // render the expanded state under a frame

    // Get original non-rotated element dimensions
    this.rectInfo = this.imgItems.map(img => img.getBoundingClientRect());

    this.imgSet.classList.remove('expanded'); // And return to normal
    this.imgSet.classList.add('loaded'); // fade the images in

    document.addEventListener('click', () => this.animate());
  }

  /**
   * A "FLIP" animation technique (https://aerotwist.com/blog/flip-your-animations/)
   */
  animate() {
    this.imgSet.classList.add('animatable', 'flat');
    document.documentElement.scrollTop = 0;
    // feeding an array of promises to resolve to accomodate for mixed or staggered transition durations
    const animationPromises = this.imgItems.map((img, i) => {
      img.style.transform = `rotate(0deg) translateY(${this.rectInfo[i].y - 60}px)`; // magic number (padding + margin)
      return listenOnce(img, 'transitionend');
    });
    // when all elements are done animating
    Promise.all(animationPromises).then(async () => {
      await rafPromise(); // wait for a fresh frame to do the work
      this.imgSet.classList.remove('animatable');
      this.imgItems.forEach(img => img.removeAttribute('style'));
      this.imgSet.classList.add('expanded');
    });
  }
}

new ImageSet();
