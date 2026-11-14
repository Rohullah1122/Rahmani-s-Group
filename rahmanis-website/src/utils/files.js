// Helpers for photos

// Turns what the database saved into a link the browser can open.
// Old photos: "uploads\\123.jpg" or "/uploads/123.jpg". Live site photos: a full https:// link.
export const fileUrl = (p) => {
  if (!p) return "";
  const clean = String(p).replace(/\\/g, "/");
  return clean.startsWith("http") ? clean : "/" + clean.replace(/^\/+/, "");
};

// Makes a photo smaller before uploading (phone photos can be 5 MB or more).
// Returns a JPEG File no wider or taller than maxSide.
export const shrinkImage = (file, maxSide = 1600) =>
  new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // browser can't read it, send it as it is
    };

    img.src = url;
  });
