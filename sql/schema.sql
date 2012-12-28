DROP   TABLE books;
CREATE TABLE books (
  id        BIGSERIAL NOT NULL PRIMARY KEY,
  book      TEXT      NOT NULL,
  author    TEXT      NOT NULL,
  catid     BIGINT    NOT NULL,
  published DATE      NOT NULL
);
GRANT ALL ON books TO pguser;
GRANT USAGE, SELECT ON SEQUENCE books_id_seq TO pguser;

DROP   TABLE category;
CREATE TABLE category (
  id        BIGSERIAL NOT NULL PRIMARY KEY,
  cat       TEXT      NOT NULL
);
GRANT ALL ON category TO pguser;
GRANT USAGE, SELECT ON SEQUENCE category_id_seq TO pguser;
