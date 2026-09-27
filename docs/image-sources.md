# Image Sources and Provenance — The Nest / Бунгала „Гнездото"

This document records the provenance, exact dimensions, and current website role of the 19 genuine property photographs in the active production set. The source pool in `research-images/` remains intact and is not part of the active UI.

## Source archives

- [Pochivka.bg](https://pochivka.bg/bungala-gnezdoto-o35202) — official profile listing `o35202`
- [Airbnb listing 1](https://www.airbnb.com/rooms/1518207915595474183)
- [Airbnb listing 2](https://www.airbnb.com/rooms/1528123016093480745)
- [Booking.com](https://www.booking.com/hotel/bg/bungala-gnezdoto-bungalows-the-nest.bg.html)
- [Facebook](https://www.facebook.com/bungalagnezdoto/)

## Active production photography — 19 images

| File path                                   | Category          | Subject                                  | Source archive / source file                 | Dimensions  | Current website role                        |
| ------------------------------------------- | ----------------- | ---------------------------------------- | -------------------------------------------- | ----------- | ------------------------------------------- |
| `exterior/bungalow-flowering-veranda.jpeg`  | Exterior          | Wooden bungalow with flowering veranda   | Airbnb 2 / `bungalows-golden-hour.jpeg`      | 1440 × 960  | Homepage hero, exterior/gallery             |
| `exterior/three-bungalows-aerial.jpg`       | Exterior          | Elevated overview of all three cabins    | Pochivka.bg / `three-bungalows-aerial.jpg`   | 1280 × 853  | Exterior/gallery, location context          |
| `exterior/bungalow-daylight-garden.jpeg`    | Exterior          | Bungalow and lawn in daylight            | Airbnb 2 / `bungalow-daylight-garden.jpeg`   | 1440 × 960  | Homepage supporting image, exterior/gallery |
| `exterior/bungalow-wooden-facade.jpeg`      | Exterior          | Wooden facade and private veranda        | Airbnb 1 / `bungalow-front-daylight.jpeg`    | 1440 × 892  | Exterior/gallery                            |
| `exterior/bungalow-twilight-veranda.jpeg`   | Exterior          | Warm veranda lighting at dusk            | Airbnb 1 / `bungalow-night-lit.jpeg`         | 1440 × 960  | Exterior/gallery                            |
| `rooms/room-interior-wide.jpeg`             | Rooms             | Full room with twin beds and sofa        | Airbnb 1 / `room-interior-wide.jpeg`         | 1200 × 800  | Accommodation lead/gallery                  |
| `rooms/room-twin-beds-close.jpg`            | Rooms             | Close twin-bed view                      | Pochivka.bg / `room-sofa-bed.jpg`            | 1280 × 853  | Accommodation/gallery                       |
| `rooms/room-twin-beds-tv-view.jpg`          | Rooms             | Twin beds and television                 | Pochivka.bg / `room-window-to-garden.jpg`    | 1280 × 853  | Accommodation/gallery                       |
| `rooms/room-sofa-tv-area.jpg`               | Rooms             | Sofa and television seating area         | Pochivka.bg / `room-interior-seating.jpg`    | 1280 × 853  | Accommodation/gallery                       |
| `kitchenette/kitchenette-counter.jpg`       | Kitchenette       | Private kitchenette counter              | Pochivka.bg / `kitchenette-counter.jpg`      | 1280 × 853  | Accommodation/gallery                       |
| `bathroom/bathroom-full-view.jpeg`          | Bathroom          | Ensuite bathroom and shower              | Airbnb 1 / `bathroom-full-view.jpeg`         | 1080 × 1620 | Accommodation/gallery                       |
| `shared/shared-communal-kitchen.jpg`        | Shared facilities | Covered communal summer kitchen          | Pochivka.bg / `shared-communal-kitchen.jpg`  | 1280 × 960  | Homepage supporting image, shared/gallery   |
| `shared/shared-outdoor-cooking-gazebo.jpeg` | Shared facilities | Covered outdoor cooking gazebo           | Airbnb 1 / `shared-gazebo-grill.jpeg`        | 1152 × 2560 | Shared/gallery                              |
| `shared/shared-covered-veranda.jpeg`        | Shared facilities | Covered veranda with dining table        | Airbnb 1 / `covered-veranda-dining.jpeg`     | 1440 × 2160 | Shared/gallery                              |
| `garden/garden-veranda-walkway.jpeg`        | Garden            | Walkway beside the verandas              | Airbnb 1 / `garden-stone-path.jpeg`          | 1200 × 1600 | Homepage supporting image, garden/gallery   |
| `garden/veranda-geraniums.jpeg`             | Garden            | Geraniums on veranda railing             | Airbnb 1 / `bungalows-golden-hour-alt.jpeg`  | 1200 × 800  | Garden/gallery                              |
| `brand/brand-entrance-sign.jpeg`            | Brand/detail      | Hand-carved entrance sign                | Airbnb 1 / `brand-entrance-sign.jpeg`        | 1440 × 960  | Contact/brand/gallery                       |
| `brand/brand-bungalow-keychain.jpeg`        | Brand/detail      | Wooden bungalow keychain                 | Airbnb 1 / `shared-rustic-interior.jpeg`     | 1200 × 822  | Brand/gallery                               |
| `location/location-sea-view-aerial.jpg`     | Location          | Cabins, Lozenets greenery, and Black Sea | Pochivka.bg / `location-sea-view-aerial.jpg` | 1280 × 853  | Location/gallery                            |

## Curation notes

The active hero is `exterior/bungalow-flowering-veranda.jpeg`: it is the larger and cleaner version of the flowering-veranda/golden-hour scene. The 1280 × 853 `bungalows-golden-hour.jpg` copy is retained on disk as a historical/source duplicate but is retired from active UI use.

The set intentionally keeps one representative image for each meaningful view and category. Portrait images are retained where they communicate the bathroom, gazebo, veranda, or garden path better than a forced landscape crop. No image bytes were modified during curation.

## Retired from active UI — preserved on disk

These seven production files remain available for historical/source reference but are no longer imported or rendered by the application:

- `exterior/bungalows-golden-hour.jpg`
- `rooms/room-twin-beds.jpg`
- `garden/garden-stone-path.jpeg`
- `garden/garden-dogs-on-lawn.jpeg`
- `kitchenette/kitchenette-utensils.jpg`
- `shared/shared-evening-pavilion-at-dusk.jpeg`
- `brand/brand-bird-keychain-in-hand.jpg`

## Research archive

The `research-images/` tree remains the source pool. It includes the original downloads and provenance material from Pochivka.bg, Airbnb, Booking.com, Facebook, and other research sources. It was not renamed, deleted, or rewritten during this pass.

## Approval and licensing context

The photographs were gathered from public marketing listings and verified property profiles. The `approved` flag in `src/data/gallery.ts` remains `false` until the owner formally approves the website launch. Owners can provide camera originals later using the same production paths without changing application references.
