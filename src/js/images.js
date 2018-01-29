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
    window.scroll(0, 0);
    this.imgSet.classList.add('is-loaded'); // fade the images in
    this.imgSet.addEventListener('click', this.onClick);
  }

  /**
   * Click handler
   * Stage 1 arrow method to bind to `this`
   * @param {Event} event
   */
  onClick = event => {
    event.preventDefault();

    // early exit
    if (this.imgSet.classList.contains('is-animating')) {
      return;
    }

    if (this.imgSet.classList.contains('is-expanded')) {
      this.animateOut();
    } else {
      this.animateIn();
    }
  };

  /**
   * FLIP (https://aerotwist.com/blog/flip-your-animations/)
   */
  async animateIn() {
    await rafPromise(); // wait for a fresh frame to do the work
    this.imgSet.classList.add('is-expanded'); // render the is-expanded state under a frame

    // Get original non-rotated element dimensions
    // This is needed because not all images have the same aspect ratio
    this.rectInfo = this.imgItems.map(img => img.getBoundingClientRect());

    this.imgSet.classList.remove('is-expanded'); // And return to normal


    // START THE ANIMATION
    this.imgSet.classList.add('is-animating', 'is-flat');

    // an array of promises to accomodate for mixed or staggered transition durations
    const animationPromises = this.imgItems.map((img, i) => {
      img.style.transform = `rotate(0deg) translateY(${this.rectInfo[i].y -
        60}px)`; // "magic" number (padding + margin)
      return listenOnce(img, 'transitionend');
    });
    // when all elements are done animating
    Promise.all(animationPromises).then(async () => {
      await rafPromise(); // wait for a fresh frame to do the work
      this.imgSet.classList.remove('is-animating');
      this.imgItems.forEach(img => img.removeAttribute('style'));
      this.imgSet.classList.add('is-expanded');
    });
  }

  async animateOut() {
    await rafPromise();
    this.imgSet.classList.remove('is-expanded');
  }
}

new ImageSet();
