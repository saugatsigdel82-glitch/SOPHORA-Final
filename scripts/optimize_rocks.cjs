const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function optimizeRocks() {
  console.log('Reading rocks.glb from .backup/rocks.original.glb...');
  const inPath = path.resolve('.backup/rocks.original.glb');
  const outPath = path.resolve('public/assets/rocks.glb');
  const buf = fs.readFileSync(inPath);

  const magic = buf.readUInt32LE(0);
  const version = buf.readUInt32LE(4);
  const totalLength = buf.readUInt32LE(8);
  const chunk0Length = buf.readUInt32LE(12);
  const chunk0Type = buf.readUInt32LE(16);

  const gltf = JSON.parse(buf.slice(20, 20 + chunk0Length).toString('utf8'));
  const binHeaderPos = 20 + chunk0Length;
  const binLength = buf.readUInt32LE(binHeaderPos);
  const binChunkType = buf.readUInt32LE(binHeaderPos + 4);
  const binBuf = buf.slice(binHeaderPos + 8, binHeaderPos + 8 + binLength);

  console.log(`Original images count: ${gltf.images.length}`);
  
  // Extract all existing bufferViews for geometry & images
  const imageBufferViewIndices = new Set(gltf.images.map(img => img.bufferView));
  
  // Reconstruct bin buffer:
  const oldBufferViews = gltf.bufferViews;
  const newBufferViews = [];
  const bufferParts = [];
  let currentOffset = 0;

  // Map from old bufferView index to new bufferView index
  const bvMap = {};

  for (let i = 0; i < oldBufferViews.length; i++) {
    if (!imageBufferViewIndices.has(i)) {
      const bv = oldBufferViews[i];
      const slice = binBuf.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
      // Align to 4 bytes
      const padding = (4 - (slice.length % 4)) % 4;
      const paddedSlice = padding > 0 ? Buffer.concat([slice, Buffer.alloc(padding)]) : slice;

      bvMap[i] = newBufferViews.length;
      newBufferViews.push({
        ...bv,
        byteOffset: currentOffset,
        byteLength: slice.length
      });
      bufferParts.push(paddedSlice);
      currentOffset += paddedSlice.length;
    }
  }

  // Update accessors to point to new bufferViews
  if (gltf.accessors) {
    gltf.accessors.forEach(acc => {
      if (acc.bufferView !== undefined && bvMap[acc.bufferView] !== undefined) {
        acc.bufferView = bvMap[acc.bufferView];
      }
    });
  }

  // Now process each image
  for (let i = 0; i < gltf.images.length; i++) {
    const img = gltf.images[i];
    const oldBv = oldBufferViews[img.bufferView];
    const imgData = binBuf.slice(oldBv.byteOffset || 0, (oldBv.byteOffset || 0) + oldBv.byteLength);
    console.log(`Optimizing image ${i} (original ${oldBv.byteLength} bytes)...`);

    // Resize to 1024x1024 JPEG at 85% quality
    const resized = await sharp(imgData)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 85, progressive: false })
      .toBuffer();

    const padding = (4 - (resized.length % 4)) % 4;
    const padded = padding > 0 ? Buffer.concat([resized, Buffer.alloc(padding)]) : resized;

    const newBvIndex = newBufferViews.length;
    newBufferViews.push({
      buffer: 0,
      byteOffset: currentOffset,
      byteLength: resized.length
    });
    bufferParts.push(padded);
    currentOffset += padded.length;

    img.bufferView = newBvIndex;
    img.mimeType = 'image/jpeg';
    console.log(`  -> New size: ${resized.length} bytes (${(resized.length / 1024).toFixed(1)} KB)`);
  }

  gltf.bufferViews = newBufferViews;
  gltf.buffers[0].byteLength = currentOffset;

  // Encode JSON chunk
  let newJsonStr = JSON.stringify(gltf);
  let jsonPad = (4 - (Buffer.byteLength(newJsonStr) % 4)) % 4;
  newJsonStr += ' '.repeat(jsonPad);
  const newJsonBuf = Buffer.from(newJsonStr, 'utf8');

  const newBinBuf = Buffer.concat(bufferParts);

  // Assemble GLB
  const outGlbHeader = Buffer.alloc(12);
  const totalGlbLen = 12 + 8 + newJsonBuf.length + 8 + newBinBuf.length;
  outGlbHeader.writeUInt32LE(0x46546C67, 0); // 'glTF'
  outGlbHeader.writeUInt32LE(2, 4); // version 2
  outGlbHeader.writeUInt32LE(totalGlbLen, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(newJsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(newBinBuf.length, 0);
  binHeader.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

  const finalGlb = Buffer.concat([outGlbHeader, jsonHeader, newJsonBuf, binHeader, newBinBuf]);
  fs.writeFileSync(outPath, finalGlb);
  console.log(`\nSuccessfully created ${outPath}!`);
  console.log(`Original: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized: ${(finalGlb.length / 1024 / 1024).toFixed(2)} MB`);
}

optimizeRocks().catch(console.error);
