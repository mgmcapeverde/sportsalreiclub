-- Photo gallery of each match. Images live in R2 (binding MEDIA) under gallery/YYYY/MM/;
-- `key` is the large version (max 2000 px), `thumb` the small one (max 640 px).
-- The first photo (lowest sort, then id) is the album cover.
CREATE TABLE match_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id   INTEGER NOT NULL REFERENCES matches(id),
  key        TEXT NOT NULL,
  thumb      TEXT NOT NULL,
  w          INTEGER,
  h          INTEGER,
  size       INTEGER,
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX match_photos_match ON match_photos (match_id, sort, id);
