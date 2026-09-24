import sharp from 'sharp';

export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1920;

// Quita bordes blancos/casi blancos típicos de fotos de proveedor.
// Si la imagen es completamente uniforme, sharp falla: devolvemos la original.
async function trimWhite(input, threshold) {
  try {
    const { data, info } = await sharp(input).rotate().trim({ background: '#ffffff', threshold }).toBuffer({ resolveWithObject: true });
    if (info.width < 16 || info.height < 16) throw new Error('trim excesivo');
    return { buffer: data, width: info.width, height: info.height };
  } catch {
    const { data, info } = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height };
  }
}

// Convierte cualquier foto en un frame vertical 9:16:
//  - Si ya es casi vertical (±8%), recorte "cover" centrado.
//  - Si no, fondo = misma imagen ampliada + desenfoque gaussiano + oscurecida,
//    y encima la imagen completa centrada (sin recortar el producto).
export async function toVerticalFrame(input, output, { width = FRAME_WIDTH, height = FRAME_HEIGHT, trimThreshold = 12, blurSigma = 40, quality = 90 } = {}) {
  const src = await trimWhite(input, trimThreshold);
  const target = width / height;
  const aspect = src.width / src.height;

  let pipeline;
  let mode;
  if (Math.abs(aspect - target) / target <= 0.08) {
    mode = 'cover';
    pipeline = sharp(src.buffer).resize(width, height, { fit: 'cover', position: 'centre' });
  } else {
    mode = 'blur-fill';
    const background = await sharp(src.buffer)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .blur(blurSigma)
      .modulate({ brightness: 0.6 })
      .toBuffer();
    const foreground = await sharp(src.buffer).resize(width, height, { fit: 'inside' }).toBuffer();
    pipeline = sharp(background).composite([{ input: foreground, gravity: 'centre' }]);
  }
  await pipeline.flatten({ background: '#000000' }).jpeg({ quality, mozjpeg: true }).toFile(output);
  return { output, mode, sourceWidth: src.width, sourceHeight: src.height };
}

export async function imageSize(file) {
  const { width = 0, height = 0 } = await sharp(file).metadata();
  return { width, height };
}
