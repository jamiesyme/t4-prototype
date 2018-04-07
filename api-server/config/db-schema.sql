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
