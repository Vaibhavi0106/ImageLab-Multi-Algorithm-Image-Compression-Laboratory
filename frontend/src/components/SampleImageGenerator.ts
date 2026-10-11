export function generateTestImage(type: 'photo' | 'gradient' | 'checkerboard' | 'noise', size: number = 256): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (type === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(0.5, '#06b6d4');
      grad.addColorStop(1, '#f43f5e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else if (type === 'checkerboard') {
      const blockSize = 16;
      for (let r = 0; r < size; r += blockSize) {
        for (let c = 0; c < size; c += blockSize) {
          ctx.fillStyle = ((r / blockSize + c / blockSize) % 2 === 0) ? '#f8fafc' : '#0f172a';
          ctx.fillRect(c, r, blockSize, blockSize);
        }
      }
      // Add a circular pattern in center to test curved edge transform coding
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'noise') {
      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(Math.random() * 256);
        data[i + 1] = Math.floor(Math.random() * 256);
        data[i + 2] = Math.floor(Math.random() * 256);
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (type === 'photo') {
      // Natural scenery simulation (sky, mountains, sun, detail foliage)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, size * 0.6);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, size, size);

      // Sun
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(size * 0.75, size * 0.25, size * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Mountains
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, size * 0.65);
      ctx.lineTo(size * 0.35, size * 0.35);
      ctx.lineTo(size * 0.7, size * 0.7);
      ctx.lineTo(size, size * 0.45);
      ctx.lineTo(size, size);
      ctx.lineTo(0, size);
      ctx.closePath();
      ctx.fill();

      // Foreground terrain with texture
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 0.9, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${type}_test_sample.png`, { type: 'image/png' });
        resolve(file);
      }
    }, 'image/png');
  });
}
