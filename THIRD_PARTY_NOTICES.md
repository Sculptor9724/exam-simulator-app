# Third-party notices

Original AI Voice Exam code is licensed under the [MIT license](LICENSE), with
Erhvervsakademi København (EK) as copyright holder. Third-party code and assets
retain their respective licences, as listed below.

The Google-derived files listed below remain Apache-2.0, including local adaptations. The combined code
uses `MIT AND Apache-2.0`, not a choice between licenses. MIT does not relicense
upstream code. Dependencies retain their own licenses, separately from this map.

## License overview

| Material | License / status |
| --- | --- |
| Original AI Voice Exam code and generated illustrations, excluding third-party material listed below | MIT; see LICENSE |
| Files listed in the Google upstream table below, including local adaptations | Apache-2.0 |
| Inline Heroicons and Tabler icon geometry listed below | MIT with the upstream copyright notices in LICENSES/ |
| Installed dependencies | Their respective licenses; not bundled in the source-only snapshot |

This document is the central file-level license map. Original MIT code does not
need repeated license headers. Existing upstream notices are retained. Modified
Apache files carry a short modification notice as required by Apache-2.0 section
4(b); the central overview does not replace that requirement.

## Google upstream

Source: https://github.com/google-gemini/multimodal-live-api-web-console
Copyright 2024 Google LLC (where stated in the source headers).
Full license: LICENSES/Apache-2.0.txt.

The following files derive from Google's project and are licensed under Apache-2.0.
Original copyright and licence headers are retained. Adapted files carry local
modification notices.

