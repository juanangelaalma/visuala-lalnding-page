# PRD — Visuala Product Demo Studio

**Product:** Visuala\
**Feature:** AI Product Demo & Product Promo Video Generator\
**Document Type:** Product Requirements Document\
**Status:** Draft / MVP\
**Primary Market:** B2B SaaS / Startup\
**Primary Platform:** Web Desktop\
**Primary User:** SaaS Founder, Product Marketing, Growth Team

---

# 1. Product Overview

## 1.1 Background

SaaS companies secara rutin membutuhkan video untuk:

- product launch,
- feature announcement,
- landing page,
- Product Hunt,
- LinkedIn,
- X / Twitter,
- Instagram / TikTok,
- changelog,
- paid ads,
- sales enablement.

Saat ini proses pembuatan video tersebut umumnya membutuhkan kombinasi beberapa tools:

- screen recorder,
- video editor,
- motion graphics software,
- design tools,
- copywriting,
- manual animation,
- resizing untuk berbagai platform.

Tools seperti Jitter, Screen Studio, After Effects, dan Rive memberikan kontrol yang kuat, tetapi tetap mengharuskan user mengetahui **video seperti apa yang ingin dibuat**.

Visuala mengambil pendekatan berbeda.

User cukup menjelaskan:

> “Produk saya adalah SaaS budgeting untuk freelancer. Fitur baru kami dapat mengategorikan transaksi secara otomatis.”

Kemudian Visuala bertugas memahami produk, menyusun pesan marketing, membuat storyboard, menentukan visual direction, membuat motion, dan menghasilkan video siap publish.

---

# 2. Product Vision

## Vision

> **Turn any product idea or feature into a launch-ready product video.**

Visuala menjadi **AI Product Video Team** bagi SaaS company.

User tidak perlu menjadi:

- motion designer,
- video editor,
- copywriter,
- creative director.

Visuala menjalankan peran tersebut secara otomatis.

---

# 3. Product Positioning

Visuala bukan:

- video editor tradisional,
- timeline animation editor,
- replacement After Effects,
- replacement Jitter,
- AI text-to-video cinematic generator.

Visuala adalah:

> **AI-powered product marketing video generator.**

Primary promise:

> **Describe your product. Get a launch-ready video.**

Alternative marketing message:

> **Ship the feature. Visuala makes the launch video.**

---

# 4. Target Users

## 4.1 Primary ICP

### SaaS Founder / Indie Hacker

Company size:

- 1–10 people.

Characteristics:

- frequently shipping product updates,
- tidak memiliki dedicated motion designer,
- founder sering mengurus marketing sendiri,
- aktif di Product Hunt, LinkedIn, X,
- membutuhkan marketing assets dengan cepat.

Examples:

- AI SaaS,
- developer tools,
- productivity SaaS,
- fintech SaaS,
- CRM,
- analytics tools,
- project management apps.

---

## 4.2 Secondary ICP

### Product Marketing Team

Company size:

- 10–100 employees.

Use cases:

- feature launch,
- social content,
- product announcements,
- product education,
- campaign creative.

---

## 4.3 Future ICP

Tidak menjadi fokus MVP:

- creative agencies,
- enterprise marketing teams,
- ecommerce products,
- mobile games,
- consumer apps.

---

# 5. Jobs To Be Done

## Primary JTBD

> When I launch a new product or feature, I want to quickly create a professional product video so I can promote it without hiring a motion designer or spending hours editing.

---

## Supporting JTBD

User ingin membuat:

- product launch video,
- feature announcement,
- product overview,
- social promotional video,
- landing page hero video,
- Product Hunt demo,
- changelog video.

---

# 6. Core Product Principles

Visuala harus mengikuti beberapa prinsip berikut.

## 6.1 Outcome Over Editing

User datang untuk mendapatkan:

> finished video.

Bukan:

> animation timeline.

---

## 6.2 AI First

User memberikan minimum information.

Visuala melakukan sebanyak mungkin pekerjaan.

---

## 6.3 Opinionated UX

Visuala memberikan pilihan yang sederhana seperti:

- Clean SaaS,
- Bold Launch,
- Minimal,
- Dark Premium.

Bukan pengaturan seperti:

- cubic bezier,
- keyframe graph,
- motion curve,
- individual frame manipulation.

---

## 6.4 Scene-Based Editing

Video dibangun menggunakan:

> Scenes

bukan timeline kompleks.

---

