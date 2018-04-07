CREATE TABLE files (
    PRIMARY KEY (file_id),
    file_id    UUID,
    b2_file_id TEXT NOT NULL
);

CREATE TABLE boxes (
    PRIMARY KEY (box_id),
    box_id UUID,
    name   TEXT NOT NULL
);

CREATE TABLE box_files (
    PRIMARY KEY (box_id, file_id),
    box_id  UUID,
    file_id UUID
);

CREATE TABLE file_tags (
    PRIMARY KEY (box_id, file_id, tag),
    box_id  UUID,
    file_id UUID,
    tag     TEXT
);
