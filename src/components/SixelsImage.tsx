/** @jsxImportSource @opentui/solid */
import { onMount, onCleanup } from "solid-js";
import { useRenderer } from "@opentui/solid";
import { Jimp } from "jimp";
import { useSession } from "../context/SessionContext";

const DCS_START = "\x1bP";
const DCS_END = "\x1b\\";
const MAX_PALETTE_SIZE = 256;

interface PaletteEntry {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

function colorDistance(c1: PaletteEntry, c2: PaletteEntry): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return dr * dr + dg * dg + db * db;
}

function buildPalette(pixels: Uint8Array, width: number, height: number): PaletteEntry[] {
  // Simple color quantization: sample pixels and build palette
  const colorMap = new Map<string, number>();
  const palette: PaletteEntry[] = [];

  // Sample pixels (every 4th pixel for speed)
  const step = Math.max(1, Math.floor((width * height) / 1000));
  for (let i = 0; i < width * height; i += step) {
    const idx = i * 4;
    const r = pixels[idx] ?? 0;
    const g = pixels[idx + 1] ?? 0;
    const b = pixels[idx + 2] ?? 0;
    const a = pixels[idx + 3] ?? 255;

    if (a < 128) continue; // Skip transparent pixels

    // Quantize to 5-bit per channel for grouping
    const qr = r >> 3;
    const qg = g >> 3;
    const qb = b >> 3;
    const key = `${qr},${qg},${qb}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, palette.length);
      palette.push({ r, g, b });
      if (palette.length >= MAX_PALETTE_SIZE) break;
    }
  }

  // If no colors found, add a default
  if (palette.length === 0) {
    palette.push({ r: 0, g: 0, b: 0 });
  }

  return palette;
}

function findClosestColor(
  r: number, g: number, b: number,
  palette: PaletteEntry[]
): number {
  let minDist = Infinity;
  let minIdx = 0;

  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistance({ r, g, b }, palette[i]);
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
  }

  return minIdx;
}

function encodeSixels(
  pixels: Uint8Array,
  imgWidth: number,
  imgHeight: number,
  palette: PaletteEntry[]
): string {
  let output = "";

  // DCS header with raster attributes
  output += `${DCS_START}0;0;0q"1;1;${imgWidth};${imgHeight}`;

  // Color definitions (RGB scaled to 0-100)
  for (let i = 0; i < palette.length; i++) {
    const c = palette[i];
    const r100 = Math.round((c.r * 100) / 255);
    const g100 = Math.round((c.g * 100) / 255);
    const b100 = Math.round((c.b * 100) / 255);
    output += `#${i};2;${r100};${g100};${b100}`;
  }

  // Build indexed image (assign each pixel to closest palette color)
  const indexed = new Uint8Array(imgWidth * imgHeight);
  for (let i = 0; i < imgWidth * imgHeight; i++) {
    const idx = i * 4;
    const r = pixels[idx] ?? 0;
    const g = pixels[idx + 1] ?? 0;
    const b = pixels[idx + 2] ?? 0;
    const a = pixels[idx + 3] ?? 255;

    if (a < 128) {
      indexed[i] = 255; // Transparent marker
    } else {
      indexed[i] = findClosestColor(r, g, b, palette);
    }
  }

  // Encode sixel data band by band (each band = 6 pixel rows)
  const numBands = Math.ceil(imgHeight / 6);

  for (let band = 0; band < numBands; band++) {
    const bandStart = band * 6;

    // For each color pen in the palette
    for (let pen = 0; pen < palette.length; pen++) {
      let hasPixels = false;
      const sixelChars: string[] = [];

      for (let col = 0; col < imgWidth; col++) {
        // Build 6-bit value from vertical column
        let sixelValue = 0;
        for (let row = 0; row < 6; row++) {
          const pixelRow = bandStart + row;
          if (pixelRow >= imgHeight) continue;

          const pixelIdx = pixelRow * imgWidth + col;
          if (indexed[pixelIdx] === pen) {
            sixelValue |= 1 << row;
          }
        }

        if (sixelValue !== 0) {
          hasPixels = true;
        }

        // Convert to sixel character (? + value)
        const sixelChar = String.fromCharCode(63 + sixelValue);
        sixelChars.push(sixelChar);
      }

      if (!hasPixels) continue;

      // Output pen number
      output += `#${pen}`;

      // RLE encode the sixel characters
      let i = 0;
      while (i < sixelChars.length) {
        const current = sixelChars[i];
        let count = 1;

        // Count consecutive identical characters
        while (i + count < sixelChars.length && sixelChars[i + count] === current) {
          count++;
        }

        if (count < 4) {
          // Direct output for short runs
          for (let j = 0; j < count; j++) {
            output += current;
          }
        } else {
          // RLE output for longer runs
          output += `!${count}${current}`;
        }

        i += count;
      }

      // Carriage return (return to left for next color in same band)
      output += "$";
    }

    // Newline (advance to next 6-pixel band)
    if (band < numBands - 1) {
      output += "-";
    }
  }

  // DCS terminator
  output += DCS_END;

  return output;
}

interface SixelsImageProps {
  src: string;
  width?: number;
  maxHeight?: number;
}

export function SixelsImage(props: SixelsImageProps) {
  const renderer = useRenderer();
  let session: any;
  try {
    session = useSession();
  } catch {
    session = null;
  }

  const write = (data: string) => {
    const writeRaw = session?.writeRaw;
    if (writeRaw) writeRaw(data);
    else process.stdout.write(data);
  };

  let boxRef: any = null;

  onMount(async () => {
    try {
      const file = Bun.file(props.src);
      if (!(await file.exists())) {
        console.error("[SixelsImage] File not found:", props.src);
        return;
      }

      const buffer = await file.arrayBuffer();
      const image = await Jimp.read(buffer);
      const imgW = image.bitmap.width;
      const imgH = image.bitmap.height;

      const targetW = props.width ?? 20;
      const aspectRatio = imgH / imgW;
      let targetH = Math.max(1, Math.round(targetW * aspectRatio * 0.5));
      if (props.maxHeight && targetH > props.maxHeight) {
        targetH = props.maxHeight;
      }

      const pixelW = targetW * 2;
      const pixelH = targetH * 2;
      image.resize({ w: pixelW, h: pixelH });

      const pixels = new Uint8Array(image.bitmap.data);
      const palette = buildPalette(pixels, pixelW, pixelH);
      const sixels = encodeSixels(pixels, pixelW, pixelH, palette);

      // Write Sixels on every frame, positioned at the box's layout position
      renderer.setFrameCallback(() => {
        // Get the actual screen position from the box's renderable
        let row = 3;
        let col = 3;

        if (boxRef) {
          // Access the underlying renderable's screen position
          const r = boxRef as any;
          if (typeof r.x === "number" && typeof r.y === "number") {
            col = r.x + 1; // 1-based for ANSI
            row = r.y + 1;
          }
        }

        const moveCmd = `\x1b[${row};${col}H`;
        write(moveCmd + sixels);
      });
    } catch (error) {
      console.error("[SixelsImage] Failed to load:", error);
    }
  });

  onCleanup(() => {});

  return (
    <box
      ref={(el: any) => { boxRef = el; }}
      style={{
        width: props.width ?? 20,
        height: Math.max(1, Math.round(((props.width ?? 20) * 0.5))),
      }}
    />
  );
}
