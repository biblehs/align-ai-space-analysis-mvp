"use client";

import { toBlob, toJpeg } from "html-to-image";

const EXPORT_QUALITY = 0.82;
const EXPORT_PIXEL_RATIO = 1.5;
const EXPORT_BACKGROUND = "#fcfcfb";

function downloadDataUrl(dataUrl: string, filename: string) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

async function renderNodeAsJpeg(node: HTMLElement) {
    return await toJpeg(node, {
        cacheBust: true,
        quality: EXPORT_QUALITY,
        pixelRatio: EXPORT_PIXEL_RATIO,
        backgroundColor: EXPORT_BACKGROUND,
    });
}

export async function downloadNodeAsPng(node: HTMLElement, filename: string) {
    const safeFilename = filename.replace(/\.png$/i, ".jpg");
    const dataUrl = await renderNodeAsJpeg(node);
    downloadDataUrl(dataUrl, safeFilename);
}

export async function downloadNodeAsPdf(node: HTMLElement, filename: string, title: string) {
    const dataUrl = await renderNodeAsJpeg(node);
    const safeTitle = title.replace(/"/g, "&quot;");
    const printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printWindow) {
        throw new Error("Unable to open the print window. Please allow pop-ups and try again.");
    }

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      body {
        margin: 0;
        background: #ffffff;
        display: flex;
        justify-content: center;
      }
      img {
        width: 100%;
        max-width: 190mm;
        height: auto;
        display: block;
      }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="${safeTitle}" data-filename="${filename}" />
  </body>
</html>`);
    printWindow.document.close();

    await new Promise<void>((resolve) => {
        const image = printWindow.document.querySelector("img");
        if (!image || image.complete) {
            resolve();
            return;
        }

        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
    });

    printWindow.focus();
    printWindow.print();
}

export async function shareNodeAsImage(
    node: HTMLElement,
    filename: string,
    title: string,
    text: string
) {
    const safeFilename = filename.replace(/\.png$/i, ".jpg");
    const blob = await toBlob(node, {
        cacheBust: true,
        quality: EXPORT_QUALITY,
        pixelRatio: EXPORT_PIXEL_RATIO,
        backgroundColor: EXPORT_BACKGROUND,
    });

    if (!blob) {
        throw new Error("Failed to generate image blob.");
    }

    const file = new File([blob], safeFilename, { type: "image/jpeg" });
    const sharePayload = {
        title,
        text,
        files: [file],
    };

    if (navigator.canShare?.(sharePayload) && navigator.share) {
        await navigator.share(sharePayload);
        return;
    }

    const dataUrl = await renderNodeAsJpeg(node);
    downloadDataUrl(dataUrl, safeFilename);
}