## 6.5 Brand Consistency

Generated video harus terasa seperti bagian dari brand user.

---

## 6.6 Deterministic Rendering

AI menentukan:

- storytelling,
- layout,
- scene structure,
- animation intention.

Renderer berbasis code menentukan output akhirnya.

Tujuannya agar:

- text tetap akurat,
- UI tetap tajam,
- warna konsisten,
- rendering predictable.

---

# 7. Main User Flow

Overall flow:

```text
Create Project

↓

Describe Product

↓

Add Brand

↓

Choose Video Goal

↓

AI Product Analysis

↓

Storyboard Generation

↓

Visual Generation

↓

Motion Composition

↓

Video Preview

↓

Render

↓

Export
```

---

# 8. User Onboarding Flow

## Step 1 — Create Project

Dashboard memiliki CTA utama:

> Create Product Video

User masuk ke creation wizard.

---

# 9. Step 2 — Product Brief

Headline:

> Tell us what you're launching.

User diberikan satu primary textarea.

Example placeholder:

> We built an AI meeting assistant that automatically summarizes meetings and extracts action items for remote teams.

User tidak diwajibkan mengisi banyak form.

---

## Optional Inputs

### Product Name

Example:

> Meetly

### Product URL

Example:

> meetly.app

### Feature Name

Example:

> AI Meeting Summary

### Target Audience

Example:

> Remote product teams

Input optional karena AI dapat mencoba mengekstraknya dari brief.

---

# 10. AI Product Understanding

Setelah brief dikirimkan, Visuala menjalankan Product Analyzer.

AI menghasilkan:

### Product

Meetly

### Category

AI Meeting Assistant

### Audience

Remote teams

### Problem

Meeting notes require manual work.

### Feature

Automatic meeting summaries.

### Main Benefit

Teams get meeting insights instantly.

### Primary Marketing Message

> Meetings shouldn't create more work.

---

User melihat hasil analysis.

User dapat:

- Accept
- Edit

Tidak perlu regenerate seluruh analysis.

---

# 11. Brand Setup

Headline:

> Make it look like your product.

User dapat memasukkan:

### Required

Logo.

### Automatically Extracted

Visuala mencoba menentukan:

- primary color,
- secondary color,
- neutral color,
- background color.

Example:

```text
Primary
#7C3AED

Secondary
#A855F7

Neutral
#111827

Background
#FFFFFF
```

User dapat mengubah palette.

---

## Optional

User dapat memilih:

### Font style

- Modern
- Professional
- Friendly
- Technical
- Elegant

MVP tidak membutuhkan custom font upload.

---

# 12. Product Assets

Product assets bersifat OPTIONAL.

Section:

> Want the video to match your actual product?

User dapat:

### Skip

Visuala membuat visual menggunakan generated/product UI components.

atau:

### Add Product Assets

Supported MVP:

- screenshots,
- screen recordings.

Future:

- website URL crawling,
- Figma import,
- browser recorder,
- interactive product capture.

---

# 13. Choose Video Goal

User memilih satu objective.

## MVP Goals

### Product Launch

Cocok untuk launching produk secara keseluruhan.

Typical structure:

```text
Problem
↓
Product
↓
Core Features
↓
Benefits
↓
CTA
```

---

### Feature Launch

Cocok untuk fitur baru.

Structure:

```text
Hook
↓
Problem
↓
Feature Reveal
↓
How It Works
↓
Benefit
↓
CTA
```

---

### Social Promo

Short-form marketing video.

Structure:

```text
Hook
↓
Product
↓
Benefit
↓
CTA
```

---

### Landing Page Demo

Product-focused.

Structure:

```text
Product UI
↓
Feature demonstration
↓
Supporting benefits
```

---

# 14. Video Settings

Setelah menentukan goal:

## Duration

MVP presets:

### Short

10–15 seconds

### Standard

20–30 seconds

### Extended

30–45 seconds

Default:

> Standard

---

## Aspect Ratio

### Landscape

16:9

### Portrait

9:16

### Square

1:1

Default:

> 16:9

---

# 15. Motion Style

User memilih creative direction.

MVP hanya membutuhkan maksimal 5 styles.

## 1. Clean SaaS

Characteristics:

- white / light background,
- smooth motion,
- floating browser,
- minimal typography.

---

## 2. Dark Premium

Characteristics:

- dark background,
- subtle glow,
- elegant transitions.

---

## 3. Bold Launch

