IDF Frontend Code Challenge
===========================

## The excuse for the build process
A build process is present in order to showcase an example of a project architecture and to enable me to write ES7 with backwards compatibility.

Since I will get bonus cookie points 🍪 for making things backwards-compatible, I just went all out with the build process.

The original idea was to just write plain CSS and JS, like Surma and Paul did in [Supercharged](https://www.youtube.com/watch?v=JkXZ35MSLaE) (We'll miss you Paul), but their target browser is only Chrome Stable / Canary.

I did not take file sizes into account for these examples, but just loaded `babel-polyfill` and `whatwg-fetch`. Usually I would have an entry file that would conditionally load a legacy or modern browser bundle using feature detection.

Both code examples are served from the same build process.

The only 3rd party non-dev library used is [sanitize.css](https://jonathantneal.github.io/sanitize.css/).

## How to run
Install with `yarn install` or `npm install` and run `yarn start` or `npm start`.
The server should run on [`localhost:3000`](http://localhost:3000) hosting the html from `/dist/html`.

The pages will then available on the following urls:

**Images:** [http://localhost:3000/images](http://localhost:3000/images)  
**Widget:** [http://localhost:3000/widget](http://localhost:3000/widget)
