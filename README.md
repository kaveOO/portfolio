# kaveo.dev

My portfolio: case studies and notes on game security and full-stack work.

![kaveo.dev landing page](.github/hero.jpg)

Built with Astro. The glass lens is WebGL: it redraws the text under it on a canvas and refracts it, so the page itself stays plain HTML. The code is in `src/scripts/lens.js`.

## Run

Node 22 and Python 3.

```sh
npm install
npm run dev
npm run build
```

The home page is generated from `design/Lens Portfolio.dc.html`. Edit that file, then run `npm run sync:design`.

Notes go in `src/content/notes/`, case studies in `src/content/projects/`. The fields are listed in `src/content.config.ts`.

Pushes to `main` deploy to Cloudflare Pages.

## License

Code: [MIT](LICENSE). Content (writing, images, CV, name and logo): all rights reserved, see [CONTENT-LICENSE.md](CONTENT-LICENSE.md).