Characteristics:

- large typography,
- faster transitions,
- stronger visual contrast.

---

## 4. Minimal

Characteristics:

- typography-heavy,
- whitespace,
- subtle UI animations.

---

## 5. Startup Social

Characteristics:

- faster pacing,
- larger captions,
- optimized for social media.

---

# 16. Generate Storyboard

CTA:

> Generate Video Plan

Visuala menjalankan:

```text
Product Analyzer
↓
Marketing Strategist
↓
Script Generator
↓
Storyboard Generator
```

Output berupa scenes.

Example:

---

### Scene 1 — Hook

Text:

> Meetings shouldn't create more work.

Visual:

Animated headline.

Duration:

3 seconds.

---

### Scene 2 — Product Reveal

Text:

> Meetly turns every meeting into structured insights.

Visual:

Browser mockup appears.

Duration:

4 seconds.

---

### Scene 3 — Feature

Text:

> Automatic meeting summaries.

Visual:

Meeting transcript → AI Summary card.

Duration:

5 seconds.

---

### Scene 4 — Benefit

Text:

> Key decisions and action items. Instantly.

Visual:

Action items animate individually.

Duration:

5 seconds.

---

### Scene 5 — CTA

Text:

> Meet less. Get more done.

Visual:

Logo + CTA.

Duration:

4 seconds.

---

# 17. Storyboard Review

User dapat melakukan:

- reorder scene,
- delete scene,
- duplicate scene,
- edit copy,
- regenerate scene,
- add scene.

User tidak perlu mengatur animation pada tahap ini.

Primary CTA:

> Generate Video

---

# 18. Visual Generation Engine

Setiap scene akan memiliki:

```text
Scene Type
Content
Visual Layout
Motion Pattern
Brand Style
Duration
Transition
```

Visuala memilih visual berdasarkan content.

---

# 19. Visual Component Library

MVP sebaiknya tidak bergantung sepenuhnya kepada generative image/video AI.

Gunakan reusable product components.

Example:

### Browser

- browser window,
- floating browser,
- browser tabs.

### UI

- dashboard,
- cards,
- tables,
- charts,
- modals,
- buttons,
- sidebars,
- forms,
- kanban,
- chat,
- analytics.

### Marketing

- feature card,
- headline,
- subtitle,
- badge,
- callout,
- comparison.

### Product Decoration

- glow,
- grid,
- gradient,
- spotlight,
- shadow.

---

# 20. Motion System

Gunakan motion primitives.

## Entry Animation

- fade,
- slide,
- scale,
- blur reveal,
- mask reveal.

## Text Animation

- word reveal,
- typewriter,
- stagger,
- fade,
- slide.

## Product Animation

- UI zoom,
- card focus,
- spotlight,
- highlight,
- cursor movement.

## Camera

- zoom in,
- zoom out,
- focus,
- pan.

## Transition

- fade,
- push,
- zoom,
- mask.

AI memilih kombinasi berdasarkan style.

---

# 21. Video Preview

Setelah generation selesai, user melihat preview video sebelum export.

Preview menampilkan final composition:

- background,
- typography,
- product UI,
- animations,
- motion effects.

User dapat kembali ke Storyboard Review untuk mengubah scene, lalu generate ulang video.

---

# 22. Things Users Cannot Edit in MVP

Tidak ada:

- complex keyframes,
- graph editor,
- frame-level editing,
- unlimited layers,
- custom animation curve,
- advanced vector editor,
- motion path editor.

Jika kebutuhan ini muncul secara konsisten dari user, baru dievaluasi setelah MVP.

---

# 27. Export

CTA utama:

> Export Video

Supported MVP:

## Resolution

- 720p
- 1080p

## Format

- MP4
- WebM

## Aspect Ratio

- 16:9
- 9:16
- 1:1

---

# 28. Multi-Format Generation

User dapat memilih:

> Create another format.

Example:

Original:

16:9

Generate:

9:16.

Visuala otomatis melakukan:

- repositioning,
- text scaling,
- UI cropping,
- responsive scene layout.

Tidak hanya melakukan crop video.

---

# 29. Project Dashboard

Dashboard memiliki:

## Recent Projects

Cards:

```text
Product Thumbnail

Meetly AI Summary Launch

20 sec
16:9

Edited 2 hours ago
```

Actions:

- Edit
- Duplicate
- Export

---

# 30. Project Status

Possible statuses:

