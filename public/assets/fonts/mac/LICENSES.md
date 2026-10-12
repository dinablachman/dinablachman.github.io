# Fonts in this folder

Self-hosted so every visitor sees the 1984 Macintosh look. Apple's Chicago, Geneva, and Monaco cannot be redistributed as webfonts; these are libre substitutes.

## ChicagoFLF.woff2

Role: window titles, menus, buttons, headings (the Chicago role).
Designer: Robin Casady (Casady & Greene). Version 2.x metadata cleanup by the fontlibrary.org maintainer; no outlines changed.
License: public domain. Statement from the designer, by email, 2014-01-30:

> The FLF were created by various authors including myself and Mike Wright. When Casady & Greene, Inc. closed the rights went back to the authors. I created ChicagoFLF and CheckboxFLF. You are free to use them as you wish. I consider those two in the public domain.

Source: https://fontlibrary.org/en/font/chicagoflf (file taken from the css-pkg/chicago.css mirror on GitHub). Converted TTF to WOFF2 with fontTools, no other changes.

## PixelOperator.woff2, PixelOperator-Bold.woff2, PixelOperatorMono.woff2, PixelOperator8.woff2

Role: body text (PixelOperator, 16px grid), code (PixelOperatorMono), small labels and dates (PixelOperator8, 8px grid). These stand in for Geneva 12 and Geneva 9.
Designer: Jayvee Enaguas (HarvettFox96), 2009-2018.
License: Creative Commons Zero (CC0) 1.0 Universal. https://creativecommons.org/publicdomain/zero/1.0/
Source: https://notabug.org/HarvettFox96/ttf-pixeloperator (release 2018.10.04-1, taken from the dafont.com package). Converted TTF to WOFF2 with fontTools, no other changes.

## Rendering notes

Pixel Operator is a bitmap-grid outline font. It is crisp only at multiples of its grid: 16px (PixelOperator, Mono, Bold) and 8px (PixelOperator8). The site uses exactly those sizes. ChicagoFLF is a scalable outline and works at any size.

Geneva 9.1 (OFL, FontStruct) was the first choice for the label role but FontStruct downloads require an account, so PixelOperator8 fills that role instead.
