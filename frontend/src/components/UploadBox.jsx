import { useState } from "react";

export default function UploadBox() {
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus(`Indexed ${data.chunkCount} chunks from ${data.sourceDoc}`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="upload-box">
      <input type="file" accept=".txt" onChange={handleFileChange} disabled={uploading} />
      {status && <span className="status">{status}</span>}
    </div>
  );
}
