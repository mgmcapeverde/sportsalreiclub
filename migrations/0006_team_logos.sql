-- Team crests (image URL); NULL shows the team's short name in a circle.
ALTER TABLE teams ADD COLUMN logo TEXT;
UPDATE teams SET logo = '/assets/img/logo-crest.png' WHERE id = 'sal-rei';
