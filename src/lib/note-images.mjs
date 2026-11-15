// Markdown plugin for note images. Astro hands every attribute of a Markdown image to getImage(), so this sets:
// - format: AVIF. The notes are text-heavy screenshots; AVIF is about 40% smaller than WebP at the same width.
// - sizes: the real column width. Astro's default "100vw" made a sideways phone (844px wide) fetch the 2560px file
//   for an image shown 680px wide. Keep 680/724 in step with the note column (max-width:680px, 3vw side padding).
export const noteImages = {
  name: 'note-images',
  element: {
    filter: ['img'],
    visit(node, ctx) {
      if (!ctx.fileURL || !/\/src\/content\/notes\//.test(ctx.fileURL.pathname)) return;
      const props = node.properties ?? {};
      if (!('format' in props)) ctx.setProperty(node, 'format', 'avif');
      if (!('sizes' in props)) ctx.setProperty(node, 'sizes', '(min-width:724px) 680px, 94vw');
    },
  },
};
