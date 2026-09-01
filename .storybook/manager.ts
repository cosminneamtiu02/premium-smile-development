import { addons } from 'storybook/manager-api';

// Manager (the Storybook UI around the story), not the preview: nothing here
// reaches a story, a test or a visual baseline — the visual net loads
// iframe.html directly and never sees this file.
//
// The addons panel docks to the RIGHT by default. With it at the bottom, the
// canvas on a laptop window is only ~300–480px tall, and the viewport tool
// sizes the story's iframe to the canvas HEIGHT (see manager-head.html for the
// other half of that story). A top-layer <dialog> — ui/Modal, sections/
// ContactModal — never lets its panel exceed the iframe's viewport minus 2rem,
// so inside a 300px-tall preview it was a 268px sliver scrolling internally:
// the picture the owner's never-scroll rule forbids, produced by the manager's
// geometry rather than by any phone. Docked right, the canvas keeps the whole
// window height and a phone-sized story shows a phone-sized dialog.
// Toggle at any time with the D shortcut; a browser that remembered "bottom"
// from before this line keeps its own preference until D is pressed once.
addons.setConfig({
  layout: { panelPosition: 'right' },
});
