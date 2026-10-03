# 🎶 Hindi Songs Collection (Cloudinary Audio Data)

This folder contains all Hindi songs and audio links for the **Hindi Songs** page (`hindi-songs.html`).

---

## 📁 File Structure
- `data/hindi_songs/hindi_songs.json` : Main JSON file containing the playlist data.

---

## 📝 How to Add or Update Cloudinary Song Links

Open [`hindi_songs.json`](file:///c:/Users/alokk/Desktop/chhath%20puja/data/hindi_songs/hindi_songs.json) and add or edit song objects using the format below:

```json
{
  "id": 9,
  "name": "गीत का हिंदी नाम",
  "nameEn": "Song English Transliteration",
  "singer": "गायक का नाम (Hindi)",
  "singerEn": "Singer Name (English)",
  "category": "Chhath Geet", 
  "duration": "5:20",
  "file": "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v123456789/your_song.mp3"
}
```

### Supported Categories:
- `Chhath Geet`
- `Bhakti Bhajan`
- `Aarti`
- `Mantra`
- `Devi Geet`

---
✨ Any links added to `hindi_songs.json` will automatically show up and play on the **Hindi Song** page!
