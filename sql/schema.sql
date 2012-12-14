DROP   TABLE books;
CREATE TABLE books (
  id     BIGSERIAL NOT NULL PRIMARY KEY,
  name   TEXT      NOT NULL,
  author TEXT      NOT NULL
);
GRANT ALL ON books TO pguser;
GRANT USAGE, SELECT ON SEQUENCE books_id_seq to pguser;