```text
Draft
Generating
Ready
Rendering
Rendered
Failed
```

---

# 31. Brand Kit

Brand data disimpan agar bisa digunakan kembali.

Brand Kit:

```text
Logo

Primary Color

Secondary Color

Background

Typography Style
```

Future:

- multiple brands,
- custom font,
- custom brand templates.

---

# 32. Functional Requirements

## FR-001 Product Brief

System must allow user to provide free-form product description.

---

## FR-002 Product Analysis

System must extract:

- product,
- audience,
- problem,
- solution,
- feature,
- benefits.

---

## FR-003 Brand Detection

System must detect palette from uploaded logo.

---

## FR-004 Storyboard Generation

System must generate structured scenes based on:

- product,
- feature,
- marketing goal,
- duration.

---

## FR-005 Storyboard Editing

User must be able to:

- edit,
- reorder,
- delete,
- regenerate,
- duplicate.

---

## FR-006 Scene Generation

System must generate visual composition for every scene.

---

## FR-007 Motion Generation

System must automatically assign:

- animation,
- transition,
- timing,
- camera movement.

---

## FR-008 Video Preview

User must be able to preview generated composition before final rendering.

---

## FR-009 Video Preview

User must be able to preview the generated video and return to Storyboard Review before rendering/export.

---

## FR-010 Rendering

System must render project into final video.

---

## FR-011 Export

System must support:

- MP4,
- WebM,
- 720p,
- 1080p.

---

## FR-012 Project Persistence

System must save:

- project,
- scenes,
- assets,
- storyboard,
- render outputs.

---

# 33. Suggested AI Architecture

Conceptually:

```text
USER INPUT

↓

Product Analyzer

↓

Brand Analyzer

↓

Marketing Strategist

↓

Script Writer

↓

Storyboard Director

↓

Visual Director

↓

Motion Director

↓

Scene JSON

↓

Renderer

↓

Video
```

---

# 34. Structured Scene Output

AI sebaiknya tidak langsung menghasilkan video.

AI menghasilkan structured specification.

Example:

```json
{
  "scene": 3,
  "type": "feature",
  "duration": 5,
  "headline": "Automatic meeting summaries",
  "visual": {
    "template": "browser-feature",
    "productComponent": "meeting-summary"
  },
  "motion": {
    "entry": "scale-fade",
    "camera": "zoom-in",
    "intensity": "medium"
  }
}
```

Renderer membaca scene definition tersebut.

---

# 35. Technical Architecture Recommendation

Suggested MVP stack:

## Frontend

Next.js

## Application

Next.js Server Actions / API

## Database

Supabase PostgreSQL

## Authentication

Supabase Auth

## Storage

Cloudflare R2

## AI

LLM abstraction layer.

Possible tasks:

- product analysis,
- copy generation,
- storyboard,
- scene configuration.

## Rendering

Remotion.

## Encoding

FFmpeg.

## Queue

Initial:

database-backed jobs.

Scale phase:

dedicated queue / Redis.

---

# 36. Core Database Entities

Suggested entities:

```text
users

workspaces

projects

brands

product_briefs

storyboards

scenes

assets

scene_assets

renders

exports
```

---

# 37. MVP Scope

## Must Have

### Creation

- product brief,
- product analysis,
- logo upload,
- palette extraction,
- video goal,
- duration,
- aspect ratio,
- motion style.

### AI

- marketing positioning,
- script,
- storyboard,
- scene definition.

### Video

- scene-based composition,
- text animation,
- browser mockup,
- generic SaaS UI components,
- transitions,
- motion presets.

### Storyboard Editing

- edit copy,
- reorder scene,
- delete scene,
- duplicate scene,
- regenerate scene,
- add scene.

### Export

- MP4,
- WebM,
- 1080p,
- 16:9,
- 9:16,
- 1:1.

---

# 38. Optional MVP+

Jika waktu memungkinkan:

- screenshot upload,
- screen recording upload,
- auto zoom,
- cursor animation,
- custom CTA,
- duplicate video,
- brand kit persistence.

---

# 39. Explicitly Out of Scope

Untuk menghindari scope creep:

- After Effects-style timeline,
- custom keyframes,
- Figma import,
- browser extension,
- real-time collaboration,
- voice cloning,
- AI avatar,
- 3D animation,
- text-to-video cinematic generation,
- interactive video,
- custom animation programming,
- mobile editor,
- advanced audio editing.

---

# 40. MVP Success Metrics

