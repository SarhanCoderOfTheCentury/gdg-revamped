# Performance changes

Static asset measurements; these are not network timing or Lighthouse scores.

| Measure | Before | After | Reduction |
|---|---:|---:|---:|
| home html bytes | 97,746 | 23,056 | 76.4% |
| home dom elements | 658 | 323 | 50.9% |
| home image elements | 128 | 19 | 85.2% |
| font bytes | 6,537,468 | 269,060 | 95.9% |
| css bytes | 282,399 | 33,894 | 88.0% |

The browser checks covered a 340 CSS pixel layout and desktop, visible mobile logo text, menu toggling, horizontal overflow, partners/gallery separation, event detail dialogs, event search, gallery photo navigation, speaker profiles, and required contact fields.

The font subsets preserve text used by the site plus Latin characters and common punctuation. Derivatives retain full size originals for opened photo albums. No photos or event records were removed.

Motion is limited to one partner strip on desktop. It pauses off screen and when the page is hidden. On phones and for reduced motion it becomes a static row.
