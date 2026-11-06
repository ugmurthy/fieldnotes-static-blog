---
title: "Welcome: images, code, and video"
description: "A hands-on welcome article showing Markdown images, highlighted code, a native video player, and an embedded YouTube video."
published: "2026-11-06"
featured: true
---

Welcome to the blog! This article is a small playground for sharing ideas with words, pictures, code, and video.

Each section includes a live example and the source you can copy into another `.md` article. The examples use hosted media, so you can publish this file without downloading any companion images or videos. An internet connection is required to load that media.

## Images

An image can make an explanation much easier to follow. Here is a sample image hosted by MDN:

![A close-up of a pink grapefruit slice.](https://mdn.github.io/shared-assets/images/examples/grapefruit-slice.jpg)

The Markdown source is:

```markdown
![A close-up of a pink grapefruit slice.](https://mdn.github.io/shared-assets/images/examples/grapefruit-slice.jpg)
```

The words inside `![...]` are **alternative text**. Describe the information the image conveys, rather than using labels such as "image" or "photo". This helps people who use screen readers and readers whose images cannot load.

For your own image, save `welcome-photo.jpg` beside the article and use:

```markdown
![Describe your photograph here.](./welcome-photo.jpg)
```

Fieldnotes checks that relative Markdown image files exist, rewrites their URLs for the configured blog base, and copies supported media to the published site. You do not need to put `/blog` into a relative Markdown image link.

## Code

Use inline code for short names and commands, such as `site.config.json`, `blogposts/`, and `bun run build`.

For longer examples, use a fenced code block with a language name. This JavaScript block receives syntax highlighting:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

const message = greet("reader");
console.log(message);
```

If you run this JavaScript, it prints `Hello, reader!`. A code block only displays code; it does not execute it in the article.

To write that block in Markdown, surround it with three backticks and add the language after the opening fence:

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

const message = greet("reader");
console.log(message);
```
````

Other useful language labels include `python`, `json`, `bash`, `html`, and `css`. For example, here are the two configuration values for a standalone blog at `https://ugmurthy.github.io/blog/`:

```json
{
  "site": "https://ugmurthy.github.io",
  "base": "/blog"
}
```

These are an excerpt, not a complete site configuration. The origin stays in `site`; the project path belongs in `base`.

## A native video player

Markdown does not have a standard video-player syntax. Fieldnotes allows trusted HTML in articles, so use the browser's built-in `<video>` element:

<video controls playsinline preload="metadata" width="960" style="display: block; width: 100%; height: auto;">
  <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">
  Your browser does not support embedded video. <a href="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">Open the sample video instead</a>.
</video>

Press **Play** to watch the short flower clip. The player does not autoplay. Available controls, such as seeking, volume, picture-in-picture, and fullscreen, depend on your browser and device.

[Open the sample MP4 directly](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4) if the player cannot load.

The HTML source is:

```html
<video controls playsinline preload="metadata" width="960" style="display: block; width: 100%; height: auto;">
  <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">
  Your browser does not support embedded video. <a href="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">Open the sample video instead</a>.
</video>
```

`controls` makes the native player usable; `playsinline` permits inline playback on supported mobile browsers. `preload="metadata"` asks the browser to avoid loading the whole video immediately, although browsers decide how much to preload.

### Use a video stored with your article

If you save this article as `blogposts/getting-started/welcome-multimedia.md`, you can place your own `welcome-clip.mp4` in the same `getting-started/` folder. For a site mounted at `/blog`, the player source would be:

```html
<video controls playsinline preload="metadata" style="display: block; width: 100%; height: auto;">
  <source src="/blog/_media/getting-started/welcome-clip.mp4" type="video/mp4">
  Your browser does not support embedded video.
</video>
```

**Important:** raw HTML attributes such as `<source src="...">`, `<video poster="...">`, and `<iframe src="...">` are not automatically rewritten or file-checked by the Markdown link processor. Use the correct published URL. If your base is `/` instead of `/blog`, use `/_media/getting-started/welcome-clip.mp4`. Adjust the category path if you move the article or media.

MP4 and WebM files in the content folders are copied to `_media/` during the production build. Keep clips small and use your own media or media you have permission to publish. For videos with speech or meaningful audio, provide captions through an appropriately hosted caption track and include a transcript; this sample does not configure caption hosting.

## An embedded YouTube video

You can embed a YouTube player with an `<iframe>`. Here is **Big Buck Bunny**, an example animated film from the Blender Foundation:

<iframe width="560" height="315" style="display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border: 0;" src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ" title="Big Buck Bunny — YouTube video player" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

[Watch Big Buck Bunny on YouTube](https://www.youtube.com/watch?v=aqz-KE-bpKQ) if the embedded player is unavailable.

The HTML source is:

```html
<iframe width="560" height="315" style="display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border: 0;" src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ" title="Big Buck Bunny — YouTube video player" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
```

To embed a different video, replace `aqz-KE-bpKQ` with its YouTube video ID and update the title and fallback link. A normal `watch?v=...` address is a viewing-page URL, not an iframe embed URL; the player needs `/embed/VIDEO_ID`.

The `youtube-nocookie.com` address uses YouTube's privacy-enhanced embed endpoint, but it still contacts a third-party service. Playback depends on the video's embedding permissions, regional/age restrictions, browser privacy tools, and your host's security policy. Always keep a normal YouTube link as an alternative.

## Make this article your own

1. Save this file in your blog's `blogposts/getting-started/` folder. Its lowercase kebab-case filename supplies the article URL.
2. Edit the frontmatter title, description, and quoted publication date at the top. The site supplies the main heading, so use `##` for sections in the body.
3. Replace the demo image, video, and YouTube ID with your own examples. Hosted demos are convenient, but their availability is outside your control.
4. Run `bun run check` and `bun run build`, then preview the article and test the media players on your chosen host.

With `base: "/blog"`, this file at `blogposts/getting-started/welcome-multimedia.md` publishes at `/blog/getting-started/welcome-multimedia/`. With GitHub Pages enabled, pushing your article to your blog repository's `main` branch rebuilds the site.

Happy writing!