## North Star Candidate

**Completed Product Videos**

Number of videos successfully generated and exported.

---

## Activation Metric

User:

```text
creates project
↓
generates storyboard
↓
generates video
```

Target:

> ≥40% new users reaching first generated video.

---

## Time To Value

Target:

> First usable video within <10 minutes.

---

## Generation Completion

Target:

> ≥80% generated projects reach preview successfully.

---

## Export Rate

Target:

> ≥30% generated videos get exported.

This is especially important.

Generated video ≠ useful video.

Export indicates actual user value.

---

## Regeneration Rate

Monitor scene regeneration.

Very high regeneration may indicate poor output quality.

Example:

> > 2 scene regenerations/project

should trigger product investigation.

---

# 41. Product Quality Metrics

Monitor:

### Copy Acceptance Rate

Percentage of AI copy retained.

### Storyboard Acceptance Rate

Percentage scenes retained.

### Scene Regeneration Rate

How frequently scenes are regenerated.

### Video Export Rate

Most important early quality indicator.

### Second Project Rate

Whether user creates another video.

This indicates repeatability.

---

# 42. MVP Validation Hypothesis

Primary hypothesis:

> SaaS founders are willing to use an AI system that automatically transforms product information into professional launch videos.

Second hypothesis:

> SaaS founders prefer fast automated generation over advanced motion editing capabilities.

Third hypothesis:

> Brand-consistent generated product videos are sufficiently valuable to justify recurring SaaS payment.

---

# 43. Validation Strategy

Before building advanced functionality:

Recruit:

> 20–30 SaaS founders.

Ask each user to provide:

- product URL,
- brief,
- logo.

Generate product video.

Measure:

### Did they publish it?

This is stronger than:

> “Do you like it?”

Ask:

> Would you publish this on your company account?

Then:

> Would you pay $20–30/month to create videos like this repeatedly?

#

---

# 45. Future Roadmap

## Phase 2 — High-Level Video Editor

Add:

- scene copy editing after preview,
- layout presets,
- motion intensity,
- product focus controls,
- AI rewrite and scene variations.

---

## Phase 3 — Product Accurate Video

Add:

- screenshot import,
- screen recording,
- smart crop,
- cursor detection,
- auto zoom,
- product-specific UI integration.

---

## Phase 4 — Browser Capture

Browser extension.

Capture:

```text
URL
click events
DOM elements
cursor
scroll
viewport
```

Visuala can automatically reconstruct polished product walkthroughs.

---

## Phase 5 — Product URL Intelligence

User only provides:

```text
https://product.com
```

Visuala:

- reads landing page,
- identifies feature,
- extracts brand,
- identifies screenshots,
- builds product story.

---

## Phase 6 — Campaign Generation

One product launch generates:

```text
Landing page video

Product Hunt video

LinkedIn video

X teaser

TikTok/Reels video

Feature GIF
```

This potentially becomes a major differentiation.

Instead of:

> video generator

Visuala becomes:

> **Product Launch Content Engine.**

---

# 46. Long-Term Product Moat

Visuala's defensibility should not depend only on AI model quality.

Potential moat:

## Product Understanding

Understanding SaaS products and features.

## Creative Dataset

Learning which:

- hooks,
- scene structures,
- motion styles,
- durations

perform well.

## SaaS Motion System

Large reusable library of:

- UI components,
- motion primitives,
- scene structures.

## Brand Intelligence

Automatically transforming brand identity into motion design.

## Product Capture

Understanding actual user interaction through browser recording metadata.

---

# 47. Final MVP User Journey

The ideal first-time experience:

```text
Dashboard

↓

Create Product Video

↓

"What are you launching?"

↓

User writes product brief

↓

Upload Logo

↓

Visuala extracts brand

↓

Choose:

Feature Launch

↓

Choose:

Clean SaaS

↓

Generate

↓

Visuala understands product

↓

Visuala generates storyboard

↓

User reviews 5 scenes

↓

Generate Video

↓

20-second product video appears

↓

User changes one headline

↓

Export 1080p

↓

Publish
```

The user should feel:

> “I explained what my product does, and Visuala understood what video I needed.”

Not:

> “I learned how to use another video editor.”

---

# 48. Core Product Statement

The entire MVP should be evaluated against one sentence:

> **Describe your product. Visuala turns it into a launch-ready video.**

If a feature does not directly make that process faster, better, or more reliable, it should probably not be part of V1.