| Local file | Upstream file | Local adaptations |
| --- | --- | --- |
| `.gcloudignore` | `.gcloudignore` | None |
| `.gitignore` | `.gitignore` | Modified |
| `app.yaml` | `app.yaml` | None |
| `public/index.html` | `public/index.html` | Modified |
| `public/robots.txt` | `public/robots.txt` | None |
| `src/App.scss` | `src/App.scss` | Modified |
| `src/App.test.tsx` | `src/App.test.tsx` | None |
| `src/App.tsx` | `src/App.tsx` | Modified |
| `src/features/ai-examiner/components/control-tray/ControlTray.tsx` | `src/components/control-tray/ControlTray.tsx` | Modified |
| `src/features/ai-examiner/components/control-tray/control-tray.scss` | `src/components/control-tray/control-tray.scss` | Modified |
| `src/index.css` | `src/index.css` | None |
| `src/index.tsx` | `src/index.tsx` | Modified |
| `src/multimodal-live-types.ts` | `src/multimodal-live-types.ts` | Modified |
| `src/react-app-env.d.ts` | `src/react-app-env.d.ts` | Modified |
| `src/reportWebVitals.ts` | `src/reportWebVitals.ts` | None |
| `src/setupTests.ts` | `src/setupTests.ts` | None |
| `src/shared/components/AudioPulse.tsx` | `src/components/audio-pulse/AudioPulse.tsx` | Modified |
| `src/shared/components/audio-pulse.scss` | `src/components/audio-pulse/audio-pulse.scss` | Modified |
| `src/shared/contexts/LiveAPIContext.tsx` | `src/contexts/LiveAPIContext.tsx` | Modified |
| `src/shared/hooks/use-live-api.ts` | `src/hooks/use-live-api.ts` | Modified |
| `src/shared/hooks/use-media-stream-mux.ts` | `src/hooks/use-media-stream-mux.ts` | None |
| `src/shared/hooks/use-screen-capture.ts` | `src/hooks/use-screen-capture.ts` | Modified |
| `src/shared/hooks/use-webcam.ts` | `src/hooks/use-webcam.ts` | Modified |
| `src/shared/lib/audio-recorder.ts` | `src/lib/audio-recorder.ts` | Modified |
| `src/shared/lib/audio-streamer.ts` | `src/lib/audio-streamer.ts` | Modified |
| `src/shared/lib/audioworklet-registry.ts` | `src/lib/audioworklet-registry.ts` | None |
| `src/shared/lib/genai-live-client.ts` | `src/lib/multimodal-live-client.ts` | Modified |
| `src/shared/lib/utils.ts` | `src/lib/utils.ts` | Modified |
| `src/shared/lib/worklets/audio-processing.ts` | `src/lib/worklets/audio-processing.ts` | Modified |
| `src/shared/lib/worklets/vol-meter.ts` | `src/lib/worklets/vol-meter.ts` | None |
| `src/types.ts` | [`src/types.ts`](https://github.com/google-gemini/live-api-web-console/blob/main/src/types.ts) | Modified |
| `tsconfig.json` | `tsconfig.json` | None |

## Dependencies

npm dependencies retain their respective licences. Package manifests and lockfiles
reference these dependencies; the project's licence does not replace theirs.
When distributing compiled bundles, include the required dependency licence texts
and notices. The postbuild copy includes the checked-in notices, not a complete
set of dependency notices.

## Distribution

`npm run build` copies LICENSE, NOTICE, this inventory and all licence texts in LICENSES/ into
`build/licenses/` through a simple postbuild copy command. Keep that directory with deployed
bundles and exported build archives. Source distributions must include these root
files and LICENSES/. Dependency-generated license comments must also be retained.

## Generated illustrations

The waiting-room illustrations `door.svg`, `radio.svg` and `watch.svg` in
`src/features/ai-examiner/components/ExamDeliberationScreen/` are included under the project's MIT license.

## Inline icons included in source

Heroicons SVG paths match the [v1.0.6 source](https://github.com/tailwindlabs/heroicons/tree/v1.0.6/optimized).
Copyright (c) 2020 Refactoring UI Inc. MIT text and copyright notice are retained
in `LICENSES/Heroicons-MIT.txt`. Entries marked adapted contain local changes
to the icon geometry.
The attribution applies to the icon geometry, not the entire containing file.

| Containing file | Heroicons names (outline unless marked solid) |
| --- | --- |
| `src/features/ai-examiner/components/ExamRatingModal.tsx` | check |
| `src/features/ai-examiner/components/UnsupportedBrowserModal.tsx` | exclamation |
| `src/features/classes/components/ClassCard.tsx` | book-open, chart-bar, clock, cog, eye |
| `src/features/classes/pages/ClassDetails.tsx` | chart-bar, chevron-left, emoji-happy (adapted), pencil-alt, trash, x |
| `src/features/classes/pages/Classes.tsx` | plus-sm |
| `src/features/classes/pages/JoinClass.tsx` | exclamation-circle |
| `src/features/dashboard/components/ClassesOverview.tsx` | book-open, chart-bar, clock |
| `src/features/dashboard/components/ExamLogsList.tsx` | chevron-down |
| `src/features/dashboard/components/NoClasses.tsx` | office-building |
| `src/features/dashboard/components/NoExams.tsx` | clipboard |
| `src/features/dashboard/components/StatsOverview.tsx` | chart-bar, clock, document-text |
| `src/features/exams/components/ExamCardCompact.tsx` | chart-bar, clock, duplicate, pencil-alt, play, stop |
| `src/features/exams/components/ExamCarousel.tsx` | chevron-left, chevron-right |
| `src/features/exams/components/ExamSimulatorCard.tsx` | chart-bar, clock, duplicate, globe-alt, lock-closed, pencil-alt, play, stop |
| `src/features/exams/components/FilterChips.tsx` | clock, globe-alt, office-building, solid/star |
| `src/features/exams/components/TaskExamplesInput.tsx` | document-text, plus, trash |
| `src/features/exams/pages/ExamEditor.tsx` | annotation, arrow-left, chart-bar, chat-alt, check, clipboard, clock, document-text, information-circle, microphone, question-mark-circle (adapted), trash, x |
| `src/features/exams/pages/ExamFinished.tsx` | chart-bar, check-circle, exclamation (adapted), star |
| `src/features/exams/pages/ExamStatistics.tsx` | arrow-left, emoji-happy (adapted) |
| `src/features/exams/pages/ExamsPage.tsx` | check, desktop-computer, emoji-sad, globe-alt, office-building, plus-sm, solid/star |
| `src/features/exams/pages/StudentResults.tsx` | chevron-left, chevron-right |
| `src/features/landing/pages/LandingPage.tsx` | adjustments, check-circle, check, clipboard |
| `src/features/landing/pages/WaitlistPage.tsx` | check |
| `src/layout/Layout.tsx` | menu, x |

Tabler's `dots-vertical` geometry matches the
[v1.119.0 source](https://github.com/tabler/tabler-icons/blob/v1.119.0/icons/dots-vertical.svg).
Copyright (c) 2020-2022 Paweł Kuna. The MIT text and copyright notice are included
in `LICENSES/Tabler-MIT.txt`.
The icon occurs in:

- `src/features/exams/components/ExamSimulatorCard.tsx`
- `src/features/exams/components/ExamCardCompact.tsx`
- `src/features/classes/pages/ClassDetails.tsx`

## Resources loaded externally

`public/index.html` references these resources; their font/script files are not
included in the source snapshot:

- Space Mono via Google Fonts: [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/spacemono/OFL.txt).
- Material Symbols Outlined via Google Fonts: [Apache-2.0](https://github.com/google/material-design-icons/blob/master/LICENSE).
- Tailwind CSS browser runtime via unpkg: [MIT](https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE).

These resources retain their own licences. If vendoring them later, include the
corresponding copyright/licence notices. npm imports such as React Icons and
Heroicons are dependencies, distinct from the inline SVG copies inventoried above.
